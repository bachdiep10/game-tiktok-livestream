// Gửi email qua SMTP (Gmail: smtp.gmail.com, cổng 465, mật khẩu ứng dụng 16 ký tự).
// Tự viết gọn, không cần cài thêm thư viện: máy chủ Hostinger dùng lại node_modules cũ khi cập nhật.
import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';

const b64 = (s) => Buffer.from(String(s), 'utf8').toString('base64');
const encWord = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const wrap76 = (s) => s.replace(/.{1,76}/g, '$&\r\n');

// Đọc từng phản hồi SMTP (có thể nhiều dòng "250-...", kết thúc bằng "250 ...")
function reader(sock) {
  let buf = '';
  let waiting = null;
  const lines = [];
  const pump = () => {
    if (!waiting) return;
    const i = lines.findIndex(l => /^\d{3} /.test(l) || /^\d{3}$/.test(l));
    if (i < 0) return;
    const part = lines.splice(0, i + 1);
    const w = waiting; waiting = null;
    w.resolve({ code: Number(part[i].slice(0, 3)), text: part.join('\n') });
  };
  const onData = (d) => {
    buf += d.toString('utf8');
    let k;
    while ((k = buf.indexOf('\n')) >= 0) { lines.push(buf.slice(0, k).replace(/\r$/, '')); buf = buf.slice(k + 1); }
    pump();
  };
  sock.on('data', onData);
  return {
    next(timeout = 20000) {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => { waiting = null; reject(new Error('Máy chủ email không trả lời')); }, timeout);
        waiting = { resolve: (v) => { clearTimeout(t); resolve(v); } };
        pump();
      });
    },
    detach() { sock.off('data', onData); },
  };
}

function connect(host, port, secure) {
  return new Promise((resolve, reject) => {
    const s = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    s.setTimeout(30000, () => s.destroy(new Error('Hết thời gian kết nối máy chủ email')));
    s.once(secure ? 'secureConnect' : 'connect', () => resolve(s));
    s.once('error', reject);
  });
}

// Mở phiên đã đăng nhập; trả về { send(msg), close() }
export async function openSmtp({ host = 'smtp.gmail.com', port = 465, user, pass }) {
  if (!user || !pass) throw new Error('Chưa nhập Gmail và mật khẩu ứng dụng để gửi email.');
  port = Number(port) || 465;
  let sock = await connect(host, port, port === 465);
  let rd = reader(sock);
  const cmd = async (line, ok, hide) => {
    if (line !== null) sock.write(`${line}\r\n`);
    const r = await rd.next();
    if (!ok.includes(r.code)) throw new Error(`Email lỗi ở bước ${hide || String(line).split(' ')[0]}: ${r.text.slice(0, 200)}`);
    return r;
  };
  try {
    await cmd(null, [220], 'kết nối');
    let ehlo = await cmd('EHLO netxioviet', [250]);
    if (port !== 465 && /STARTTLS/i.test(ehlo.text)) {
      await cmd('STARTTLS', [220]);
      rd.detach();
      sock = await new Promise((resolve, reject) => {
        const t = tls.connect({ socket: sock, servername: host }, () => resolve(t));
        t.once('error', reject);
      });
      rd = reader(sock);
      ehlo = await cmd('EHLO netxioviet', [250]);
    }
    await cmd('AUTH LOGIN', [334]);
    await cmd(b64(user), [334], 'tên đăng nhập');
    await cmd(b64(pass), [235], 'mật khẩu (kiểm tra lại mật khẩu ứng dụng Gmail)');
  } catch (e) { sock.destroy(); throw e; }

  return {
    async send({ fromName, to, subject, text, html, replyTo }) {
      const boundary = `b_${crypto.randomBytes(8).toString('hex')}`;
      const headers = [
        `From: ${encWord(fromName || user)} <${user}>`,
        `To: <${to}>`,
        ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
        `Subject: ${encWord(subject)}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${crypto.randomBytes(12).toString('hex')}@${user.split('@')[1] || 'mail'}>`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ];
      const body = [
        `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(text)),
        `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(html)),
        `--${boundary}--`, '',
      ];
      await cmd(`MAIL FROM:<${user}>`, [250]);
      await cmd(`RCPT TO:<${to}>`, [250, 251], 'người nhận');
      await cmd('DATA', [354]);
      sock.write(`${headers.join('\r\n')}\r\n\r\n${body.join('\r\n')}\r\n.\r\n`);
      await cmd(null, [250], 'gửi nội dung');
    },
    async close() { try { sock.write('QUIT\r\n'); } catch { /* bỏ qua */ } setTimeout(() => sock.destroy(), 200).unref(); },
  };
}
