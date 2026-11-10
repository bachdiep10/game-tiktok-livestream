// Trang Ngân hàng đề thi: thêm/sửa/xoá câu hỏi riêng, nhập từ Excel/CSV, chọn môn dùng khi LIVE.
import { CAU_HOI } from './cauHoi.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const noAccent = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();
let data = { cauHoi: [], monChon: [], chiDungCauTuThem: false };
let loaded = false;

const builtinMons = {};
for (const r of CAU_HOI) builtinMons[r[0]] = (builtinMons[r[0]] || 0) + 1;
$('#builtinCount').textContent = CAU_HOI.length;

function setState(text, cls = '') {
  const el = $('#saveState');
  el.textContent = text;
  el.className = cls;
}

async function load() {
  try {
    const r = await fetch('/lop-hoc-de-thi.json', { cache: 'no-store' });
    data = { ...data, ...(await r.json()) };
    loaded = true;
    setState(`Đã tải ${data.cauHoi.length} câu tự thêm.`, 'ok');
  } catch {
    setState('Không đọc được ngân hàng đề (cửa sổ đen run-lop-hoc.bat có đang chạy không?)', 'err');
  }
  render();
}

let saveTimer = null;
function save() {
  if (!loaded) return;
  clearTimeout(saveTimer);
  setState('Đang lưu...');
  saveTimer = setTimeout(async () => {
    try {
      const r = await fetch('/lop-hoc-de-thi.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'lỗi');
      setState(`✔ Đã lưu ${j.count} câu tự thêm (${new Date().toLocaleTimeString('vi-VN')}). Game dùng từ tiết sau.`, 'ok');
    } catch (e) {
      setState(`✖ Lưu không được: ${e.message}`, 'err');
    }
  }, 300);
}

function allMons() {
  const m = { ...builtinMons };
  for (const c of data.cauHoi) m[c.mon || 'Tự thêm'] = (m[c.mon || 'Tự thêm'] || 0) + 1;
  return m;
}

function render() {
  const mons = allMons();
  $('#mons').innerHTML = Object.entries(mons).map(([m, n]) => `<label><input type="checkbox" value="${esc(m)}" ${data.monChon.includes(m) ? 'checked' : ''}> ${esc(m)} <span class="pill">${n}</span></label>`).join('');
  $('#mons').querySelectorAll('input').forEach((i) => i.addEventListener('change', () => {
    data.monChon = [...$('#mons').querySelectorAll('input:checked')].map((x) => x.value);
    save();
  }));
  $('#monList').innerHTML = Object.keys(mons).map((m) => `<option value="${esc(m)}">`).join('');
  $('#onlyCustom').checked = !!data.chiDungCauTuThem;
  $('#customCount').textContent = data.cauHoi.length;
  const kw = noAccent($('#search').value);
  const rows = data.cauHoi.map((c, i) => [c, i]).filter(([c]) => !kw || noAccent(`${c.cauHoi} ${c.A} ${c.B} ${c.C} ${c.D} ${c.mon}`).includes(kw));
  $('#list').innerHTML = rows.length ? rows.map(([c, i]) => `<tr><td>${i + 1}</td><td>${esc(c.cauHoi)}${c.meo ? ' <span class="pill">mẹo</span>' : ''}</td>${['A', 'B', 'C', 'D'].map((L) => `<td class="${c.dapAn === L ? 'ok' : ''}">${esc(c[L])}</td>`).join('')}<td class="ok">${esc(c.dapAn)}</td><td>${esc(c.mon)}${c.lop ? ` ${esc(c.lop)}` : ''}</td><td><button class="small" data-edit="${i}">Sửa</button> <button class="small" data-del="${i}">Xoá</button></td></tr>`).join('')
    : '<tr><td colspan="9" class="hint">Chưa có câu hỏi nào. Thêm ở mục 2 hoặc nhập từ Excel ở mục 3.</td></tr>';
  $('#list').querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => edit(Number(b.dataset.edit))));
  $('#list').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.del);
    if (!confirm(`Xoá câu: "${data.cauHoi[i].cauHoi}"?`)) return;
    data.cauHoi.splice(i, 1);
    save();
    render();
  }));
}

$('#onlyCustom').addEventListener('change', (e) => {
  data.chiDungCauTuThem = e.target.checked;
  save();
});
$('#search').addEventListener('input', render);

function readForm() {
  return {
    cauHoi: $('#fQ').value.trim(), A: $('#fA').value.trim(), B: $('#fB').value.trim(), C: $('#fC').value.trim(), D: $('#fD').value.trim(),
    dapAn: document.querySelector('input[name=dung]:checked').value, mon: $('#fMon').value.trim() || 'Tự thêm', lop: $('#fLop').value.trim(),
    doKho: Number($('#fKho').value) || 2, giaiThich: $('#fGiai').value.trim(), meo: $('#fMeo').value === '1',
  };
}
function fillForm(c) {
  $('#fQ').value = c?.cauHoi || '';
  for (const L of ['A', 'B', 'C', 'D']) $(`#f${L}`).value = c?.[L] || '';
  document.querySelector(`input[name=dung][value=${c?.dapAn || 'A'}]`).checked = true;
  $('#fMon').value = c?.mon || $('#fMon').value;
  $('#fLop').value = c?.lop || $('#fLop').value;
  $('#fKho').value = String(c?.doKho || 2);
  $('#fGiai').value = c?.giaiThich || '';
  $('#fMeo').value = c?.meo ? '1' : '';
}
function edit(i) {
  $('#editIdx').value = String(i);
  fillForm(data.cauHoi[i]);
  $('#btnSaveQ').textContent = '💾 Lưu câu đã sửa';
  $('#btnCancel').style.display = '';
  $('#fQ').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
$('#btnCancel').addEventListener('click', () => {
  $('#editIdx').value = '-1';
  fillForm(null);
  $('#btnSaveQ').textContent = '➕ Thêm câu hỏi';
  $('#btnCancel').style.display = 'none';
});
$('#btnSaveQ').addEventListener('click', () => {
  const c = readForm();
  if (!c.cauHoi || !c.A || !c.B || !c.C || !c.D) {
    alert('Hãy nhập câu hỏi và đủ 4 đáp án A, B, C, D.');
    return;
  }
  const i = Number($('#editIdx').value);
  if (i >= 0) data.cauHoi[i] = c;
  else data.cauHoi.push(c);
  $('#btnCancel').click();
  save();
  render();
});

// ------------------------------------------------ nhập CSV / dán từ Excel
function parseTable(text) {
  text = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const first = text.split('\n')[0] || '';
  const sep = first.includes('\t') ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') quoted = false; else cur += ch;
    } else if (ch === '"' && cur === '') quoted = true;
    else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
const HEAD = { 'cau hoi': 0, a: 1, b: 2, c: 3, d: 4, 'dap an': 5, 'dap an dung': 5, mon: 6, lop: 7, 'do kho': 8, 'giai thich': 9, meo: 10, loai: 10 };
function rowsToQuestions(rows) {
  let map = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (rows.length && rows[0].some((c) => noAccent(c).startsWith('cau hoi'))) {
    const h = rows.shift().map((c) => noAccent(c).replace(/\(.*\)/, '').trim());
    map = Array(11).fill(-1);
    h.forEach((name, col) => {
      const k = Object.keys(HEAD).find((key) => name === key || name.startsWith(`${key} `));
      if (k != null && map[HEAD[k]] < 0) map[HEAD[k]] = col;
    });
  }
  const get = (r, k) => (map[k] >= 0 ? String(r[map[k]] ?? '').trim() : '');
  const out = [];
  const bad = [];
  rows.forEach((r, i) => {
    let dap = noAccent(get(r, 5)).toUpperCase().replace(/[^ABCD1-4]/g, '')[0] || '';
    if (/[1-4]/.test(dap)) dap = 'ABCD'[Number(dap) - 1];
    const c = {
      cauHoi: get(r, 0), A: get(r, 1), B: get(r, 2), C: get(r, 3), D: get(r, 4), dapAn: dap, mon: get(r, 6) || 'Tự thêm', lop: get(r, 7),
      doKho: Math.max(1, Math.min(3, Number(get(r, 8)) || 2)), giaiThich: get(r, 9), meo: /meo|mẹo|x|1|co/i.test(get(r, 10)),
    };
    if (!c.cauHoi || !c.A || !c.B || !c.C || !c.D || !c.dapAn) bad.push(i + 1);
    else out.push(c);
  });
  return { out, bad };
}
function importText(text) {
  const { out, bad } = rowsToQuestions(parseTable(text));
  if (!out.length) {
    $('#importInfo').textContent = `Không đọc được câu nào. Kiểm tra lại thứ tự cột.${bad.length ? ` Dòng lỗi: ${bad.slice(0, 10).join(', ')}` : ''}`;
    return;
  }
  data.cauHoi.push(...out);
  $('#importInfo').textContent = `✔ Đã thêm ${out.length} câu.${bad.length ? ` Bỏ qua ${bad.length} dòng thiếu dữ liệu (dòng ${bad.slice(0, 10).join(', ')}).` : ''}`;
  $('#paste').value = '';
  save();
  render();
}
$('#btnImport').addEventListener('click', () => importText($('#paste').value));
$('#csvFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  importText(await f.text());
  e.target.value = '';
});
const COLS = ['Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án đúng', 'Môn', 'Lớp', 'Độ khó', 'Giải thích', 'Mẹo'];
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
function download(name, rows) {
  const text = `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
}
$('#btnTemplate').addEventListener('click', () => download('mau-de-thi.csv', [COLS,
  ['12 cộng 18 bằng bao nhiêu?', '20', '30', '28', '32', 'B', 'Toán', '1', '1', '12 + 18 = 30', ''],
  ['Con gì đầu dê mình ốc?', 'Con dốc', 'Con dê', 'Con ốc', 'Con sên', 'A', 'Đố mẹo', '', '2', '', 'meo'],
]));
$('#btnExport').addEventListener('click', () => download('de-thi-cua-toi.csv', [COLS, ...data.cauHoi.map((c) => [c.cauHoi, c.A, c.B, c.C, c.D, c.dapAn, c.mon, c.lop, c.doKho, c.giaiThich, c.meo ? 'meo' : ''])]));
$('#btnClear').addEventListener('click', () => {
  if (!data.cauHoi.length || !confirm(`Xoá hết ${data.cauHoi.length} câu tự thêm? (Nên bấm "Xuất ra CSV" để giữ bản sao trước)`)) return;
  data.cauHoi = [];
  save();
  render();
});

load();
