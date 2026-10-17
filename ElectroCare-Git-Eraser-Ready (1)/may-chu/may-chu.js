import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
dotenv.config({path:path.join(__dirname,'.env')});
const app=express(); app.use(cors()); app.use(express.json({limit:'3mb'}));
app.use('/uploads',express.static(path.join(__dirname,'tep-tai-len')));
const upload=multer({dest:path.join(__dirname,'tep-tai-len/'),limits:{fileSize:10*1024*1024}});
const pool=mysql.createPool({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'electrocare_v2',connectionLimit:10});
const JWT_SECRET=process.env.JWT_SECRET||'electrocare-dev-secret';
const STATUSES=['Đã đặt lịch','Đã tiếp nhận','Đã phân công','Đang kiểm tra','Chờ duyệt báo giá','Đang sửa chữa','Kiểm tra chất lượng','Sẵn sàng bàn giao','Đã bàn giao','Đã hủy'];
const publicUser=r=>({id:r.id,full_name:r.full_name,email:r.email,role:r.role});
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){const hash=crypto.scryptSync(password,salt,64).toString('hex');return `${salt}:${hash}`;}
function verifyPassword(password,stored){const [salt,hash]=String(stored||'').split(':');if(!salt||!hash)return false;const actual=crypto.scryptSync(password,salt,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(hash,'hex'));}
function tokenFor(user){return jwt.sign(publicUser(user),JWT_SECRET,{expiresIn:'7d'});}
function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return res.status(401).json({message:'Chưa đăng nhập'});req.user=jwt.verify(h.slice(7),JWT_SECRET);next();}catch{return res.status(401).json({message:'Phiên đăng nhập không hợp lệ'});}}
function role(...roles){return (req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({message:'Bạn không có quyền thực hiện thao tác này'});}
function ticket(){return `EC-${new Date().getFullYear()}-${Math.floor(100000+Math.random()*900000)}`;}
async function uniqueTicket(){for(let i=0;i<10;i++){const c=ticket();const [r]=await pool.execute('SELECT id FROM bookings WHERE ticket_code=?',[c]);if(!r.length)return c;}throw new Error('Không thể tạo mã phiếu duy nhất');}
function validDateTime(date,time){const d=new Date(`${date}T${time}:00`);return !Number.isNaN(d.getTime())&&d.getTime()>=Date.now()-60000;}
function money(n){return Number(n||0).toLocaleString('vi-VN')+'đ';}

app.get('/api/health',async(_,res)=>{try{await pool.query('SELECT 1');res.json({ok:true,database:true});}catch(e){res.status(500).json({ok:false,database:false,message:e.message});}});

async function registerForRole(req,res,roleName){try{const {full_name,email,password,invite_code}=req.body;if(!full_name||!email||!password)return res.status(400).json({message:'Vui lòng nhập đủ thông tin'});if(password.length<6)return res.status(400).json({message:'Mật khẩu phải có ít nhất 6 ký tự'});if(roleName==='staff'&&invite_code!==(process.env.STAFF_INVITE_CODE||'STAFF-2026'))return res.status(403).json({message:'Mã mời kỹ thuật viên không hợp lệ'});if(roleName==='admin'&&invite_code!==(process.env.ADMIN_INVITE_CODE||'ADMIN-2026'))return res.status(403).json({message:'Mã mời quản trị viên không hợp lệ'});const normalized=String(email).trim().toLowerCase();const [exists]=await pool.execute('SELECT id FROM users WHERE email=?',[normalized]);if(exists.length)return res.status(409).json({message:'Email đã được sử dụng'});const [r]=await pool.execute('INSERT INTO users(full_name,email,password_hash,role) VALUES(?,?,?,?)',[String(full_name).trim(),normalized,hashPassword(password),roleName]);const user={id:r.insertId,full_name:String(full_name).trim(),email:normalized,role:roleName};res.status(201).json({message:'Đăng ký thành công!',user,token:tokenFor(user)});}catch(e){res.status(500).json({message:'Không thể đăng ký',detail:e.message});}}
async function loginForRole(req,res,roleName){try{const {email,password}=req.body;const [rows]=await pool.execute('SELECT * FROM users WHERE email=? AND role=? LIMIT 1',[String(email||'').trim().toLowerCase(),roleName]);if(!rows.length||!verifyPassword(password,rows[0].password_hash))return res.status(401).json({message:'Email hoặc mật khẩu không đúng'});res.json({message:'Đăng nhập thành công',user:publicUser(rows[0]),token:tokenFor(rows[0])});}catch(e){res.status(500).json({message:e.message});}}
for(const r of ['customer','staff','admin']){app.post(`/api/auth/${r}/register`,(req,res)=>registerForRole(req,res,r));app.post(`/api/auth/${r}/login`,(req,res)=>loginForRole(req,res,r));}
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));

app.get('/api/services',async(_,res)=>{try{const [rows]=await pool.query('SELECT * FROM services WHERE active=1 ORDER BY category,name');res.json(rows);}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/parts',async(req,res)=>{try{const q=String(req.query.q||'').trim(),cat=String(req.query.category||'').trim(),sort=['price_asc','price_desc','name'].includes(req.query.sort)?req.query.sort:'name';let sql='SELECT * FROM parts WHERE active=1',args=[];if(q){sql+=' AND (name LIKE ? OR brand LIKE ? OR specification LIKE ?)';const x=`%${q}%`;args.push(x,x,x);}if(cat){sql+=' AND category=?';args.push(cat);}sql+=sort==='price_asc'?' ORDER BY price ASC':sort==='price_desc'?' ORDER BY price DESC':' ORDER BY name ASC';const [rows]=await pool.execute(sql,args);res.json(rows);}catch(e){res.status(500).json({message:e.message});}});

app.post('/api/bookings',auth,role('customer'),upload.single('image'),async(req,res)=>{const conn=await pool.getConnection();try{const {phone,device,brand,date,time,location,symptom,service_ids}=req.body;if(!phone||!device||!date||!time||!symptom)return res.status(400).json({message:'Thiếu thông tin bắt buộc'});if(!validDateTime(date,time))return res.status(400).json({message:'Ngày và giờ đặt lịch phải từ thời điểm hiện tại trở đi'});const ids=[...new Set(String(service_ids||'').split(',').map(Number).filter(Number.isInteger))];let services=[];if(ids.length){const [s]=await conn.query(`SELECT id,name,price_min,price_max FROM services WHERE active=1 AND id IN (${ids.map(()=>'?').join(',')})`,ids);services=s;}const code=await uniqueTicket();const image=req.file?`/uploads/${req.file.filename}`:null;await conn.beginTransaction();const [r]=await conn.execute(`INSERT INTO bookings(ticket_code,user_id,customer_name,phone,device,brand,service,booking_date,booking_time,location,symptom,image_path,status,progress,expected_handover_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[code,req.user.id,req.user.full_name,phone,device,brand||'',services.map(x=>x.name).join(', ')||'',date,time,location||'Cửa hàng',symptom,image,'Đã đặt lịch',5,req.body.expected_handover_at||null]);for(const s of services)await conn.execute('INSERT INTO booking_services(booking_id,service_id,unit_price_min,unit_price_max) VALUES(?,?,?,?)',[r.insertId,s.id,s.price_min,s.price_max]);await conn.execute('INSERT INTO repair_logs(booking_id,status,note) VALUES(?,?,?)',[r.insertId,'Đã đặt lịch','Khách hàng tạo phiếu sửa chữa']);await conn.commit();const [rows]=await pool.execute('SELECT * FROM bookings WHERE id=?',[r.insertId]);res.status(201).json({message:'Đặt lịch thành công',booking:rows[0]});}catch(e){await conn.rollback();res.status(500).json({message:'Không thể tạo phiếu',detail:e.message});}finally{conn.release();}});
app.get('/api/bookings/mine',auth,role('customer'),async(req,res)=>{try{const [rows]=await pool.execute('SELECT * FROM bookings WHERE user_id=? ORDER BY booking_date ASC,booking_time ASC',[req.user.id]);res.json(rows);}catch(e){res.status(500).json({message:e.message});}});

async function bookingDetail(id){const [rows]=await pool.execute(`SELECT b.*,u.full_name AS technician_name,q.diagnosis,q.labor_cost,q.parts_cost,q.total_cost,q.customer_approved,q.created_at AS quote_created_at FROM bookings b LEFT JOIN users u ON u.id=b.technician_id LEFT JOIN repair_quotes q ON q.booking_id=b.id WHERE b.id=? ORDER BY q.id DESC LIMIT 1`,[id]);if(!rows.length)return null;const b=rows[0];const [logs]=await pool.execute('SELECT * FROM repair_logs WHERE booking_id=? ORDER BY created_at DESC',[id]);const [services]=await pool.execute('SELECT s.*,bs.unit_price_min,bs.unit_price_max FROM booking_services bs JOIN services s ON s.id=bs.service_id WHERE bs.booking_id=?',[id]);const [parts]=await pool.execute('SELECT bp.*,p.name,p.part_code,p.brand FROM booking_parts bp JOIN parts p ON p.id=bp.part_id WHERE bp.booking_id=?',[id]);const [check]=await pool.execute('SELECT * FROM checklists WHERE booking_id=? ORDER BY id DESC LIMIT 1',[id]);return {...b,services,parts,checklist:check[0]||null,logs,quote:b.total_cost!=null?{diagnosis:b.diagnosis,labor_cost:b.labor_cost,parts_cost:b.parts_cost,total_cost:b.total_cost,customer_approved:b.customer_approved}:null};}
app.get('/api/bookings/:id',auth,async(req,res)=>{try{const b=await bookingDetail(req.params.id);if(!b)return res.status(404).json({message:'Không tìm thấy phiếu'});if(req.user.role==='customer'&&b.user_id!==req.user.id)return res.status(403).json({message:'Bạn không có quyền xem phiếu này'});if(req.user.role==='staff'&&b.technician_id!==req.user.id)return res.status(403).json({message:'Phiếu chưa được phân công cho bạn'});res.json(b);}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/bookings/ticket/:ticket',async(req,res)=>{try{const [rows]=await pool.execute('SELECT id,user_id,ticket_code FROM bookings WHERE ticket_code=?',[req.params.ticket]);if(!rows.length)return res.status(404).json({message:'Không tìm thấy phiếu'});const b=await bookingDetail(rows[0].id);res.json(b);}catch(e){res.status(500).json({message:e.message});}});
app.post('/api/bookings/:id/quote/approve',auth,role('customer'),async(req,res)=>{try{const [r]=await pool.execute(`UPDATE repair_quotes q JOIN bookings b ON b.id=q.booking_id SET q.customer_approved=1,b.status='Đang sửa chữa',b.progress=60 WHERE q.booking_id=? AND b.user_id=? AND q.customer_approved=0`,[req.params.id,req.user.id]);if(!r.affectedRows)return res.status(409).json({message:'Báo giá không tồn tại, đã duyệt hoặc phiếu không thuộc tài khoản'});await pool.execute('INSERT INTO repair_logs(booking_id,status,note) VALUES(?,?,?)',[req.params.id,'Đã duyệt báo giá','Khách hàng đã đồng ý sửa chữa theo báo giá']);res.json({ok:true});}catch(e){res.status(500).json({message:e.message});}});

app.get('/api/staff/dashboard',auth,role('staff'),async(req,res)=>{try{const [rows]=await pool.execute(`SELECT b.*,u.full_name AS customer FROM bookings b LEFT JOIN users u ON u.id=b.user_id WHERE b.technician_id=? AND b.status<>'Đã hủy' ORDER BY COALESCE(b.expected_handover_at, TIMESTAMP(b.booking_date,b.booking_time)) ASC`,[req.user.id]);const now=new Date();const result={total:rows.length,upcomingHandover:rows.filter(b=>b.expected_handover_at&&new Date(b.expected_handover_at)>=now&&!['Đã bàn giao','Đã hủy'].includes(b.status)),notHandedOver:rows.filter(b=>!['Đã bàn giao','Đã hủy'].includes(b.status)),incomplete:rows.filter(b=>!['Đã bàn giao','Đã hủy','Sẵn sàng bàn giao'].includes(b.status)),completed:rows.filter(b=>['Hoàn thành','Đã bàn giao'].includes(b.status)),readyHandover:rows.filter(b=>b.status==='Sẵn sàng bàn giao'),overdue:rows.filter(b=>b.expected_handover_at&&new Date(b.expected_handover_at)<now&&!['Đã bàn giao','Đã hủy'].includes(b.status))};res.json(result);}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/staff/bookings',auth,role('staff','admin'),async(req,res)=>{try{let sql=`SELECT b.*,u.full_name AS customer,t.full_name AS technician FROM bookings b LEFT JOIN users u ON u.id=b.user_id LEFT JOIN users t ON t.id=b.technician_id`,args=[];if(req.user.role==='staff'){sql+=' WHERE b.technician_id=?';args.push(req.user.id);}if(req.query.status){sql+=sql.includes('WHERE')?' AND ':' WHERE ';sql+='b.status=?';args.push(req.query.status);}sql+=' ORDER BY COALESCE(b.expected_handover_at, TIMESTAMP(b.booking_date,b.booking_time)) ASC';const [rows]=await pool.execute(sql,args);res.json(rows);}catch(e){res.status(500).json({message:e.message});}});

const transitions={'Đã đặt lịch':['Đã tiếp nhận','Đã hủy'],'Đã tiếp nhận':['Đã phân công','Đã hủy'],'Đã phân công':['Đang kiểm tra','Đã hủy'],'Đang kiểm tra':['Chờ duyệt báo giá','Đang sửa chữa','Đã hủy'],'Chờ duyệt báo giá':['Đang sửa chữa','Đã hủy'],'Đang sửa chữa':['Kiểm tra chất lượng','Đã hủy'],'Kiểm tra chất lượng':['Sẵn sàng bàn giao','Đang sửa chữa'],'Sẵn sàng bàn giao':['Đã bàn giao'],'Đã bàn giao':[],'Đã hủy':[]};
app.patch('/api/staff/bookings/:id',auth,role('staff','admin'),async(req,res)=>{try{const {status,progress,note,expected_handover_at}=req.body;const [found]=await pool.execute('SELECT id,technician_id,status FROM bookings WHERE id=?',[req.params.id]);if(!found.length)return res.status(404).json({message:'Không tìm thấy phiếu'});if(req.user.role==='staff'&&found[0].technician_id!==req.user.id)return res.status(403).json({message:'Bạn chỉ được cập nhật phiếu được phân công cho mình'});if(status&&status!==found[0].status&&!transitions[found[0].status]?.includes(status))return res.status(409).json({message:`Không thể chuyển trạng thái từ “${found[0].status}” sang “${status}”`});let p=progress==null?null:Math.max(0,Math.min(100,Number(progress)));if(p!==null&&!Number.isFinite(p))return res.status(400).json({message:'Tiến độ không hợp lệ'});if(status==='Đã bàn giao')p=100;if(status==='Sẵn sàng bàn giao')p=Math.max(p??0,95);await pool.execute('UPDATE bookings SET status=COALESCE(?,status),progress=COALESCE(?,progress),expected_handover_at=COALESCE(?,expected_handover_at),actual_handover_at=IF(?="Đã bàn giao",NOW(),actual_handover_at) WHERE id=?',[status??null,p,expected_handover_at??null,status??'',req.params.id]);if(note||status)await pool.execute('INSERT INTO repair_logs(booking_id,status,note) VALUES(?,?,?)',[req.params.id,status||'Cập nhật',note||'']);res.json({ok:true});}catch(e){res.status(500).json({message:e.message});}});
app.post('/api/staff/bookings/:id/quote',auth,role('staff','admin'),async(req,res)=>{try{const {diagnosis,labor_cost=0,parts_cost=0}=req.body;const [b]=await pool.execute('SELECT id,technician_id,status FROM bookings WHERE id=?',[req.params.id]);if(!b.length)return res.status(404).json({message:'Không tìm thấy phiếu'});if(req.user.role==='staff'&&b[0].technician_id!==req.user.id)return res.status(403).json({message:'Phiếu chưa được phân công cho bạn'});const labor=Number(labor_cost),parts=Number(parts_cost);if(labor<0||parts<0)return res.status(400).json({message:'Chi phí không hợp lệ'});const total=labor+parts;await pool.execute('INSERT INTO repair_quotes(booking_id,diagnosis,labor_cost,parts_cost,total_cost,customer_approved) VALUES(?,?,?,?,?,0)',[req.params.id,diagnosis||'',labor,parts,total]);await pool.execute("UPDATE bookings SET status='Chờ duyệt báo giá' WHERE id=?",[req.params.id]);await pool.execute('INSERT INTO repair_logs(booking_id,status,note) VALUES(?,?,?)',[req.params.id,'Chờ duyệt báo giá',`Đã lập báo giá ${money(total)}`]);res.json({ok:true,total});}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/staff/bookings/:id/checklist',auth,role('staff','admin'),async(req,res)=>{const [r]=await pool.execute('SELECT * FROM checklists WHERE booking_id=? ORDER BY id DESC LIMIT 1',[req.params.id]);res.json(r[0]||null);});
app.post('/api/staff/bookings/:id/checklist',auth,role('staff','admin'),async(req,res)=>{try{const [b]=await pool.execute('SELECT id,technician_id FROM bookings WHERE id=?',[req.params.id]);if(!b.length)return res.status(404).json({message:'Không tìm thấy phiếu'});if(req.user.role==='staff'&&b[0].technician_id!==req.user.id)return res.status(403).json({message:'Phiếu chưa được phân công cho bạn'});const keys=['speaker_ok','keyboard_ok','camera_ok','screen_ok','wifi_ok','charging_ok'];const vals=keys.map(k=>req.body[k]?1:0);const [old]=await pool.execute('SELECT id FROM checklists WHERE booking_id=? LIMIT 1',[req.params.id]);if(old.length)await pool.execute(`UPDATE checklists SET ${keys.map(k=>`${k}=?`).join(',')},notes=?,checked_by=?,checked_at=NOW() WHERE id=?`,[...vals,req.body.notes||'',req.user.id,old[0].id]);else await pool.execute(`INSERT INTO checklists(booking_id,${keys.join(',')},notes,checked_by,checked_at) VALUES(?,${keys.map(()=>'?').join(',')},?,?,NOW())`,[req.params.id,...vals,req.body.notes||'',req.user.id]);res.json({ok:true});}catch(e){res.status(500).json({message:e.message});}});
app.post('/api/staff/bookings/:id/handover',auth,role('staff','admin'),async(req,res)=>{try{const b=await bookingDetail(req.params.id);if(!b)return res.status(404).json({message:'Không tìm thấy phiếu'});if(req.user.role==='staff'&&b.technician_id!==req.user.id)return res.status(403).json({message:'Phiếu chưa được phân công cho bạn'});if(b.status!=='Sẵn sàng bàn giao')return res.status(409).json({message:'Phiếu chưa ở trạng thái sẵn sàng bàn giao'});if(b.quote&&!b.quote.customer_approved)return res.status(409).json({message:'Khách hàng chưa duyệt báo giá'});if(!b.checklist)return res.status(409).json({message:'Chưa hoàn thành checklist kiểm tra chất lượng'});await pool.execute("UPDATE bookings SET status='Đã bàn giao',progress=100,actual_handover_at=NOW() WHERE id=?",[req.params.id]);await pool.execute('INSERT INTO repair_logs(booking_id,status,note) VALUES(?,?,?)',[req.params.id,'Đã bàn giao',req.body.note||'Đã bàn giao thiết bị cho khách hàng']);res.json({ok:true});}catch(e){res.status(500).json({message:e.message});}});

app.get('/api/admin/bookings',auth,role('admin'),async(_,res)=>{try{const [rows]=await pool.query(`SELECT b.*,u.full_name AS customer,t.full_name AS technician FROM bookings b LEFT JOIN users u ON u.id=b.user_id LEFT JOIN users t ON t.id=b.technician_id ORDER BY COALESCE(b.expected_handover_at,TIMESTAMP(b.booking_date,b.booking_time)) ASC`);res.json(rows);}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/admin/staff',auth,role('admin'),async(_,res)=>{const [rows]=await pool.query("SELECT id,full_name,email FROM users WHERE role='staff' ORDER BY full_name");res.json(rows);});
app.get('/api/admin/users',auth,role('admin'),async(_,res)=>{const [rows]=await pool.query('SELECT id,full_name,email,role,created_at FROM users ORDER BY created_at DESC');res.json(rows);});
app.get('/api/admin/stats',auth,role('admin'),async(_,res)=>{try{const [[a]]=await pool.query('SELECT COUNT(*) total FROM bookings');const [[b]]=await pool.query("SELECT COUNT(*) total FROM bookings WHERE status NOT IN ('Đã bàn giao','Đã hủy')");const [[c]]=await pool.query("SELECT COUNT(*) total FROM users WHERE role='customer'");const [[d]]=await pool.query("SELECT COUNT(*) total FROM users WHERE role='staff'");const [[e]]=await pool.query("SELECT COUNT(*) total FROM bookings WHERE status='Sẵn sàng bàn giao'");const [[f]]=await pool.query("SELECT COUNT(*) total FROM bookings WHERE expected_handover_at IS NOT NULL AND expected_handover_at<NOW() AND status NOT IN ('Đã bàn giao','Đã hủy')");res.json({bookings:a.total,activeBookings:b.total,customers:c.total,staff:d.total,readyHandover:e.total,overdue:f.total});}catch(e){res.status(500).json({message:e.message});}});
app.get('/api/admin/staff-workload',auth,role('admin'),async(_,res)=>{const [rows]=await pool.query(`SELECT u.id,u.full_name,COUNT(b.id) assigned,SUM(b.status NOT IN ('Đã bàn giao','Đã hủy')) active,SUM(b.status='Sẵn sàng bàn giao') ready_handover,SUM(b.expected_handover_at IS NOT NULL AND b.expected_handover_at<NOW() AND b.status NOT IN ('Đã bàn giao','Đã hủy')) overdue FROM users u LEFT JOIN bookings b ON b.technician_id=u.id WHERE u.role='staff' GROUP BY u.id,u.full_name ORDER BY active DESC,u.full_name`);res.json(rows);});
app.post('/api/admin/assign/:id',auth,role('admin'),async(req,res)=>{try{const {technician_id}=req.body;const [tech]=await pool.execute("SELECT id FROM users WHERE id=? AND role='staff'",[technician_id]);if(!tech.length)return res.status(400).json({message:'Kỹ thuật viên không hợp lệ'});const [b]=await pool.execute('SELECT id,status FROM bookings WHERE id=?',[req.params.id]);if(!b.length)return res.status(404).json({message:'Không tìm thấy phiếu'});if(['Đã bàn giao','Đã hủy'].includes(b[0].status))return res.status(409).json({message:'Không thể phân công phiếu đã kết thúc'});await pool.execute("UPDATE bookings SET technician_id=?,status=CASE WHEN status='Đã đặt lịch' THEN 'Đã phân công' ELSE status END WHERE id=?",[technician_id,req.params.id]);await pool.execute('INSERT INTO repair_logs(booking_id,status,note) VALUES(?,?,?)',[req.params.id,'Đã phân công','Admin phân công kỹ thuật viên']);res.json({ok:true});}catch(e){res.status(500).json({message:e.message});}});
app.patch('/api/admin/users/:id/role',auth,role('admin'),async(req,res)=>{const allowed=['customer','staff','admin'];if(!allowed.includes(req.body.role))return res.status(400).json({message:'Vai trò không hợp lệ'});if(Number(req.params.id)===req.user.id&&req.body.role!=='admin')return res.status(409).json({message:'Không thể tự hạ quyền tài khoản quản trị hiện tại'});await pool.execute('UPDATE users SET role=? WHERE id=?',[req.body.role,req.params.id]);res.json({ok:true});});
app.get('/api/admin/parts',auth,role('admin'),async(_,res)=>{const [rows]=await pool.query('SELECT * FROM parts ORDER BY category,name');res.json(rows);});
app.get('/api/admin/services',auth,role('admin'),async(_,res)=>{const [rows]=await pool.query('SELECT * FROM services ORDER BY category,name');res.json(rows);});
app.post('/api/admin/services',auth,role('admin'),async(req,res)=>{try{const {name,category='Khác',description='',price_min=0,price_max=0}=req.body;if(!name)return res.status(400).json({message:'Thiếu tên dịch vụ'});await pool.execute('INSERT INTO services(name,category,description,price_min,price_max,active) VALUES(?,?,?,?,?,1)',[name,category,description,Number(price_min),Number(price_max)]);res.status(201).json({ok:true});}catch(e){res.status(500).json({message:e.message});}});
app.patch('/api/admin/services/:id',auth,role('admin'),async(req,res)=>{await pool.execute('UPDATE services SET name=COALESCE(?,name),category=COALESCE(?,category),description=COALESCE(?,description),price_min=COALESCE(?,price_min),price_max=COALESCE(?,price_max),active=COALESCE(?,active) WHERE id=?',[req.body.name??null,req.body.category??null,req.body.description??null,req.body.price_min==null?null:Number(req.body.price_min),req.body.price_max==null?null:Number(req.body.price_max),req.body.active==null?null:Number(req.body.active),req.params.id]);res.json({ok:true});});
app.post('/api/admin/parts',auth,role('admin'),async(req,res)=>{try{const {part_code,name,brand,category,specification,capacity,stock=0,price=0}=req.body;if(!part_code||!name)return res.status(400).json({message:'Thiếu mã và tên linh kiện'});await pool.execute('INSERT INTO parts(part_code,name,brand,category,specification,capacity,stock,price) VALUES(?,?,?,?,?,?,?,?)',[part_code,name,brand||'',category||'Khác',specification||'',capacity||'',Number(stock),Number(price)]);res.status(201).json({ok:true});}catch(e){res.status(500).json({message:e.message});}});
app.patch('/api/admin/parts/:id',auth,role('admin'),async(req,res)=>{await pool.execute('UPDATE parts SET name=COALESCE(?,name),brand=COALESCE(?,brand),category=COALESCE(?,category),specification=COALESCE(?,specification),capacity=COALESCE(?,capacity),stock=COALESCE(?,stock),price=COALESCE(?,price),active=COALESCE(?,active) WHERE id=?',[req.body.name??null,req.body.brand??null,req.body.category??null,req.body.specification??null,req.body.capacity??null,req.body.stock==null?null:Number(req.body.stock),req.body.price==null?null:Number(req.body.price),req.body.active==null?null:Number(req.body.active),req.params.id]);res.json({ok:true});});

app.get('/api/warranty/:ticket',async(req,res)=>{try{const [r]=await pool.execute(`SELECT b.*,DATE_ADD(COALESCE(b.actual_handover_at,b.created_at),INTERVAL 180 DAY) warranty_until FROM bookings b WHERE b.ticket_code=? AND b.status='Đã bàn giao'`,[req.params.ticket]);if(!r.length)return res.status(404).json({message:'Chưa có bảo hành hoặc phiếu chưa bàn giao'});const d=r[0],until=new Date(d.warranty_until);res.json({...d,warranty_until:until.toLocaleDateString('vi-VN'),days_left:Math.ceil((until-new Date())/86400000)});}catch(e){res.status(500).json({message:e.message});}});

app.get('/api/ai/status',auth,async(req,res)=>{const key=String(process.env.GEMINI_API_KEY||'').trim();res.json({configured:Boolean(key),model:process.env.GEMINI_MODEL||'gemini-2.5-flash'});});

app.post('/api/ai/diagnose', auth, upload.single('image'), async (req, res) => {
  try {
    // Kiểm tra API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message:
          'Chưa cấu hình GEMINI_API_KEY. Hãy thêm Gemini API key vào may-chu/.env rồi khởi động lại máy chủ.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Lấy danh mục dịch vụ từ database
    const [serviceRows] = await pool.query(
      'SELECT id,name,price_min,price_max,description FROM services WHERE active=1 ORDER BY id'
    );

    const catalog = serviceRows
      .map(
        s =>
          `ID ${s.id}: ${s.name} | ${money(s.price_min)} - ${money(
            s.price_max
          )} | ${s.description || ''}`
      )
      .join('\n');

    const prompt = `Bạn là trợ lý chẩn đoán sơ bộ cho trung tâm sửa chữa ElectroCare.

Không được khẳng định lỗi cuối cùng.

Thiết bị: ${req.body.device || 'Không rõ'}.

Triệu chứng: ${req.body.symptom || 'Không có mô tả'}.

Danh mục dịch vụ chính thức và khoảng giá tham khảo của ElectroCare:
${catalog}

Hãy chọn 1-3 dịch vụ phù hợp nhất CHỈ từ danh mục trên.

Trả về JSON thuần với các khóa:
- summary (string)
- possibleIssues (array string)
- recommendedServices (array object gồm serviceId, name, reason, priceMin, priceMax)
- priceRange (string)
- partsSuggestions (array string)
- warning (string)

Giá phải lấy đúng từ catalog, không tự bịa.

Nếu không đủ thông tin, nói rõ cần kiểm tra trực tiếp.

Chỉ trả về JSON, không thêm markdown hoặc giải thích bên ngoài JSON.`;

    /*
     * ==========================================================
     * HÀM GỌI GEMINI CÓ RETRY
     * Nếu Gemini trả 503 do quá tải:
     * lần 1 -> chờ 2 giây
     * lần 2 -> chờ 4 giây
     * lần 3 -> chờ 8 giây
     * ==========================================================
     */
    async function generateWithRetry(contents) {
      const model =
        process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `[Gemini] Đang gọi model ${model} - lần thử ${attempt}/${maxRetries}`
          );

          const response = await ai.models.generateContent({
            model,
            contents
          });

          console.log('[Gemini] Phản hồi thành công.');

          return response;
        } catch (error) {
          const status = error?.status;

          console.error(
            `[Gemini] Lỗi lần ${attempt}/${maxRetries}:`,
            status,
            error?.message || error
          );

          // Những lỗi có thể thử lại
          const retryable =
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504;

          // Nếu lỗi không phải lỗi tạm thời -> dừng ngay
          if (!retryable) {
            throw error;
          }

          // Nếu đã hết số lần thử
          if (attempt === maxRetries) {
            throw error;
          }

          // 2s -> 4s -> 8s
          const delay = Math.pow(2, attempt) * 1000;

          console.log(
            `[Gemini] Đang quá tải/tạm thời không khả dụng. Chờ ${
              delay / 1000
            } giây rồi thử lại...`
          );

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    let response;

    // ==========================================================
    // CÓ ẢNH
    // ==========================================================
    if (req.file) {
      const fs = await import('fs/promises');

      const fileBuffer = await fs.readFile(req.file.path);

      response = await generateWithRetry([
        {
          text: prompt
        },
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: fileBuffer.toString('base64')
          }
        }
      ]);
    }

    // ==========================================================
    // KHÔNG CÓ ẢNH
    // ==========================================================
    else {
      response = await generateWithRetry(prompt);
    }

    // ==========================================================
    // XỬ LÝ KẾT QUẢ GEMINI
    // ==========================================================
    const raw = response?.text || '';

    const clean = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let result;

    try {
      result = JSON.parse(clean);
    } catch (parseError) {
      console.error('[Gemini] Không parse được JSON:', parseError);

      result = {
        summary: raw,
        possibleIssues: [],
        recommendedServices: [],
        priceRange: 'Chưa xác định',
        partsSuggestions: [],
        warning:
          'AI trả về định dạng không chuẩn; cần kỹ thuật viên kiểm tra.'
      };
    }

    return res.json({
      configured: true,
      ...result
    });
  } catch (e) {
  console.error('Gemini API error:', e);

  const status = e?.status;

  // Hết quota Gemini
  if (status === 429) {
    return res.status(429).json({
      configured: true,
      message:
        'Gemini đã hết quota miễn phí trong ngày. Vui lòng thử lại sau khi quota được reset.',
      detail:
        'Hạn mức yêu cầu của mô hình Gemini đã đạt giới hạn. Vui lòng kiểm tra quota trong Google AI Studio.'
    });
  }

  // Gemini đang quá tải
  if (status === 503) {
    return res.status(503).json({
      configured: true,
      message:
        'Gemini đang quá tải. Hệ thống đã thử kết nối lại nhưng chưa thành công.',
      detail:
        'Vui lòng thử lại sau một lát.'
    });
  }

  return res.status(500).json({
    configured: true,
    message: 'Gemini AI không phản hồi',
    detail: String(e?.message || e)
  });
  }
});

const port=Number(process.env.PORT||3000);
const server=app.listen(port,'0.0.0.0',()=>console.log(`ElectroCare API running at http://localhost:${port}`));
server.on('error',(err)=>{console.error('ElectroCare API khong khoi dong duoc:',err);process.exitCode=1;});
process.on('uncaughtException',(err)=>console.error('Loi khong xu ly:',err));
process.on('unhandledRejection',(err)=>console.error('Promise bi tu choi:',err));
