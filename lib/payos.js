// Tích hợp PayOS (payos.vn): tạo link thanh toán QR, kiểm tra trạng thái, xác minh webhook.
import crypto from 'node:crypto';

const API = 'https://api-merchant.payos.vn';

const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest('hex');

export function isConfigured(s) {
  return Boolean(s.payosClientId && s.payosApiKey && s.payosChecksumKey);
}

function headers(s) {
  return { 'Content-Type': 'application/json', 'x-client-id': s.payosClientId, 'x-api-key': s.payosApiKey };
}

export async function createPaymentLink(s, { orderCode, amount, description, returnUrl, cancelUrl, buyerName, buyerPhone, buyerEmail }) {
  const signData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  const body = {
    orderCode, amount, description, returnUrl, cancelUrl,
    buyerName: buyerName || undefined, buyerPhone: buyerPhone || undefined, buyerEmail: buyerEmail || undefined,
    signature: hmac(s.payosChecksumKey, signData),
  };
  const res = await fetch(`${API}/v2/payment-requests`, { method: 'POST', headers: headers(s), body: JSON.stringify(body) });
  const json = await res.json();
  if (json.code !== '00') throw new Error(`PayOS: ${json.desc || 'lỗi tạo link'}`);
  return json.data; // { checkoutUrl, qrCode, paymentLinkId, ... }
}

export async function getPaymentStatus(s, orderCode) {
  const res = await fetch(`${API}/v2/payment-requests/${orderCode}`, { headers: headers(s) });
  const json = await res.json();
  if (json.code !== '00') throw new Error(`PayOS: ${json.desc || 'lỗi tra cứu'}`);
  return json.data; // { status: 'PAID' | 'PENDING' | 'CANCELLED' ..., amountPaid }
}

// Webhook PayOS: chữ ký = HMAC_SHA256(checksumKey, các trường của data xếp theo tên, nối key=value&...)
export function verifyWebhook(s, payload) {
  if (!payload || !payload.data || !payload.signature) return false;
  const d = payload.data;
  const str = Object.keys(d).sort().map(k => {
    let v = d[k];
    if (v === null || v === undefined || v === 'undefined' || v === 'null') v = '';
    else if (typeof v === 'object') v = JSON.stringify(v);
    return `${k}=${v}`;
  }).join('&');
  const expect = hmac(s.payosChecksumKey, str);
  const a = Buffer.from(expect), b = Buffer.from(String(payload.signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
