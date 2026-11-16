// Tách trường ghi vào bảng dữ liệu và trường ghi ngược lên Base.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { runScripts: 'dangerously', url: 'https://x.test/#quy-trinh', pretendToBeVisual: true,
  beforeParse(win){ win.TextEncoder = require('util').TextEncoder; win.matchMedia = () => ({ matches: false }); } });
const w = dom.window, d = w.document; const errs = [];
w.addEventListener('error', e => errs.push('ERR ' + e.message));
w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
const q = s => d.querySelector(s), qa = s => Array.from(d.querySelectorAll(s));
const click = sel => { const el = typeof sel === 'string' ? q(sel) : sel; if (!el) throw new Error('khong thay ' + sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const T = (name, fn) => { try { fn(); console.log('OK   ' + name); } catch (e) { console.log('FAIL ' + name + ' -> ' + e.message); errs.push(name); } };
const chainText = () => { click('[data-act="capclose"]'); click('[data-act="capopen"][data-k="chain"]'); const t = q('#cm-body').textContent; click('[data-act="capclose"]'); click('[data-act="capopen"][data-k="truong"]'); return t; };

setTimeout(() => {
  T('popup Lưu dữ liệu phiếu có 2 phần; mặc định ghi ngược tất cả như cũ, chuỗi không đổi', () => {
    click('tr[data-pid="kho-nhap-vt"]');
    click('[data-act="capopen"][data-k="truong"]');
    const t = q('#cm-body').textContent;
    if (!/1\. Ghi vào bảng dữ liệu/.test(t) || !/2\. Ghi ngược lên Base/.test(t)) throw new Error('thieu 2 phan');
    if (q('[data-act="pushmode"][data-v="tat_ca"]').getAttribute('aria-pressed') !== 'true') throw new Error('mac dinh khong phai tat ca');
    if (/Chỉ ghi ngược|Không ghi ngược trường nào/.test(chainText())) throw new Error('chuoi bi doi khi chua chon');
  });
  T('chọn trường: bỏ tick 1 trường -> chuỗi dong_bo_base chỉ ghi ngược số còn lại, thẻ tóm tắt đổi', () => {
    click('[data-act="capclose"]');
    const rail = qa('#rail .step');
    for (let i = 0; i < rail.length; i++){
      click(qa('#rail .step')[i]);
      const cap = q('#cap-truong'); if (!cap) continue;
      if (!cap.checked){ cap.checked = true; cap.dispatchEvent(new w.Event('change', { bubbles: true })); }
      if (q('#capmodal').hidden) click('[data-act="capopen"][data-k="truong"]');
      if (qa('#fchips .fchip').length >= 2) break;
      click('[data-act="capclose"]');
    }
    click('[data-act="pushmode"][data-v="chon"]');
    const boxes = qa('[data-push]'); if (boxes.length < 2) throw new Error('it truong: ' + boxes.length);
    if (!boxes.every(b => b.checked)) throw new Error('mac dinh phai tick het');
    boxes[0].checked = false; boxes[0].dispatchEvent(new w.Event('change', { bubbles: true }));
    const n = boxes.length - 1;
    if (!new RegExp(n + '/' + boxes.length + ' trường sẽ ghi ngược').test(q('#cm-body').textContent)) throw new Error('khong dem lai');
    if (!new RegExp('Chỉ ghi ngược ' + n + ' trường').test(chainText())) throw new Error('chuoi khong loc');
    if (!new RegExp('Base: ghi ngược ' + n + ' trường').test(q('[data-act="capopen"][data-k="truong"]').textContent)) throw new Error('the tom tat');
  });
  T('trường ghi vào DB: ghi ngược đúng các trường phần 1, bỏ 1 trường ở phần 1 thì chuỗi đổi theo', () => {
    click('[data-act="pushmode"][data-v="db"]');
    const n = qa('#fchips .fchip').length;
    if (!new RegExp('Ghi ngược đúng ' + n + ' trường ở phần 1').test(q('#cm-body').textContent)) throw new Error('khong hien so truong');
    if (!new RegExp('Chỉ ghi ngược ' + n + ' trường').test(chainText())) throw new Error('chuoi khong theo DB');
    click('#fchips [data-act="rmfield"]');
    const ct = chainText(); if (!new RegExp('Chỉ ghi ngược ' + (n - 1) + ' trường').test(ct)) throw new Error('khong doi theo phan 1: n=' + n + ' ' + ct.slice(ct.indexOf('Đồng bộ'), ct.indexOf('Đồng bộ') + 200));
    if (!/Base: ghi ngược trường DB/.test(q('[data-act="capopen"][data-k="truong"]').textContent)) throw new Error('the tom tat');
  });
  T('không ghi ngược: chuỗi ghi rõ chỉ tên / nội dung; đổi lại tất cả thì bỏ lọc', () => {
    click('[data-act="pushmode"][data-v="khong"]');
    if (!/Không ghi ngược trường nào/.test(chainText())) throw new Error('chuoi khong ghi ro');
    click('[data-act="pushmode"][data-v="tat_ca"]');
    if (/Chỉ ghi ngược|Không ghi ngược trường nào/.test(chainText())) throw new Error('khong bo loc');
  });
  T('văn thư: mẫu chuỗi có sẵn cũng nhận lọc ghi ngược', () => {
    click('[data-act="capclose"]'); click('[data-act="back"]'); click('tr[data-pid="vtd-du"]');
    const st = qa('#rail .step').find(x => /Xử lý văn thư/.test(x.textContent)); click(st);
    const cap = q('#cap-truong'); if (!cap.checked){ cap.checked = true; cap.dispatchEvent(new w.Event('change', { bubbles: true })); }
    if (q('#capmodal').hidden) click('[data-act="capopen"][data-k="truong"]');
    click('[data-act="pushmode"][data-v="khong"]');
    if (!/Không ghi ngược trường nào/.test(chainText())) throw new Error('van thu khong loc');
    click('[data-act="capclose"]');
  });
  if (errs.length) { console.log('\nLOI: ' + errs.join(' | ')); process.exit(1); }
  console.log('\nTAT CA OK');
}, 300);
