/***********************
 * Utils / Fake DB
 ***********************/
const LS_USERS = 'users';          // [{id, email, name, passwordHash}]
const LS_LOGGED = 'loggedInUser';  // {id, email, name}

function simpleHash(password) {
  // ของเล่นสำหรับแลบ: ห้ามใช้จริงในโปรดักชัน
  let hash = 'hashed_';
  for (let i = 0; i < password.length; i++) hash += (password.charCodeAt(i) % 10);
  return hash + '_end';
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; }
  catch { return []; }
}
function saveUsers(list) {
  localStorage.setItem(LS_USERS, JSON.stringify(list || []));
}

function getLoggedIn() {
  try { return JSON.parse(localStorage.getItem(LS_LOGGED)); }
  catch { return null; }
}
function setLoggedIn(user) {
  if (user) localStorage.setItem(LS_LOGGED, JSON.stringify(user));
  else localStorage.removeItem(LS_LOGGED);
}

function uid() { // ไอดีง่าย ๆ สำหรับเดโม
  return String(Date.now()) + Math.floor(Math.random()*10000);
}

/***********************
 * Nav (switch sections)
 ***********************/
const authSec = document.getElementById('auth-section');
const profSec = document.getElementById('profile-section');
const sqliSec = document.getElementById('sqli-section');

document.getElementById('nav-auth').onclick  = () => show('auth');
document.getElementById('nav-profile').onclick = () => show('profile');
document.getElementById('nav-sqli').onclick = () => show('sqli');

function show(which) {
  authSec.hidden = which !== 'auth';
  profSec.hidden = which !== 'profile';
  sqliSec.hidden = which !== 'sqli';
  if (which === 'profile') renderProfile();
}

/***********************
 * Register / Login
 ***********************/
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(registerForm);
  const name = fd.get('name') || null;
  const email = (fd.get('email') || '').trim().toLowerCase();
  const password = fd.get('password') || '';

  if (!email || !password) return alert('กรอก email/password ให้ครบ');

  const users = loadUsers();
  if (users.some(u => u.email === email)) return alert('อีเมลนี้ถูกใช้แล้ว');

  const user = {
    id: uid(),
    name,
    email,
    passwordHash: simpleHash(password) // << Hash ก่อนเก็บ (เดโม)
  };
  users.push(user);
  saveUsers(users);

  alert('สมัครสำเร็จ! ลองล็อกอินได้เลย');
  registerForm.reset();
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const email = (fd.get('email') || '').trim().toLowerCase();
  const password = fd.get('password') || '';
  const users = loadUsers();

  const user = users.find(u => u.email === email);
  if (!user) return alert('ไม่พบผู้ใช้');

  // เปรียบเทียบด้วย hash
  if (simpleHash(password) !== user.passwordHash) {
    return alert('รหัสผ่านไม่ถูกต้อง');
  }

  // Login success → เก็บสถานะ
  setLoggedIn({ id: user.id, email: user.email, name: user.name });
  // ไปหน้าโปรไฟล์ (แสดง query id ตามโจทย์)
  const url = new URL(location.href);
  url.searchParams.set('view', 'profile');
  url.searchParams.set('id', user.id);
  history.pushState({}, '', url);
  show('profile');
});

/***********************
 * Profile + IDOR Demo
 ***********************/
const out = document.getElementById('profileView');
document.getElementById('logoutBtn').onclick = () => { setLoggedIn(null); show('auth'); history.pushState({}, '', '?view=auth'); };
document.getElementById('goOtherId').onclick = () => {
  const v = document.getElementById('spoofId').value.trim();
  const url = new URL(location.href);
  url.searchParams.set('view', 'profile');
  if (v) url.searchParams.set('id', v);
  history.pushState({}, '', url);
  renderProfile();
};

function renderProfile() {
  const me = getLoggedIn();
  if (!me) {
    alert('กรุณาล็อกอิน');
    show('auth');
    history.pushState({}, '', '?view=auth');
    return;
  }

  const params = new URLSearchParams(location.search);
  const requestedId = params.get('id');

  // **หัวใจของการกัน IDOR ฝั่ง client (ตามโจทย์แลบ)**
  if (requestedId && requestedId !== me.id) {
    out.innerHTML = '<h3 style="color:#ff6b6b;">Access Denied</h3><p class="muted">ID นี้ไม่ใช่ของผู้ใช้ที่ล็อกอินอยู่</p>';
    return;
  }

  // แสดงข้อมูลตัวเองจาก "ฐานข้อมูลจำลอง" (localStorage)
  const users = loadUsers();
  const full = users.find(u => u.id === me.id);
  out.textContent = JSON.stringify({
    id: full.id,
    email: full.email,
    name: full.name
  }, null, 2);
}

/***********************
 * SQL Injection Demo (จำลอง)
 * หมายเหตุ: เป็นเดโมเพื่อการสอนเท่านั้น
 ***********************/
const demoUser = document.getElementById('demoUser');
const demoPass = document.getElementById('demoPass');
const demoOut  = document.getElementById('demoOut');

document.getElementById('btnInsecure').onclick = () => {
  const username = demoUser.value;
  const password = demoPass.value;

  // ❌ ตัวอย่างเปราะบาง: ต่อสตริง query ตรง ๆ (จำลอง)
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  // จำลอง "การหลุด" ถ้าเจอลักษณะ OR '1'='1
  const injected = /' *OR *'1' *= *'1/i.test(username) || /' *OR *'1' *= *'1/i.test(password);

  const result = injected ? { login: true, reason: "Injected bypass (OR '1'='1')" } : { login: false, reason: 'Invalid creds' };
  demoOut.textContent = [
    'Query (vulnerable):',
    query,
    '',
    'Result:',
    JSON.stringify(result, null, 2)
  ].join('\n');
};

document.getElementById('btnSecure').onclick = () => {
  const username = demoUser.value;
  const password = demoPass.value;

  // ✅ แบบปลอดภัย: parameterized (จำลอง)
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  const params = [username, password];

  // ในโลกจริง DB จะ bind ค่าให้ ไม่ตีความเป็นโค้ด
  const result = { login: false, reason: 'Parameters are treated as data, not code.', query, params };
  demoOut.textContent = [
    'Query (secure / parameterized):',
    query,
    'Params: ' + JSON.stringify(params),
    '',
    'Result:',
    JSON.stringify(result, null, 2)
  ].join('\n');
};

/***********************
 * Init by URL
 ***********************/
(function initByURL(){
  const params = new URLSearchParams(location.search);
  const view = params.get('view') || 'auth';
  show(view);
})();
