// Thêm mục Từ điển ngay trong popup cấu hình bước.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { runScripts: 'dangerously', url: 'https://x.test/#quy-trinh', pretendToBeVisual: true,
  beforeParse(win){ win.TextEncoder = require('util').TextEncoder; win.matchMedia = () => ({ matches: false }); } });
const w = dom.window, d = w.document; const errs = [];
w.addEventListener('error', e => errs.push('ERR ' + e.message));
w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
const q = s => d.querySelector(s);
const click = sel => { const el = typeof sel === 'string' ? q(sel) : sel; if (!el) throw new Error('khong thay ' + sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const set = (sel, v) => { const el = q(sel); if (!el) throw new Error('khong thay ' + sel); if (el.type === 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
const T = (name, fn) => { try { fn(); console.log('OK   ' + name); } catch (e) { console.log('FAIL ' + name + ' -> ' + e.message); errs.push(name); } };
const capOpen = k => { const c = q('#cap-' + k); if (!c.checked){ c.checked = true; c.dispatchEvent(new w.Event('change', { bubbles: true })); } if (q('#capmodal').hidden) click('[data-act="capopen"][data-k="' + k + '"]'); };

setTimeout(() => {
  T('mẫu AI: chọn "Thêm mới" -> hộp nhập, giữ nguyên lựa chọn cũ khi huỷ', () => {
    click('tr[data-pid="kho-nhap-vt"]');
    capOpen('ai');
    const sel = q('#f-ai');
    if (!sel.querySelector('option[value="__new__:ai"]')) throw new Error('khong co dong them moi');
    const before = sel.value;
    set('#f-ai', '__new__:ai');
    if (q('#dlg').hidden || !/Thêm vào Từ điển: Mẫu AI/.test(q('#dlg-title').textContent)) throw new Error('khong mo hop nhap');
    if (q('#f-ai').value !== before) throw new Error('o chon bi doi thanh __new__');
    click('#dlg-cancel');
    if (!q('#dlg').hidden) throw new Error('khong dong');
  });
  T('mẫu AI: thiếu / trùng tên bị chặn; thêm xong được chọn luôn, popup cấu hình vẫn mở, Từ điển có mục mới', () => {
    set('#f-ai', '__new__:ai');
    click('#dlg-ok'); if (!/Cần tên gọi/.test(q('#dlg-err').textContent)) throw new Error('khong chan ten trong');
    q('#dlg-dk').value = 'Kho – đọc chứng từ đề xuất'; click('#dlg-ok');
    if (!/Đã có mục/.test(q('#dlg-err').textContent)) throw new Error('khong chan trung');
    q('#dlg-dk').value = 'Kho – đọc hoá đơn'; q('#dlg-dv').value = 'Đọc hoá đơn đính kèm, lấy số và ngày hoá đơn.';
    click('#dlg-ok'); if (!/ít nhất 1 trường/.test(q('#dlg-err').textContent)) throw new Error('khong chan thieu truong');
    const cb = q('[data-dout]'); if (cb) cb.checked = true; else q('#dlg-dout').value = 'service_so_hoa_don';
    q('#dlg-dout').value = 'service_so_hoa_don';
    click('#dlg-ok');
    if (!q('#dlg').hidden) throw new Error('khong luu: ' + q('#dlg-err').textContent);
    if (q('#capmodal').hidden) throw new Error('popup cau hinh bi dong');
    if (q('#f-ai').value !== 'Kho – đọc hoá đơn') throw new Error('chua chon muc moi: ' + q('#f-ai').value);
    if (d.querySelectorAll('.aimap-r').length !== (cb ? 2 : 1)) throw new Error('bang doi chieu khong theo mau moi');
  });
  T('đối chiếu AI -> Base: thêm dòng bằng ＋, chọn trường Base, trùng thì cảnh báo, chuỗi doc_ai mang ket_qua, về mặc định', () => {
    const n = d.querySelectorAll('.aimap-r').length;
    click('[data-act="aimap-add"]');
    if (d.querySelectorAll('.aimap-r').length !== n + 1) throw new Error('khong them dong');
    set('[data-aimap="' + n + '.ai"]', 'ngay');
    const first = q('[data-aimap="0.truong"]').value;
    const opt = Array.from(q('[data-aimap="' + n + '.truong"]').options).find(o => o.value && o.value !== first);
    set('[data-aimap="' + n + '.truong"]', opt.value);
    if (!/Riêng bước này/.test(q('#cm-body').textContent)) throw new Error('khong danh dau rieng');
    set('[data-aimap="' + n + '.truong"]', first);
    if (!/đang nhận từ 2 kết quả AI/.test(q('#cm-body').textContent)) throw new Error('khong canh bao trung');
    set('[data-aimap="' + n + '.truong"]', opt.value);
    click('[data-act="capclose"]'); click('[data-act="capopen"][data-k="chain"]');
    if (!new RegExp('Ghi ' + (n + 1) + ' trường: .*ngay →').test(q('#cm-body').textContent)) throw new Error('chuoi khong co ket_qua: ' + q('#cm-body').textContent.slice(0, 300));
    click('[data-act="capclose"]'); click('[data-act="capopen"][data-k="ai"]');
    click('[data-act="aimap-rm"][data-i="' + n + '"]');
    if (d.querySelectorAll('.aimap-r').length !== n) throw new Error('khong bo dong');
    click('[data-act="aimap-reset"]');
    if (/Riêng bước này/.test(q('#cm-body').textContent)) throw new Error('khong ve mac dinh');
  });
  T('thư mục lưu + mẫu tên: thêm mới được chọn luôn, mẫu tên điền vào khuôn', () => {
    click('[data-act="capclose"]'); capOpen('file');
    set('#f-drive', '__new__:thumuc');
    q('#dlg-dk').value = 'Kho – Hoá đơn'; q('#dlg-dv').value = 'Shared drives\\0. BHCK - 1. MASTER DATA\\06_KHO_VAN\\Hoa don\\{yyyy}'; click('#dlg-ok');
    if (q('#f-drive').value !== 'Kho – Hoá đơn') throw new Error('thu muc chua chon');
    click('[data-act="capclose"]'); capOpen('ten');
    set('#f-nameref', '__new__:ten');
    q('#dlg-dk').value = 'Kho – Hoá đơn'; q('#dlg-dv').value = 'HOÁ ĐƠN - Số {service_so_hoa_don}'; click('#dlg-ok');
    if (q('#f-nameref').value !== 'Kho – Hoá đơn' || q('#f-name').value !== 'HOÁ ĐƠN - Số {service_so_hoa_don}') throw new Error('mau ten chua ap');
    click('[data-act="capclose"]');
  });
  T('tab Từ điển thấy mục mới; xuất bản liệt kê Từ điển', () => {
    w.location.hash = 'tu-dien'; w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    click('[data-act="dtab"][data-v="ai"]');
    if (!/Kho – đọc hoá đơn/.test(d.body.textContent)) throw new Error('tu dien khong co muc moi');
    click('#publish'); if (!/Từ điển/.test(q('#dlg-body').textContent)) throw new Error('xuat ban khong ghi'); click('#dlg-cancel');
  });
  if (errs.length) { console.log('\nLOI: ' + errs.join(' | ')); process.exit(1); }
  console.log('\nTAT CA OK');
}, 300);
