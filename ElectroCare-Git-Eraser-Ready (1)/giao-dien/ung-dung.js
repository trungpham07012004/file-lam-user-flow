const API=window.ELECTROCARE_API||`${window.location.protocol}//${window.location.hostname}:3000/api`;
const state={token:localStorage.getItem('ec_token'),user:JSON.parse(localStorage.getItem('ec_user')||'null'),view:'home',services:[],bookings:[],ai:null,selected:null};
const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=n=>Number(n||0).toLocaleString('vi-VN')+'đ';
const statusClass=s=>({'Đã đặt lịch':'blue','Đã phân công':'purple','Đang kiểm tra':'orange','Đang sửa chữa':'orange','Chờ duyệt báo giá':'yellow','Đã duyệt báo giá':'green','Hoàn thành':'green','Đã bàn giao':'green','Đã hủy':'red'}[s]||'blue');
async function api(path,opt={}){
  opt.headers={...(opt.headers||{}),...(state.token?{Authorization:`Bearer ${state.token}`}:{})};
  let r;
  try{
    r=await fetch(API+path,opt);
  }catch(e){
    // Network / CORS / server offline
    throw Error('Không thể kết nối máy chủ. Vui lòng kiểm tra backend đang chạy tại cổng 3000.');
  }
  const d=await r.json().catch(()=>({}));
  if(r.status===401){logout(true);throw Error(d.message||'Phiên đăng nhập đã hết hạn');}
  if(!r.ok)throw Error(d.message||'Có lỗi xảy ra');
  return d;
}
function toast(t,type=''){
  const x=document.createElement('div');
  x.className='toast'+(type?' '+type:'');
  x.textContent=t;
  document.body.appendChild(x);
  setTimeout(()=>x.remove(),type==='error'?4000:2800);
}
function logout(silent=false){localStorage.removeItem('ec_token');localStorage.removeItem('ec_user');state.token=null;state.user=null;if(!silent)toast('Đã đăng xuất');go('home')}
async function go(view){state.view=view;await render();window.scrollTo({top:0,behavior:'smooth'});}
async function dashboard(){if(!state.user)return `<div class="page"><div class="wrap narrow"><div class="emptyCard"><h2>Đăng nhập để tiếp tục</h2><button class="btn" onclick="go('auth')">Đăng nhập</button></div></div></div>`;if(state.user.role==='staff')return await staffDash();if(state.user.role==='admin')return await adminDash();return await customerDash();}
function nav(){return `<header class="top"><div class="wrap navrow"><button class="brand" onclick="go('home')"><span class="logo">EC</span><span><strong>ElectroCare</strong><small>Sửa chữa điện tử thông minh</small></span></button><nav><button onclick="go('services')">Dịch vụ</button><button onclick="go('stores')">Cửa hàng</button><button onclick="go('track')">Tra cứu sửa chữa</button><button onclick="go('warranty')">Bảo hành</button><button onclick="go('ai')">AI chẩn đoán</button>${state.user?`<button onclick="go('dashboard')">${state.user.role==='admin'?'Quản trị':state.user.role==='staff'?'Kỹ thuật':'Tài khoản'}</button><button class="btn small" onclick="logout()">Đăng xuất</button>`:`<button class="btn small" onclick="go('auth')">Đăng nhập</button>`}</nav><button class="hamb" onclick="document.querySelector('.top nav').classList.toggle('open')">☰</button></div></header>`}
function home(){return `<div class="home"><section class="hero"><div class="wrap heroGrid"><div class="heroCopy"><span class="eyebrow">DỊCH VỤ SỬA CHỮA ĐIỆN TỬ</span><h1>Thiết bị hỏng?<br><span>Để ElectroCare lo.</span></h1><p>Đặt lịch, nhận báo giá, theo dõi tiến độ và bảo hành trên một hệ thống duy nhất. Chẩn đoán AI chỉ mang tính tham khảo; kỹ thuật viên xác nhận trước khi sửa.</p><div class="actions"><button class="btn xl" onclick="go('booking')">Đặt lịch sửa chữa <span>→</span></button><button class="btn ghost xl" onclick="go('track')">Tra cứu phiếu</button></div><div class="trust"><span>✓ Kiểm tra minh bạch</span><span>✓ Báo giá trước khi sửa</span><span>✓ Theo dõi từng bước</span></div></div><div class="heroVisual"><div class="deviceCard"><div class="deviceTop"><span>ElectroCare</span><span class="live">● ONLINE</span></div><div class="deviceScreen"><div class="screenIcon">⌁</div><b>Repair tracking</b><span>EC-2026-482193</span><div class="progress"><i style="width:72%"></i></div><small>Đang sửa chữa · 72%</small></div><div class="deviceMeta"><span><b>2.4h</b><small>thời gian phản hồi</small></span><span><b>4.9/5</b><small>đánh giá dịch vụ</small></span></div></div><div class="floatCard"><span>🛠️</span><div><b>Đội ngũ kỹ thuật</b><small>Kiểm tra & sửa chữa chuyên nghiệp</small></div></div></div></div></section><section class="section"><div class="wrap"><div class="sectionHead"><div><span class="eyebrow">DỊCH VỤ</span><h2>Chúng tôi sửa gì?</h2></div><button class="linkBtn" onclick="go('services')">Xem tất cả →</button></div><div class="serviceGrid">${state.services.slice(0,6).map(serviceCard).join('')}</div></div></section><section class="section soft"><div class="wrap"><div class="sectionHead"><div><span class="eyebrow">ĐƠN GIẢN HÓA QUY TRÌNH</span><h2>Từ lỗi thiết bị đến lúc nhận máy</h2></div></div><div class="steps">${[['01','Đặt lịch','Chọn thiết bị, lỗi gặp phải và thời gian phù hợp.'],['02','Kiểm tra','Kỹ thuật viên kiểm tra thực tế và ghi nhận tình trạng.'],['03','Báo giá','Bạn xem chi phí và phê duyệt trước khi sửa.'],['04','Sửa & bàn giao','Theo dõi tiến độ, checklist và nhận bảo hành.']].map(x=>`<div class="step"><b>${x[0]}</b><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join('')}</div></div></section><section class="section"><div class="wrap featureBanner"><div><span class="eyebrow">AI ASSISTANT</span><h2>Không biết thiết bị bị gì?</h2><p>Mô tả triệu chứng hoặc tải ảnh để nhận hướng kiểm tra sơ bộ, dịch vụ gợi ý và khoảng giá tham khảo.</p><button class="btn" onclick="go('ai')">Thử AI chẩn đoán →</button></div><div class="aiOrb">✦</div></div></section><section class="section"><div class="wrap"><div class="sectionHead"><div><span class="eyebrow">MINH BẠCH</span><h2>Khách hàng luôn biết thiết bị đang ở đâu</h2></div></div><div class="benefits"><div>🔎<b>Tra cứu 24/7</b><span>Tra bằng mã phiếu hoặc số điện thoại.</span></div><div>💬<b>Báo giá trước</b><span>Không sửa ngoài phạm vi đã được duyệt.</span></div><div>🧾<b>Lịch sử đầy đủ</b><span>Nhật ký sửa chữa và checklist bàn giao.</span></div><div>🛡️<b>Bảo hành</b><span>Quản lý thời hạn bảo hành sau sửa.</span></div></div></div></section></div>`}
function serviceCard(s){return `<article class="serviceCard"><div class="serviceIcon">${s.icon||'🔧'}</div><span class="tag">${esc(s.category||'Sửa chữa')}</span><h3>${esc(s.name)}</h3><p>${esc(s.description||'Kiểm tra và xử lý bởi kỹ thuật viên.')}</p><div class="serviceBottom"><span>${money(s.price_min)} – ${money(s.price_max)}</span><button onclick="go('booking')">Đặt lịch →</button></div></article>`}
function services(){return `<div class="page"><div class="wrap"><div class="pageHead"><div><span class="eyebrow">DANH MỤC</span><h1>Dịch vụ & linh kiện</h1><p>Xem mức giá tham khảo, thông số và dung lượng trước khi đặt lịch.</p></div><button class="btn" onclick="go('booking')">Đặt lịch ngay</button></div><div class="sectionHead"><h2>Dịch vụ sửa chữa</h2></div><div class="serviceGrid full">${state.services.map(serviceCard).join('')}</div><div class="sectionHead" style="margin-top:45px"><div><span class="eyebrow">LINH KIỆN</span><h2>Danh mục linh kiện</h2></div></div><div class="card"><div class="partsToolbar"><input id="partSearch" placeholder="Tìm RAM, SSD, pin, quạt..."/><select id="partCategory"><option value="">Tất cả loại</option><option>RAM</option><option>SSD</option><option>Pin</option><option>Quạt</option><option>Màn hình</option><option>Khác</option></select><select id="partSort"><option value="name">Tên A → Z</option><option value="price_asc">Giá thấp → cao</option><option value="price_desc">Giá cao → thấp</option></select></div><div id="partsGrid" class="partsGrid"><div class="loading">Đang tải linh kiện...</div></div></div></div></div>`}
function booking(){if(!state.user)return `<div class="page"><div class="wrap narrow"><div class="emptyCard"><div class="emptyIcon">🔐</div><h2>Đăng nhập để đặt lịch</h2><p>Phiếu sửa chữa được lưu vào tài khoản để theo dõi toàn bộ quá trình.</p><button class="btn" onclick="showAuth('customer','login')">Đăng nhập</button></div></div></div>`;const min=new Date().toISOString().slice(0,10);const selected=(state.ai?.recommendedServices||[]).map(x=>Number(x.serviceId)).filter(Boolean);return `<div class="page"><div class="wrap narrowWide"><div class="pageHead compact"><div><span class="eyebrow">ĐẶT LỊCH SỬA CHỮA</span><h1>Chọn dịch vụ và thời gian</h1><p>Khách hàng có thể chọn một hoặc nhiều dịch vụ. Giá dưới đây là giá tham khảo từ danh mục ElectroCare.</p></div></div><div class="bookingLayout"><form class="form card" id="bookForm"><input type="hidden" name="service_ids" id="serviceIds"><div class="formSection"><h3>1. Thông tin thiết bị</h3><div class="two"><label>Thiết bị<input name="device" value="${esc(state.ai?.device||'')}" placeholder="Ví dụ: MacBook Air M2" required></label><label>Thương hiệu<input name="brand" placeholder="Apple, ASUS, Dell..." required></label></div><label>Số điện thoại<input name="phone" placeholder="09xxxxxxxx" required></label><label>Mô tả lỗi<textarea name="symptom" rows="4" required>${esc(state.ai?.symptom||'')}</textarea></label><label>Ảnh thiết bị<input name="image" type="file" accept="image/*"></label></div><div class="formSection"><h3>2. Dịch vụ cần thực hiện</h3><div class="servicePickGrid">${state.services.map(s=>`<label class="pickCard"><input type="checkbox" name="service_pick" value="${s.id}" ${selected.includes(Number(s.id))?'checked':''}><span><b>${esc(s.name)}</b><small>${esc(s.description||'')}</small><strong>${money(s.price_min)} – ${money(s.price_max)}</strong></span></label>`).join('')}</div><div class="priceSummary" id="priceSummary">Chưa chọn dịch vụ</div></div><div class="formSection"><h3>3. Thời gian nhận máy</h3><div class="two"><label>Ngày<input name="date" type="date" min="${min}" required></label><label>Giờ<input name="time" type="time" required></label></div><label>Dự kiến cần nhận máy trước (không bắt buộc)<input name="expected_handover_at" type="datetime-local"></label><label>Hình thức<select name="location"><option value="Cửa hàng">Mang đến cửa hàng</option><option value="Tại nhà">Kỹ thuật viên đến tận nơi</option></select></label></div><button class="btn xl fullBtn">Xác nhận đặt lịch →</button></form><aside class="bookingAside"><div class="sideCard"><span class="eyebrow">DANH MỤC LINH KIỆN</span><h3>Xem giá linh kiện</h3><p>RAM, SSD, pin, quạt và nhiều linh kiện có thể xem theo loại, giá và dung lượng.</p><button type="button" class="btn ghost" onclick="go('services')">Xem danh mục</button></div><div class="sideCard"><b>Quy trình minh bạch</b><p>Kỹ thuật viên kiểm tra thực tế → lập báo giá → khách hàng duyệt → sửa chữa → kiểm tra chất lượng → bàn giao.</p></div></aside></div></div></div>`}
function track(){return `<div class="page"><div class="wrap narrow"><div class="pageHead centered"><span class="eyebrow">REPAIR TRACKING</span><h1>Thiết bị của bạn đang ở đâu?</h1><p>Nhập mã phiếu để xem trạng thái, tiến độ, báo giá và lịch sử xử lý.</p></div><div class="trackSearch card"><form id="trackForm"><div class="searchInput"><span>⌕</span><input name="ticket" placeholder="EC-2026-482193" required><button class="btn">Tra cứu</button></div></form></div><div id="trackResult"></div></div></div>`}
function ai(){return `<div class="page"><div class="wrap narrowWide"><div class="pageHead centered"><span class="eyebrow">GEMINI AI</span><h1>Trợ lý chẩn đoán ElectroCare</h1><p>Phân tích bằng Gemini API thật. Kết quả là tham khảo; kỹ thuật viên vẫn phải kiểm tra thực tế.</p></div><div class="aiLayout"><form class="card form" id="aiForm"><label>Thiết bị<input name="device" placeholder="Ví dụ: ASUS TUF Gaming F15" required></label><label>Triệu chứng<textarea name="symptom" rows="7" placeholder="Máy nóng, quạt kêu, tự tắt sau 10 phút..." required></textarea></label><label>Ảnh thiết bị<input name="image" type="file" accept="image/*"></label><button class="btn xl">Phân tích bằng Gemini →</button></form><div id="aiResult" class="card aiResult"><div class="aiEmpty"><div class="aiOrb">✦</div><h3>Kết quả sẽ xuất hiện ở đây</h3><p>AI sẽ gợi ý nguyên nhân, dịch vụ, linh kiện có thể liên quan và giá tham khảo.</p></div></div></div></div></div>`}
function stores(){return `<div class="page"><div class="wrap"><div class="pageHead"><div><span class="eyebrow">HỆ THỐNG CỬA HÀNG</span><h1>Tìm điểm sửa chữa gần bạn</h1><p>Chọn cửa hàng phù hợp hoặc đặt lịch trước.</p></div></div><div id="storesGrid" class="storeGrid"><div class="loading">Đang tải cửa hàng...</div></div></div></div>`}
function warranty(){return `<div class="page"><div class="wrap narrow"><div class="pageHead centered"><span class="eyebrow">WARRANTY</span><h1>Tra cứu bảo hành</h1><p>Nhập mã phiếu sửa chữa để kiểm tra thời hạn bảo hành.</p></div><div class="trackSearch card"><form id="warrantyForm"><div class="searchInput"><span>🛡️</span><input name="ticket" placeholder="EC-2026-482193" required><button class="btn">Kiểm tra</button></div></form></div><div id="warrantyResult"></div></div></div>`}
async function customerDash(){state.bookings=await api('/bookings/mine');return `<div class="page"><div class="wrap"><div class="dashboardHead"><div><span class="eyebrow">KHU VỰC KHÁCH HÀNG</span><h1>Xin chào, ${esc(state.user.full_name)}</h1><p>Theo dõi lịch sửa chữa, báo giá, bàn giao và bảo hành.</p></div><button class="btn" onclick="go('booking')">+ Đặt lịch mới</button></div><div class="stats"><div><span>Tổng phiếu</span><b>${state.bookings.length}</b></div><div><span>Chưa bàn giao</span><b>${state.bookings.filter(x=>!['Đã bàn giao','Đã hủy'].includes(x.status)).length}</b></div><div><span>Chờ duyệt giá</span><b>${state.bookings.filter(x=>x.status==='Chờ duyệt báo giá').length}</b></div><div><span>Đã bàn giao</span><b>${state.bookings.filter(x=>x.status==='Đã bàn giao').length}</b></div></div><div class="tableWrap card"><table class="table"><thead><tr><th>Mã phiếu</th><th>Thiết bị</th><th>Lịch hẹn</th><th>Trạng thái</th><th>Tiến độ</th><th></th></tr></thead><tbody>${state.bookings.length?state.bookings.map(b=>`<tr><td><b>${esc(b.ticket_code)}</b></td><td>${esc(b.device)}<small>${esc(b.service||'')}</small></td><td>${esc(String(b.booking_date).slice(0,10))} ${esc(String(b.booking_time).slice(0,5))}</td><td><span class="status ${statusClass(b.status)}">${esc(b.status)}</span></td><td>${b.progress}%</td><td><button class="linkBtn" onclick="openBooking(${b.id})">Chi tiết →</button></td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">Chưa có phiếu sửa chữa.</div></td></tr>`}</tbody></table></div></div></div>`}
async function staffDash(){const d=await api('/staff/dashboard');const groups=[['Sắp tới bàn giao',d.upcomingHandover],['Chưa tới bàn giao',d.notHandedOver],['Chưa hoàn thành',d.incomplete],['Sẵn sàng bàn giao',d.readyHandover],['Đã xong',d.completed],['Quá hạn bàn giao',d.overdue]];return `<div class="page"><div class="wrap"><div class="dashboardHead"><div><span class="eyebrow">KHU VỰC KỸ THUẬT VIÊN</span><h1>Lịch làm việc & bàn giao</h1><p>${esc(state.user.full_name)} · Mọi phiếu được phân công cho bạn và lịch bàn giao đều được theo dõi tại đây.</p></div></div><div class="stats"><div><span>Tổng được giao</span><b>${d.total}</b></div><div><span>Sắp bàn giao</span><b>${d.upcomingHandover.length}</b></div><div><span>Chưa hoàn thành</span><b>${d.incomplete.length}</b></div><div><span>Đã xong</span><b>${d.completed.length}</b></div></div>${groups.map(([title,rows])=>`<section class="card dashboardGroup"><div class="cardHead"><h2>${title}</h2><span>${rows.length} phiếu</span></div><div class="tableWrap"><table class="table"><thead><tr><th>Phiếu</th><th>Khách hàng</th><th>Thiết bị</th><th>Trạng thái</th><th>Bàn giao dự kiến</th><th></th></tr></thead><tbody>${rows.length?rows.map(b=>`<tr><td><b>${esc(b.ticket_code)}</b></td><td>${esc(b.customer||'')}</td><td>${esc(b.device)}<small>${esc(b.brand||'')}</small></td><td><span class="status ${statusClass(b.status)}">${esc(b.status)}</span></td><td>${b.expected_handover_at?esc(new Date(b.expected_handover_at).toLocaleString('vi-VN')):'Chưa đặt'}</td><td><button class="btn small" onclick="openBooking(${b.id})">Mở phiếu</button></td></tr>`).join(''):`<tr><td colspan="6" class="muted">Không có phiếu trong nhóm này.</td></tr>`}</tbody></table></div></section>`).join('')}</div></div>`}
async function adminDash(){const [s,u,b,staff,w]=await Promise.all([api('/admin/stats'),api('/admin/users'),api('/admin/bookings'),api('/admin/staff'),api('/admin/staff-workload')]);return `<div class="page"><div class="wrap"><div class="dashboardHead"><div><span class="eyebrow">TRUNG TÂM QUẢN TRỊ</span><h1>Tổng quan vận hành</h1><p>Quản lý phiếu, lịch bàn giao, phân công kỹ thuật viên, người dùng và linh kiện.</p></div><button class="btn" onclick="go('booking')">+ Tạo phiếu</button></div><div class="stats"><div><span>Tổng phiếu</span><b>${s.bookings}</b></div><div><span>Đang xử lý</span><b>${s.activeBookings}</b></div><div><span>Sẵn sàng bàn giao</span><b>${s.readyHandover}</b></div><div><span>Quá hạn bàn giao</span><b>${s.overdue}</b></div><div><span>Khách hàng</span><b>${s.customers}</b></div><div><span>Kỹ thuật viên</span><b>${s.staff}</b></div></div><div class="adminGrid"><section class="card"><div class="cardHead"><h2>Phân công & lịch bàn giao</h2><span>${b.length} phiếu</span></div><div class="adminList">${b.slice(0,15).map(x=>`<div class="assignRow"><span><b>${esc(x.ticket_code)}</b><small>${esc(x.device)} · ${esc(x.customer||'')}</small><small>${x.expected_handover_at?'Bàn giao: '+esc(new Date(x.expected_handover_at).toLocaleString('vi-VN')):'Chưa có lịch bàn giao'}</small></span><select onchange="assign(${x.id},this.value)"><option value="">${x.technician_id?esc(x.technician||'Đã phân công'):'Chọn kỹ thuật viên'}</option>${staff.map(t=>`<option value="${t.id}">${esc(t.full_name)}</option>`).join('')}</select><button class="linkBtn" onclick="openBooking(${x.id})">Mở</button></div>`).join('')}</div></section><section class="card"><div class="cardHead"><h2>Tải công việc kỹ thuật viên</h2></div><div class="adminList">${w.map(x=>`<div class="listRow"><span class="avatar">${esc((x.full_name||'K')[0])}</span><span><b>${esc(x.full_name)}</b><small>${x.active||0} đang xử lý · ${x.ready_handover||0} sẵn sàng bàn giao</small></span><span class="tag">${x.overdue||0} quá hạn</span></div>`).join('')}</div></section></div><section class="card"><div class="cardHead"><h2>Quản lý người dùng</h2><span>${u.length} tài khoản</span></div><div class="tableWrap"><table class="table"><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th></tr></thead><tbody>${u.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.email)}</td><td><span class="tag">${esc(x.role)}</span></td><td>${esc(String(x.created_at).slice(0,10))}</td></tr>`).join('')}</tbody></table></div></section></div></div>`}
async function openBooking(id){try{const b=await api('/bookings/'+id);state.selected=b;const modal=document.createElement('div');modal.className='modalBack';modal.innerHTML=bookingModal(b);document.body.appendChild(modal);bindModal(modal,b)}catch(e){toast(e.message,'error')}}
function bookingModal(b){const staff=state.user?.role==='staff';const admin=state.user?.role==='admin';const customer=state.user?.role==='customer';const steps=['Đã đặt lịch','Đã tiếp nhận','Đã phân công','Đang kiểm tra','Chờ duyệt báo giá','Đang sửa chữa','Kiểm tra chất lượng','Sẵn sàng bàn giao','Đã bàn giao'];return `<div class="modal"><button class="close" onclick="this.closest('.modalBack').remove()">×</button><div class="modalHead"><div><span class="eyebrow">PHIẾU SỬA CHỮA</span><h2>${esc(b.ticket_code)}</h2><p>${esc(b.device)} · ${esc(b.brand||'')} · ${esc(b.customer_name||'')}</p></div><span class="status ${statusClass(b.status)}">${esc(b.status)}</span></div><div class="detailGrid"><div><h4>Triệu chứng</h4><p>${esc(b.symptom)}</p><h4>Dịch vụ</h4><p>${esc(b.service||'Chưa chọn')}</p><h4>Linh kiện</h4><p>${b.parts?.length?b.parts.map(p=>esc(`${p.name} × ${p.quantity}`)).join(', '):'Chưa ghi nhận'}</p></div><div><h4>Lịch hẹn</h4><p>${esc(String(b.booking_date).slice(0,10))} · ${esc(String(b.booking_time).slice(0,5))}</p><h4>Bàn giao dự kiến</h4><p>${b.expected_handover_at?esc(new Date(b.expected_handover_at).toLocaleString('vi-VN')):'Chưa đặt'}</p><h4>Kỹ thuật viên</h4><p>${esc(b.technician_name||'Chưa phân công')}</p></div></div><div class="timeline compactTimeline">${steps.map((s,i)=>`<div class="tlStep ${steps.indexOf(b.status)>=i?'done':''}"><i></i><span>${s}</span></div>`).join('')}</div>${b.quote?`<div class="quoteBox"><div><span class="eyebrow">BÁO GIÁ</span><h3>${money(b.quote.total_cost)}</h3><p>${esc(b.quote.diagnosis||'')}</p><small>Công: ${money(b.quote.labor_cost)} · Linh kiện: ${money(b.quote.parts_cost)}</small></div>${customer&&b.quote.customer_approved===0?`<button class="btn" onclick="approveQuote(${b.id},this)">Duyệt báo giá</button>`:''}<span class="status ${b.quote.customer_approved?'green':'yellow'}">${b.quote.customer_approved?'Đã duyệt':'Chờ duyệt'}</span></div>`:''}${b.checklist?`<div class="card"><h3>Checklist kiểm tra</h3><p>Loa: ${b.checklist.speaker_ok?'Đạt':'Chưa đạt'} · Bàn phím: ${b.checklist.keyboard_ok?'Đạt':'Chưa đạt'} · Camera: ${b.checklist.camera_ok?'Đạt':'Chưa đạt'} · Màn hình: ${b.checklist.screen_ok?'Đạt':'Chưa đạt'} · Wi‑Fi: ${b.checklist.wifi_ok?'Đạt':'Chưa đạt'} · Sạc: ${b.checklist.charging_ok?'Đạt':'Chưa đạt'}</p><p>${esc(b.checklist.notes||'')}</p></div>`:''}${staff?`<div class="editBox"><h3>Cập nhật công việc</h3><form id="staffForm"><div class="two"><select name="status">${steps.filter(x=>x!==b.status||x==='Đã bàn giao').map(x=>`<option ${x===b.status?'selected':''}>${x}</option>`).join('')}</select><input name="progress" type="number" min="0" max="100" value="${b.progress}"></div><label>Bàn giao dự kiến<input name="expected_handover_at" type="datetime-local"></label><textarea name="note" rows="3" placeholder="Ghi chú kỹ thuật, tình trạng, việc cần làm..." required></textarea><button class="btn">Lưu cập nhật</button></form>${b.status==='Sẵn sàng bàn giao'?`<button class="btn fullBtn" style="margin-top:10px" onclick="handover(${b.id},this)">Xác nhận đã bàn giao</button>`:''}</div>`:''}${admin?`<div class="editBox"><h3>Quản trị</h3><p>Khách hàng: ${esc(b.customer_name)} · ${esc(b.phone)}</p><p>Kỹ thuật viên: <b>${esc(b.technician_name||'Chưa phân công')}</b></p></div>`:''}<div class="logs"><h3>Nhật ký xử lý</h3>${(b.logs||[]).map(l=>`<div class="log"><b>${esc(l.status)}</b><span>${esc(l.note||'')}</span><small>${esc(String(l.created_at).slice(0,16))}</small></div>`).join('')||'<p class="muted">Chưa có nhật ký.</p>'}</div></div>`}
function bindModal(modal,b){modal.querySelector('#staffForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const x=Object.fromEntries(new FormData(e.target));await api('/staff/bookings/'+b.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(x)});modal.remove();toast('Đã cập nhật phiếu','success');render()}catch(e){toast(e.message,'error')}})}
async function approveQuote(id,el){try{await api('/bookings/'+id+'/quote/approve',{method:'POST'});toast('Đã duyệt báo giá','success');el.closest('.modalBack').remove();openBooking(id)}catch(e){toast(e.message,'error')}}
async function handover(id,el){try{await api('/staff/bookings/'+id+'/handover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:'Đã bàn giao thiết bị cho khách hàng'})});toast('Đã xác nhận bàn giao','success');el.closest('.modalBack').remove();render()}catch(e){toast(e.message,'error')}}
async function assign(id,technician_id){if(!technician_id)return;try{await api('/admin/assign/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({technician_id:Number(technician_id)})});toast('Đã phân công','success');render()}catch(e){toast(e.message,'error')}}
async function render(){app.innerHTML=nav()+`<main id="main"></main><footer><div class="wrap footerGrid"><div><b class="footerBrand">ElectroCare</b><p>Hệ thống quản lý sửa chữa điện tử minh bạch và có theo dõi tiến độ.</p></div><div><b>Khách hàng</b><button onclick="go('services')">Dịch vụ</button><button onclick="go('booking')">Đặt lịch</button><button onclick="go('track')">Tra cứu</button></div><div><b>Hỗ trợ</b><button onclick="go('ai')">AI chẩn đoán</button><button onclick="go('warranty')">Bảo hành</button><button onclick="go('stores')">Cửa hàng</button></div><div><b>Liên hệ</b><span>1800 2026</span><span>support@electrocare.vn</span><span>Đà Nẵng, Việt Nam</span></div></div><div class="wrap copyright">© 2026 ElectroCare. Giá cuối cùng do kỹ thuật viên xác nhận.</div></footer>`;await loadServices();const main=document.querySelector('#main');if(state.view==='home')main.innerHTML=home();else if(state.view==='auth')main.innerHTML=authPage();else if(state.view==='services')main.innerHTML=services();else if(state.view==='booking')main.innerHTML=booking();else if(state.view==='track')main.innerHTML=track();else if(state.view==='ai')main.innerHTML=ai();else if(state.view==='stores')main.innerHTML=stores();else if(state.view==='warranty')main.innerHTML=warranty();else if(state.view==='dashboard')main.innerHTML=await dashboard();bind();if(state.view==='stores')loadStores();if(state.view==='services'){loadParts();['partSearch','partCategory','partSort'].forEach(id=>document.querySelector('#'+id)?.addEventListener(id==='partSearch'?'input':'change',loadParts))}}
async function loadServices(){try{state.services=await api('/services')}catch{state.services=[{name:'Vệ sinh & bảo dưỡng laptop',description:'Vệ sinh bụi và kiểm tra tản nhiệt',price_min:150000,price_max:350000,icon:'🧹'},{name:'Thay màn hình laptop',description:'Kiểm tra panel và cáp màn hình',price_min:900000,price_max:3500000,icon:'🖥️'},{name:'Sửa nguồn / mainboard',description:'Kiểm tra nguồn và linh kiện trên bo mạch',price_min:500000,price_max:2500000,icon:'⚡'}]}}
async function loadParts(){try{const q=document.querySelector('#partSearch')?.value||'',category=document.querySelector('#partCategory')?.value||'',sort=document.querySelector('#partSort')?.value||'name';const rows=await api(`/parts?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&sort=${sort}`);const el=document.querySelector('#partsGrid');if(!el)return;el.innerHTML=rows.map(p=>`<article class="partCard"><span class="tag">${esc(p.category||'Khác')}</span><h3>${esc(p.name)}</h3><p>${esc(p.brand||'')} · ${esc(p.specification||'')}</p><div class="partMeta"><b>${money(p.price)}</b><span>${esc(p.capacity||'')}</span></div><small>Tồn kho tham khảo: ${p.stock}</small></article>`).join('')||'<p class="muted">Không tìm thấy linh kiện phù hợp.</p>'}catch(e){const el=document.querySelector('#partsGrid');if(el)el.innerHTML='<p class="muted">Không tải được danh mục linh kiện.</p>'}}
async function loadStores(){try{const s=await api('/stores');document.querySelector('#storesGrid').innerHTML=s.map(x=>`<article class="storeCard"><div class="storeMap">⌖</div><div><span class="tag">${esc(x.area||'Đà Nẵng')}</span><h3>${esc(x.name)}</h3><p>${esc(x.address)}</p><p>🕘 ${esc(x.hours||'08:00 - 20:00')} · ☎ ${esc(x.phone||'1800 2026')}</p><button class="linkBtn" onclick="go('booking')">Đặt lịch tại đây →</button></div></article>`).join('')}catch(e){document.querySelector('#storesGrid').innerHTML='<div class="emptyCard">Không tải được danh sách cửa hàng.</div>'}}
function bind(){document.querySelector('#bookForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const fd=new FormData(e.target);const ids=[...e.target.querySelectorAll('input[name="service_pick"]:checked')].map(x=>x.value);if(!ids.length){toast('Hãy chọn ít nhất một dịch vụ','error');return}fd.set('service_ids',ids.join(','));const d=await api('/bookings',{method:'POST',body:fd});toast('Đặt lịch thành công: '+d.booking.ticket_code,'success');state.ai=null;go('dashboard')}catch(x){toast(x.message,'error')}});document.querySelectorAll('input[name="service_pick"]').forEach(x=>x.addEventListener('change',()=>{const chosen=[...document.querySelectorAll('input[name="service_pick"]:checked')];document.querySelector('#serviceIds').value=chosen.map(i=>i.value).join(',');document.querySelector('#priceSummary').textContent=chosen.length?`Đã chọn ${chosen.length} dịch vụ · Xem khoảng giá ngay trên từng mục`:'Chưa chọn dịch vụ'}));document.querySelector('#trackForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const d=await api('/bookings/ticket/'+encodeURIComponent(new FormData(e.target).get('ticket')));document.querySelector('#trackResult').innerHTML=trackingCard(d)}catch(x){toast(x.message,'error')}});document.querySelector('#warrantyForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const d=await api('/warranty/'+encodeURIComponent(new FormData(e.target).get('ticket')));document.querySelector('#warrantyResult').innerHTML=`<div class="card resultCard"><span class="status green">${esc(d.status)}</span><h2>${esc(d.ticket_code)}</h2><p>${esc(d.device)} · ${esc(d.service||'')}</p><div class="warrantyBig">${d.days_left>=0?`Còn <b>${d.days_left}</b> ngày bảo hành`:'Đã hết hạn bảo hành'}</div><small>Hạn bảo hành: ${esc(d.warranty_until||'—')}</small></div>`}catch(x){toast(x.message,'error')}});document.querySelector('#aiForm')?.addEventListener('submit',async e=>{e.preventDefault();try{const fd=new FormData(e.target);const device=fd.get('device'),symptom=fd.get('symptom');const d=await api('/ai/diagnose',{method:'POST',body:fd});state.ai={...d,device,symptom};document.querySelector('#aiResult').innerHTML=`<div class="aiResultHead"><span class="aiOrb small">✦</span><div><span class="eyebrow">GEMINI AI</span><h2>${esc(d.summary)}</h2></div></div><div class="aiColumns"><div><h4>Khả năng có thể gặp</h4><ul>${(d.possibleIssues||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>Linh kiện có thể liên quan</h4><ul>${(d.partsSuggestions||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Chưa đủ dữ liệu</li>'}</ul></div><div><h4>Dịch vụ gợi ý</h4>${(d.recommendedServices||[]).map(x=>`<div class="aiService"><b>${esc(x.name||'')}</b><small>${esc(x.reason||'')}</small><strong>${money(x.priceMin)} – ${money(x.priceMax)}</strong></div>`).join('')}<h4>Khoảng giá tham khảo</h4><b>${esc(d.priceRange||'Chưa xác định')}</b></div></div><div class="warning">⚠ ${esc(d.warning||'Kết quả chỉ mang tính tham khảo.')}</div><button class="btn xl fullBtn" onclick="go('booking')">Đặt lịch sửa chữa ngay →</button>`}catch(x){toast(x.message,'error')}})}
function trackingCard(d){return `<div class="card resultCard"><div class="modalHead"><div><span class="eyebrow">${esc(d.ticket_code)}</span><h2>${esc(d.device)}</h2><p>${esc(d.brand||'')} · ${esc(d.service||'')}</p></div><span class="status ${statusClass(d.status)}">${esc(d.status)}</span></div><div class="trackProgress"><div><b>${d.progress}%</b><span>tiến độ</span></div><div class="progress"><i style="width:${d.progress}%"></i></div></div><div class="logs">${(d.logs||[]).map(l=>`<div class="log"><b>${esc(l.status)}</b><span>${esc(l.note||'')}</span><small>${esc(String(l.created_at).slice(0,16))}</small></div>`).join('')||'<p class="muted">Chưa có nhật ký.</p>'}</div>${d.quote?`<div class="quoteBox"><div><span class="eyebrow">BÁO GIÁ</span><h3>${money(d.quote.total_cost)}</h3><p>${esc(d.quote.diagnosis||'')}</p></div><span class="status ${d.quote.customer_approved?'green':'yellow'}">${d.quote.customer_approved?'Đã duyệt':'Chờ duyệt'}</span></div>`:''}</div>`}
// ============================================================
// CHỌN VAI TRÒ ĐĂNG NHẬP
// ============================================================
function authPage(){
  return `<div class="authPage">
    <div class="wrap authWrap">
      <div class="authHero">
        <span class="eyebrow">ĐĂNG NHẬP HỆ THỐNG</span>
        <h1>Chọn vai trò của bạn</h1>
        <p>Chọn đúng khu vực để đăng nhập hoặc tạo tài khoản.</p>
      </div>

      <div class="roleGrid">
        <!-- Khách hàng -->
        <article class="roleCard customer">
          <div class="roleIcon">👤</div>
          <span class="roleBadge">KHÁCH HÀNG</span>
          <h2>Khách hàng</h2>
          <p>Đặt lịch sửa chữa, theo dõi tiến độ, duyệt báo giá và tra cứu bảo hành.</p>
          <div class="roleActions">
            <button class="btn fullBtn" onclick="showAuth('customer','login')">Đăng nhập</button>
            <button class="btn ghost fullBtn" onclick="showAuth('customer','register')">Tạo tài khoản</button>
          </div>
        </article>

        <!-- Kỹ thuật viên -->
        <article class="roleCard staff">
          <div class="roleIcon">🛠️</div>
          <span class="roleBadge">KỸ THUẬT VIÊN</span>
          <h2>Kỹ thuật viên</h2>
          <p>Nhận phiếu được phân công, chẩn đoán, cập nhật tiến độ và lập báo giá.</p>
          <div class="roleActions">
            <button class="btn fullBtn" onclick="showAuth('staff','login')">Đăng nhập</button>
            <button class="btn ghost fullBtn" onclick="showAuth('staff','register')">Tạo tài khoản</button>
          </div>
          <small class="roleNote">Cần mã mời từ quản trị viên.</small>
        </article>

        <!-- Quản trị viên -->
        <article class="roleCard admin">
          <div class="roleIcon">🏢</div>
          <span class="roleBadge">QUẢN TRỊ VIÊN</span>
          <h2>Quản trị viên</h2>
          <p>Quản lý người dùng, phiếu sửa chữa, kỹ thuật viên và hoạt động hệ thống.</p>
          <div class="roleActions">
            <button class="btn fullBtn" onclick="showAuth('admin','login')">Đăng nhập</button>
            <button class="btn ghost fullBtn" onclick="showAuth('admin','register')">Tạo tài khoản</button>
          </div>
          <small class="roleNote">Cần mã mời bảo mật.</small>
        </article>
      </div>

      <div class="authHelp card">
        <b>Lưu ý</b>
        <span>Chọn đúng vai trò khi đăng nhập. Khách hàng dùng dịch vụ, kỹ thuật viên và quản trị cần mã mời.</span>
      </div>
    </div>
  </div>`;
}

// ============================================================
// CỬA SỔ ĐĂNG NHẬP / ĐĂNG KÝ
// ============================================================
function showAuth(roleName='customer', mode='login'){
  const meta={
    customer:{label:'Khách hàng',icon:'👤',desc:'Tài khoản dành cho khách hàng sử dụng dịch vụ.'},
    staff:{label:'Kỹ thuật viên',icon:'🛠️',desc:'Tài khoản dành cho nhân viên kỹ thuật.'},
    admin:{label:'Quản trị viên',icon:'🏢',desc:'Tài khoản dành cho người quản lý hệ thống.'}
  }[roleName];

  if(!meta)return;

  const isRegister=mode==='register';
  const back=document.createElement('div');
  back.className='modalBack';

  const invite=roleName==='customer'?'':`
    <label>Mã mời
      <input name="invite_code" placeholder="Nhập mã mời" required>
    </label>`;

  back.innerHTML=`<div class="modal auth authRole ${roleName}">
    <button class="close" aria-label="Đóng" onclick="this.closest('.modalBack').remove()">×</button>

    <div class="authRoleTop">
      <div class="authRoleIcon">${meta.icon}</div>
      <div>
        <span class="roleBadge">${meta.label.toUpperCase()}</span>
        <h2>${isRegister?'Tạo tài khoản':'Đăng nhập'}</h2>
        <p>${meta.desc}</p>
      </div>
    </div>

    ${!isRegister?`<div class="authInfo">Nhập đúng email và mật khẩu đã đăng ký.</div>`:''}

    <form id="authForm" class="form">
      ${isRegister?`<label>Họ và tên<input name="full_name" placeholder="Nhập họ và tên" required></label>`:''}
      <label>Email<input name="email" type="email" placeholder="example@gmail.com" autocomplete="username" required></label>
      <label>Mật khẩu<input name="password" type="password" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" minlength="6" autocomplete="${isRegister?'new-password':'current-password'}" required></label>
      ${isRegister?invite:''}
      <button class="btn xl fullBtn" type="submit">${isRegister?'Tạo tài khoản':'Đăng nhập'}</button>
    </form>

    <div class="authSwitches">
      <button class="switchAuth" onclick="this.closest('.modalBack').remove();showAuth('${roleName}','${isRegister?'login':'register'}')">
        ${isRegister?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Tạo tài khoản'}
      </button>
      <button class="switchAuth mutedLink" onclick="this.closest('.modalBack').remove()">← Chọn vai trò khác</button>
    </div>
  </div>`;

  document.body.appendChild(back);

  back.querySelector('#authForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const submit=e.target.querySelector('button[type="submit"]');
    const form=e.target;
    const password=form.password.value;
    const email=form.email.value.trim();

    // Client-side validation
    if(isRegister && password.length < 6){
      toast('Mật khẩu phải có ít nhất 6 ký tự.','error');
      return;
    }
    if(!email || !email.includes('@')){
      toast('Vui lòng nhập email hợp lệ.','error');
      return;
    }

    submit.disabled=true;
    submit.textContent=isRegister?'Đang tạo tài khoản...':'Đang đăng nhập...';

    try{
      const body=Object.fromEntries(new FormData(form));
      const endpoint=`/auth/${roleName}/${mode}`;
      const d=await api(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

      // Lưu phiên đăng nhập sau khi Backend xác nhận thành công.
      state.token=d.token;
      state.user=d.user;
      localStorage.setItem('ec_token',d.token);
      localStorage.setItem('ec_user',JSON.stringify(d.user));

      back.remove();

      toast(isRegister ? 'Đăng ký thành công!' : 'Đăng nhập thành công.','success');

      go('dashboard');
    }catch(x){
      // Hiển thị lỗi màu đỏ: sai mật khẩu, email trùng, mạng lỗi...
      const msg = x.message || 'Không thể kết nối máy chủ.';
      toast(msg, 'error');
      submit.disabled=false;
      submit.textContent=isRegister?'Tạo tài khoản':'Đăng nhập';
    }
  });
}

Object.assign(window,{go,showAuth,logout,openBooking,approveQuote,assign,handover});
render();
