// Giao diện sáng mặc định; lịch tạo phiếu tự động cài trên trang quy trình.
const fs = require('fs'); const { JSDOM } = require('jsdom');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { runScripts: 'dangerously', url: 'https://x.test/#quy-trinh', pretendToBeVisual: true,
  beforeParse(win){ win.TextEncoder = require('util').TextEncoder; win.matchMedia = () => ({ matches: true }); } });
const w = dom.window, d = w.document; const errs = [];
w.addEventListener('error', e => errs.push('ERR ' + e.message));
w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
const q = s => d.querySelector(s);
const click = sel => { const el = typeof sel === 'string' ? q(sel) : sel; if (!el) throw new Error('khong thay ' + sel); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const set = (sel, v) => { const el = q(sel); if (!el) throw new Error('khong thay ' + sel); if (el.type === 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
const T = (name, fn) => { try { fn(); console.log('OK   ' + name); } catch (e) { console.log('FAIL ' + name + ' -> ' + e.message); errs.push(name); } };

setTimeout(() => {
  T('máy để chế độ tối vẫn mở giao diện sáng; bấm nút mới sang tối', () => {
    if (d.documentElement.dataset.theme === 'dark') throw new Error('mac dinh toi');
    if (/prefers-color-scheme/.test(html)) throw new Error('van theo mau may');
    click('[data-act="theme"]');
    if (d.documentElement.dataset.theme !== 'dark') throw new Error('khong sang toi');
    click('[data-act="theme"]');
    if (d.documentElement.dataset.theme !== 'light') throw new Error('khong ve sang');
  });
  T('quy trình có lịch: dòng tóm tắt ghi giờ, lần tới, kết quả gần nhất', () => {
    click('tr[data-pid="bc-cb"]');
    const t = q('[data-act="lichtao"]').textContent;
    if (!/Hằng ngày lúc 07:00/.test(t) || !/lần tới/.test(t) || !/thành công/.test(t)) throw new Error(t);
  });
  T('đặt lịch mới: tuần T2/T4, thiếu tài khoản bị chặn, xem trước tên phiếu theo ngày, lưu xong dòng tóm tắt đổi', () => {
    click('[data-act="back"]'); click('tr[data-pid="kho-nhap-vt"]');
    if (!/Chưa đặt/.test(q('[data-act="lichtao"]').textContent)) throw new Error('khong bao chua dat');
    click('[data-act="lichtao"]');
    if (q('#dlg').hidden) throw new Error('khong mo hop thoai');
    set('#dlg-lloai', 'Tuần');
    if (q('#lt-tuan').hidden || !q('#lt-thang').hidden) throw new Error('khong doi o chon ngay');
    set('[data-ltd][value="2"]', true); set('[data-ltd][value="4"]', true);
    set('#dlg-lgio', '08:00');
    set('#dlg-ltenref', 'NHẬP VẬT TƯ - Duyệt phiếu nhập kho số {service_so_phieu} ngày {service_ngay_xuat_nhap}');
    set('#dlg-lten', 'Tổng hợp nhập kho ngày {dd/MM/yyyy}');
    if (!/Còn thiếu: tài khoản/.test(q('#lt-pv').textContent)) throw new Error('khong bao thieu: ' + q('#lt-pv').textContent);
    click('#dlg-ok');
    if (q('#dlg').hidden || !/tài khoản/.test(q('#dlg-err').textContent)) throw new Error('khong chan khi thieu');
    set('#dlg-ltk', 'tk.kho');
    const pv = q('#lt-pv').textContent;
    if (!/Lần chạy tới: (T2|T4) /.test(pv) || !/lúc 08:00/.test(pv) || !/Tổng hợp nhập kho ngày \d\d\/\d\d\/\d{4}/.test(pv)) throw new Error(pv);
    click('#dlg-ok');
    if (!q('#dlg').hidden) throw new Error('khong luu');
    const t = q('[data-act="lichtao"]').textContent;
    if (!/T2, T4 lúc 08:00/.test(t)) throw new Error(t);
  });
  T('tắt lịch: lưu được dù thiếu, dòng tóm tắt ghi đang tắt; xuất bản liệt kê "lịch tạo phiếu"', () => {
    click('[data-act="lichtao"]'); set('#dlg-lon', false); click('#dlg-ok');
    if (!/Đang tắt/.test(q('[data-act="lichtao"]').textContent)) throw new Error('khong tat');
    click('#publish');
    if (!/lịch tạo phiếu/.test(q('#dlg-body').textContent)) throw new Error('xuat ban khong ghi lich');
    click('#dlg-cancel');
  });
  if (errs.length) { console.log('\nLOI: ' + errs.join(' | ')); process.exit(1); }
  console.log('\nTAT CA OK');
}, 300);
