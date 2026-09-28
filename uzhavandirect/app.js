/* ===================== Uzhavan Direct — demo frontend ===================== *
 * Pure front-end demo: all data lives in localStorage, seeded with mock
 * farmers/produce/orders so the app is fully clickable without a backend.
 * ============================================================================ */

/* ===============================
   LANGUAGE SELECTION (i18n)
   Small dictionary of UI strings
   per language. t(key) looks up
   the current language, falling
   back to English.
   =============================== */
const I18N = {
  en:{dashboard:"Dashboard",sellItem:"Sell Item",bidding:"Online Bidding",demand:"Demand Tracker",
      aiChat:"Farmer's AI Chat",settings:"Settings",itemsOrdered:"Items Ordered",cart:"Cart",
      history:"History",
      nearby:"Nearby You",search:"Search",logout:"Log out",ordersPending:"Orders pending",
      ordersCompleted:"Orders completed",moneyReceived:"Total money received",moneySpent:"Money spent",
      profile:"Profile", welcome:"Welcome back"},
  ta:{dashboard:"டாஷ்போர்டு",sellItem:"பொருள் விற்பனை",bidding:"ஏலம்",demand:"தேவை கண்காணிப்பு",
      aiChat:"விவசாயி AI அரட்டை",settings:"அமைப்புகள்",itemsOrdered:"ஆர்டர் செய்யப்பட்ட பொருட்கள்",cart:"கார்ட்",
      history:"ஆர்டர் வரலாறு",
      nearby:"அருகில் உள்ளவை",search:"தேடல்",logout:"வெளியேறு",ordersPending:"நிலுவையிலுள்ள ஆர்டர்கள்",
      ordersCompleted:"முடிக்கப்பட்ட ஆர்டர்கள்",moneyReceived:"பெறப்பட்ட மொத்த பணம்",moneySpent:"செலவிடப்பட்ட பணம்",
      profile:"சுயவிவரம்", welcome:"மீண்டும் வரவேற்கிறோம்"},
  hi:{dashboard:"डैशबोर्ड",sellItem:"वस्तु बेचें",bidding:"ऑनलाइन बोली",demand:"मांग ट्रैकर",
      aiChat:"किसान AI चैट",settings:"सेटिंग्स",itemsOrdered:"ऑर्डर किए गए आइटम",cart:"कार्ट",
      history:"ऑर्डर इतिहास",
      nearby:"आस-पास",search:"खोजें",logout:"लॉग आउट",ordersPending:"लंबित ऑर्डर",
      ordersCompleted:"पूर्ण ऑर्डर",moneyReceived:"कुल प्राप्त राशि",moneySpent:"खर्च की गई राशि",
      profile:"प्रोफ़ाइल", welcome:"वापसी पर स्वागत है"}
};
let lang = localStorage.getItem('ud_lang') || 'en';
function t(key){ return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key; }

/* ===============================
   MARKETPLACE / PRODUCE LISTING
   Small lookup helpers that decide
   which emoji icon and "keeps for
   X days" perishability badge to
   show for a given produce item.
   =============================== */
const CATEGORY_ICONS = {
  vegetable:"🥕", fruit:"🍎", dairy:"🥛", "grains/cereals/pulses":"🌾"
};
const PERISHABILITY = {
  milk:"4 hours", curd:"6 hours", paneer:"2 days",
  rice:"3 months", wheat:"6 months", "toor dal":"6 months", "moong dal":"6 months",
  tomato:"5 days", carrot:"10 days", potato:"3 weeks", onion:"1 month",
  brinjal:"5 days", cabbage:"1 week", banana:"3 days", mango:"5 days",
  apple:"3 weeks", papaya:"4 days", spinach:"2 days"
};
function guessPerishability(name, category){
  const key = name.toLowerCase();
  if (PERISHABILITY[key]) return PERISHABILITY[key];
  if (category==="dairy") return "12 hours";
  if (category==="fruit") return "5 days";
  if (category==="vegetable") return "7 days";
  return "3 months";
}
function iconFor(name, category){
  const key = name.toLowerCase();
  const map = {milk:"🥛",curd:"🥛",paneer:"🧀",rice:"🍚",wheat:"🌾","toor dal":"🫘","moong dal":"🫘",
    tomato:"🍅",carrot:"🥕",potato:"🥔",onion:"🧅",brinjal:"🍆",cabbage:"🥬",banana:"🍌",mango:"🥭",
    apple:"🍎",papaya:"🫓",spinach:"🥬"};
  return map[key] || CATEGORY_ICONS[category] || "🌿";
}

/* ===============================
   SEED / DEMO DATA
   Runs once (guarded by the
   'ud_seeded' flag) to pre-fill
   localStorage with demo farmers,
   consumers, produce, orders,
   auctions and demand numbers so
   the app is fully clickable
   without any backend.
   =============================== */
function seed(){
  if (localStorage.getItem('ud_seeded')) return;

  const users = {
    // notifications:[] holds alerts for this user, e.g. "you got a donation"
    karthik_farms:{type:"farmer",name:"Karthik Raman",phone:"9876543210",password:"pass123",
      village:"Salem, TN",bio:"Third-generation paddy & vegetable farmer.",followers:["divya_buys"],donations:[],notifications:[]},
    meena_agro:{type:"farmer",name:"Meena Devi",phone:"9123456780",password:"pass123",
      village:"Erode, TN",bio:"Organic dairy & millet farm.",followers:[],donations:[],notifications:[]},
    divya_buys:{type:"consumer",name:"Divya Sundar",phone:"9988776655",password:"pass123",
        following:["karthik_farms"],city:"Chennai",address:"14 Anna Nagar, Chennai, Tamil Nadu"}
  };

  const produce = [
    {id:"p1",farmer:"karthik_farms",name:"Rice",category:"grains/cereals/pulses",qty:500,price:42,unit:"kg"},
    {id:"p2",farmer:"karthik_farms",name:"Tomato",category:"vegetable",qty:120,price:28,unit:"kg"},
    {id:"p3",farmer:"karthik_farms",name:"Onion",category:"vegetable",qty:200,price:35,unit:"kg"},
    {id:"p4",farmer:"karthik_farms",name:"Mango",category:"fruit",qty:80,price:60,unit:"kg"},
    {id:"p5",farmer:"meena_agro",name:"Milk",category:"dairy",qty:60,price:52,unit:"litre"},
    {id:"p6",farmer:"meena_agro",name:"Carrot",category:"vegetable",qty:90,price:30,unit:"kg"},
    {id:"p7",farmer:"meena_agro",name:"Toor Dal",category:"grains/cereals/pulses",qty:150,price:110,unit:"kg"}
  ].map(p=>({...p, icon:iconFor(p.name,p.category), perish:guessPerishability(p.name,p.category), sold:false}));

  const orders = [
    {id:"o1",farmer:"karthik_farms",consumer:"Divya Sundar",item:"Rice",qty:10,unit:"kg",price:420,
      address:"14 Anna Nagar, Chennai",status:"pending",date:"2026-09-02"},
    {id:"o2",farmer:"karthik_farms",consumer:"Ravi Kumar",item:"Tomato",qty:5,unit:"kg",price:140,
      address:"22 Gandhi St, Salem",status:"pending",date:"2026-09-03"},
    {id:"o3",farmer:"karthik_farms",consumer:"Priya M",item:"Onion",qty:8,unit:"kg",price:280,
      address:"9 Lake Road, Coimbatore",status:"completed",date:"2026-08-28"},
    {id:"o4",farmer:"karthik_farms",consumer:"Divya Sundar",item:"Mango",qty:3,unit:"kg",price:180,
      address:"14 Anna Nagar, Chennai",status:"completed",date:"2026-08-25"}
  ];

  const auctions = [
    {id:"a1",farmer:"karthik_farms",item:"Rice",icon:"🍚",baseRate:40,unit:"kg",qty:300,
      highestBid:46,highestBidder:"AgroBulk Traders",endsAt:Date.now()+1000*60*60*2,sold:false},
    {id:"a2",farmer:"meena_agro",item:"Milk",icon:"🥛",baseRate:48,unit:"litre",qty:100,
      highestBid:48,highestBidder:null,endsAt:Date.now()+1000*60*45,sold:false}
  ];

  const demandHistory = {Rice:340,Tomato:280,Onion:250,Milk:210,Mango:150,Carrot:95,"Toor Dal":70};

  localStorage.setItem('ud_users', JSON.stringify(users));
  localStorage.setItem('ud_produce', JSON.stringify(produce));
  localStorage.setItem('ud_orders', JSON.stringify(orders));
  localStorage.setItem('ud_auctions', JSON.stringify(auctions));
  localStorage.setItem('ud_demand', JSON.stringify(demandHistory));
  localStorage.setItem('ud_cart_divya_buys', JSON.stringify([]));
  // ud_donations is the single ledger of every donation transaction
  // (see the DONATION TRANSACTION section below for how it's used).
  localStorage.setItem('ud_donations', JSON.stringify([]));
  // ud_ratings is the single ledger of every consumer→farmer rating
  // (see the FARMER RATING section below for how it's used).
  localStorage.setItem('ud_ratings', JSON.stringify([]));
  localStorage.setItem('ud_seeded', '1');
}
seed();

// Keep existing demo sessions compatible with the consumer profile fields.
function ensureConsumerProfileFields(){
  const users = store.get('ud_users');
  if (!users) return;
  let changed = false;
  Object.values(users).forEach(user=>{
    if (user.type==='consumer' && user.address === undefined){
      user.address = '';
      changed = true;
    }
    if (user.type==='consumer' && user.city === undefined){
      user.city = '';
      changed = true;
    }
  });
  if (users.divya_buys && !users.divya_buys.address) {
    users.divya_buys.address = '14 Anna Nagar, Chennai, Tamil Nadu';
    changed = true;
  }
  if (users.divya_buys && !users.divya_buys.city) {
    users.divya_buys.city = 'Chennai';
    changed = true;
  }
  if (changed) store.set('ud_users', users);
}

/* ===============================
   LOCALSTORAGE / DATA PERSISTENCE
   `store` is the one place all
   other code reads/writes app
   data, so every feature shares
   the same localStorage keys
   instead of inventing new ones.
   =============================== */
const store = {
  get(key){ return JSON.parse(localStorage.getItem(key) || 'null'); },
  set(key,val){ localStorage.setItem(key, JSON.stringify(val)); },
  users(){ return this.get('ud_users'); },
  saveUsers(u){ this.set('ud_users', u); },
  produce(){ return this.get('ud_produce'); },
  saveProduce(p){ this.set('ud_produce', p); },
  orders(){ return this.get('ud_orders'); },
  saveOrders(o){ this.set('ud_orders', o); },
  auctions(){ return this.get('ud_auctions'); },
  saveAuctions(a){ this.set('ud_auctions', a); },
  demand(){ return this.get('ud_demand'); },
  cart(username){ return this.get('ud_cart_'+username) || []; },
  saveCart(username,c){ this.set('ud_cart_'+username, c); },
  // Donation ledger: one entry per donation, shared by both the
  // donor's "Money Spent" view and the recipient's "Money Received" view.
  donations(){ return this.get('ud_donations') || []; },
  saveDonations(d){ this.set('ud_donations', d); },
  // Rating ledger: one entry per consumer→farmer rating (a consumer
  // re-rating the same farmer updates their existing entry, see recordRating()).
  ratings(){ return this.get('ud_ratings') || []; },
  saveRatings(r){ this.set('ud_ratings', r); }
};
ensureConsumerProfileFields();

/* ---------- Toast ---------- */
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=> el.classList.remove('show'), 2600);
}

/* ===============================
   DONATION ACCOUNTING
   Small helpers that total up a
   user's donations from the
   shared ud_donations ledger, so
   "Money Spent" (consumer) and
   "Money Received" (farmer) can
   both include donations without
   duplicating any data.
   =============================== */
// Total ₹ a consumer has donated across all farmers.
function consumerDonationsTotal(consumerId){
  return store.donations().filter(d=>d.consumerId===consumerId).reduce((s,d)=>s+d.amount,0);
}
// Total ₹ a farmer has received in donations from all consumers.
function farmerDonationsTotal(farmerId){
  return store.donations().filter(d=>d.farmerId===farmerId).reduce((s,d)=>s+d.amount,0);
}

/* ---------- Auth state ---------- */
let currentUser = localStorage.getItem('ud_currentUser') || null; // username
let currentRole = null; // 'farmer' | 'consumer'
let selectedRole = 'farmer'; // role toggle on auth screen
let pendingOtp = null;

function getUser(username){ return store.users()[username]; }

/* ===============================
   DONATION TRANSACTION
   Saves ONE donation record and
   uses it to update three things
   at once so they can never go
   out of sync:
     1. Consumer Money Spent
     2. Farmer Money Received
     3. Farmer Notification
   =============================== */
function recordDonation(consumerId, farmerId, amount){
  // 1. Save exactly one donation to the shared ledger.
  const donations = store.donations();
  const donation = {
    id: 'donation_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    consumerId, farmerId, amount,
    date: new Date().toISOString(),
    type: 'donation',
    status: 'completed'
  };
  donations.push(donation);
  store.saveDonations(donations);

  const users = store.users();

  // Keep a short copy on the farmer's own record too, for the
  // existing "Accept donations" table on the Farmer Profile page.
  users[farmerId].donations = users[farmerId].donations || [];
  users[farmerId].donations.push({name:getUser(consumerId).name, amount, note:'via app', donationId:donation.id});

  // 3. Create exactly one notification for the receiving farmer.
  users[farmerId].notifications = users[farmerId].notifications || [];
  users[farmerId].notifications.push({
    id: 'notif_' + Date.now(),
    type: 'donation',
    message: `${getUser(consumerId).name} donated ₹${amount} to you.`,
    read: false,
    date: donation.date
  });

  store.saveUsers(users);
  // Consumer Money Spent (2. Farmer Money Received) are not stored
  // separately — they're derived live from the ledger by
  // consumerDonationsTotal()/farmerDonationsTotal() wherever they're shown.
}

/* ===============================
   FARMER RATING
   Lets a consumer rate a farmer
   1-5 stars with an optional
   comment. Ratings are only ever
   shown back to the farmer who
   received them (see the
   "Ratings from consumers" block
   in renderFarmerProfile below).
   =============================== */
// Saves (or updates) one consumer's rating of one farmer. A consumer
// rating the same farmer again edits their existing rating instead of
// creating a duplicate entry.
function recordRating(consumerId, farmerId, stars, comment){
  const ratings = store.ratings();
  const existing = ratings.find(r=>r.consumerId===consumerId && r.farmerId===farmerId);
  if (existing){
    existing.stars = stars;
    existing.comment = comment;
    existing.date = new Date().toISOString();
  } else {
    ratings.push({
      id: 'rating_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      consumerId, consumerName: getUser(consumerId).name,
      farmerId, stars, comment,
      date: new Date().toISOString()
    });
  }
  store.saveRatings(ratings);
}
// Calculates the farmer's average rating from all ratings
// submitted by consumers.
function getFarmerAverageRating(farmerId){
  const mine = store.ratings().filter(r=>r.farmerId===farmerId);
  if (!mine.length) return {avg:0, count:0};
  const avg = mine.reduce((s,r)=>s+r.stars,0) / mine.length;
  return {avg, count: mine.length};
}
// Turns a numeric rating into a ★★★★☆-style string for display.
function starString(n){
  const full = Math.round(n);
  return '★'.repeat(full) + '☆'.repeat(5-full);
}

/* ===============================
   DONATION NOTIFICATIONS
   Bell icon in the topbar: shows
   an unread-count badge and a
   dropdown list of the current
   user's notifications.
   =============================== */
// Updates the little red badge on the bell to the current unread count.
function refreshNotifBadge(){
  const badge = document.getElementById('notifBadge');
  if (!badge || !currentUser) return;
  const count = (getUser(currentUser)?.notifications || []).filter(n=>!n.read).length;
  badge.textContent = count;
  badge.classList.toggle('hidden', count===0);
}
// Renders the dropdown list of notifications for the logged-in user.
function renderNotifPanel(){
  const panel = document.getElementById('notifPanel');
  const notifs = (getUser(currentUser)?.notifications || []).slice().reverse();
  if (!notifs.length){
    panel.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
    return;
  }
  panel.innerHTML = `<div class="notif-title">🔔 Notifications</div>` + notifs.map(n=>`
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-msg">${n.message}</div>
      <div class="notif-date">${new Date(n.date).toLocaleString()}</div>
      ${!n.read ? `<button class="pill-btn notif-read-btn" data-id="${n.id}">Mark as read</button>` : ''}
    </div>`).join('');
  panel.querySelectorAll('.notif-read-btn').forEach(btn=>{
    btn.onclick = ()=> markNotifRead(btn.dataset.id);
  });
}
// Marks one notification as read and refreshes the badge + panel.
function markNotifRead(id){
  const users = store.users();
  const n = (users[currentUser].notifications || []).find(x=>x.id===id);
  if (n) n.read = true;
  store.saveUsers(users);
  refreshNotifBadge();
  renderNotifPanel();
}
// On login, surface the newest unread notification as a toast so the
// farmer sees it right away without having to open the bell panel.
function maybeToastLatestNotif(){
  const unread = (getUser(currentUser)?.notifications || []).filter(n=>!n.read);
  if (unread.length) toast(`🔔 ${unread[unread.length-1].message}`);
}

/* ===============================
   AUTHENTICATION / LOGIN / SIGNUP
   Wires up the role switch (Farmer
   vs Consumer), the Login/Sign-up
   tabs, and validates credentials
   against ud_users. Sign-up also
   runs through the demo OTP step
   below before an account is created.
   =============================== */
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');

document.getElementById('roleFarmerBtn').onclick = ()=> setAuthRole('farmer');
document.getElementById('roleConsumerBtn').onclick = ()=> setAuthRole('consumer');
function setAuthRole(role){
  selectedRole = role;
  document.getElementById('roleFarmerBtn').classList.toggle('active', role==='farmer');
  document.getElementById('roleConsumerBtn').classList.toggle('active', role==='consumer');
  document.querySelectorAll('.roleLabelInline').forEach(el=> el.textContent = role==='farmer'?'Farmer':'Consumer');
}

document.querySelectorAll('.auth-tab').forEach(tab=>{
  tab.onclick = ()=>{
    document.querySelectorAll('.auth-tab').forEach(x=>x.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab==='login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('signupForm').classList.toggle('hidden', isLogin);
  };
});

document.getElementById('loginForm').addEventListener('submit', e=>{
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const users = store.users();
  let found = null;
  for (const uname in users){
    const u = users[uname];
    if ((uname===id || u.phone===id) && u.password===pass){ found = uname; break; }
  }
  if (!found){ toast("❌ No matching account. Check username/phone & password."); return; }
  if (users[found].type !== selectedRole){
    toast(`❌ This account is registered as ${users[found].type}, not ${selectedRole}.`); return;
  }
  loginAs(found);
});

// DEMO SIGNUP OTP: generates a random 6-digit code and shows it
// on-screen (no real SMS is sent) so judges/testers can verify it.
document.getElementById('sendOtpBtn').onclick = ()=>{
  const name = document.getElementById('suName').value.trim();
  const uname = document.getElementById('suUsername').value.trim();
  const phone = document.getElementById('suPhone').value.trim();
  const pass = document.getElementById('suPass').value;
  if (!name || !uname || phone.length!==10 || !pass){
    toast("⚠️ Fill all fields with a valid 10-digit phone number."); return;
  }
  if (store.users()[uname]){ toast("⚠️ Username already taken."); return; }
  pendingOtp = String(Math.floor(100000 + Math.random()*900000));
  document.getElementById('demoOtpDisplay').textContent = pendingOtp;
  document.getElementById('otpBlock').classList.remove('hidden');
  document.getElementById('sendOtpBtn').classList.add('hidden');
  document.getElementById('verifyOtpBtn').classList.remove('hidden');
  toast("📲 OTP sent (demo mode — shown on screen for judges)");
};

document.getElementById('signupForm').addEventListener('submit', e=>{
  e.preventDefault();
  const otpEntered = document.getElementById('suOtp').value.trim();
  if (otpEntered !== pendingOtp){ toast("❌ Incorrect OTP."); return; }
  const name = document.getElementById('suName').value.trim();
  const uname = document.getElementById('suUsername').value.trim();
  const phone = document.getElementById('suPhone').value.trim();
  const pass = document.getElementById('suPass').value;

  const users = store.users();
  users[uname] = selectedRole==='farmer'
    ? {type:"farmer",name,phone,password:pass,village:"Not set",bio:"",followers:[],donations:[]}
    : {type:"consumer",name,phone,password:pass,address:"",following:[]};
  store.saveUsers(users);
  if (selectedRole==='consumer') store.saveCart(uname, []);
  toast("✅ Account created!");
  loginAs(uname);
});

function loginAs(username){
  currentUser = username;
  currentRole = store.users()[username].type;
  localStorage.setItem('ud_currentUser', username);
  boot();
}

document.getElementById('logoutBtn').onclick = ()=>{
  currentUser = null; currentRole = null;
  localStorage.removeItem('ud_currentUser');
  boot();
};

document.getElementById('langSelect').value = lang;
document.getElementById('langSelect').onchange = e=>{
  lang = e.target.value;
  localStorage.setItem('ud_lang', lang);
  renderNav(); renderView(currentView);
};

document.getElementById('menuToggle').onclick = ()=>{
  document.querySelector('.sidebar').classList.toggle('open');
};

document.getElementById('cartBtn').onclick = openCartDrawer;
document.getElementById('closeCartBtn').onclick = closeCartDrawer;
document.getElementById('cartOverlay').onclick = closeCartDrawer;
document.getElementById('clearCartBtn').onclick = ()=>{
  if (!currentUser || currentRole!=='consumer') return;
  store.saveCart(currentUser, []);
  refreshCartViews();
  toast('Basket cleared');
};
document.getElementById('checkoutBtn').onclick = ()=>{
  if (!currentUser || !store.cart(currentUser).length) return;
  closeCartDrawer();
  openPaymentModal();
};
document.addEventListener('keydown', e=>{
  if (e.key==='Escape' && document.getElementById('cartDrawer').classList.contains('open')) closeCartDrawer();
});

// Toggle the notifications dropdown open/closed.
document.getElementById('notifBell').onclick = ()=>{
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderNotifPanel();
};
// Close the panel if the user clicks anywhere else on the page.
document.addEventListener('click', e=>{
  const wrap = document.querySelector('.notif-wrap');
  if (wrap && !wrap.contains(e.target)) document.getElementById('notifPanel').classList.add('hidden');
});

/* ===============================
   NAVIGATION / SIDEBAR
   Defines which menu items each
   role sees, and renderNav()/goTo()
   below build the sidebar buttons
   and switch the current view.
   =============================== */
const FARMER_NAV = [
  {id:'dashboard', icon:'📊', key:'dashboard'},
  {id:'sell', icon:'🌱', key:'sellItem'},
  {id:'bidding', icon:'⚖️', key:'bidding'},
  {id:'demand', icon:'📈', key:'demand'},
  {id:'chat', icon:'💬', key:'aiChat'},
  {id:'profile', icon:'👤', key:'profile'},
  {id:'settings', icon:'⚙️', key:'settings'}
];
const CONSUMER_NAV = [
  {id:'dashboard', icon:'📊', key:'dashboard'},
  {id:'nearby', icon:'📍', key:'nearby'},
  {id:'bidding', icon:'⚖️', key:'bidding'},
  {id:'search', icon:'🔍', key:'search'},
  {id:'history', icon:'🕘', key:'history'},
  {id:'profile', icon:'👤', key:'profile'},
  {id:'settings', icon:'⚙️', key:'settings'}
];

let currentView = 'dashboard';
// FARMER PROFILE (consumer-facing): which farmer's profile is currently
// open, and which view to return to when the consumer hits "Back".
let viewingFarmerId = null;
let cameFromView = 'nearby';

function renderNav(){
  const nav = currentRole==='farmer' ? FARMER_NAV : CONSUMER_NAV;
  const el = document.getElementById('sideNav');
  el.innerHTML = '';
  nav.forEach(item=>{
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (item.id===currentView ? ' active':'');
    btn.innerHTML = `<span>${item.icon}</span><span>${t(item.key)}</span>`;
    btn.onclick = ()=> goTo(item.id);
    el.appendChild(btn);
  });
}

function goTo(viewId){
  currentView = viewId;
  document.querySelector('.sidebar').classList.remove('open');
  renderNav();
  renderView(viewId);
}

function money(n){ return '₹' + Number(n).toLocaleString('en-IN'); }

/* ---------- Boot / routing ---------- */
function boot(){
  closeCartDrawer();
  if (currentUser){
    currentRole = getUser(currentUser).type;
    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    document.getElementById('cartBtn').classList.toggle('hidden', currentRole!=='consumer');
    renderCartDrawer();
    document.getElementById('userChipName').textContent = getUser(currentUser).name;
    currentView = 'dashboard';
    renderNav();
    renderView('dashboard');
    refreshNotifBadge();
    maybeToastLatestNotif();
  } else {
    appShell.classList.add('hidden');
    authScreen.classList.remove('hidden');
  }
}

// Titles for views that aren't in the sidebar nav (so they still get a
// sensible topbar title instead of falling back to the raw view id).
const EXTRA_VIEW_TITLES = {farmerProfile:'Farmer Profile'};

function renderView(viewId){
  document.getElementById('viewTitle').textContent =
    t(FARMER_NAV.concat(CONSUMER_NAV).find(n=>n.id===viewId)?.key || EXTRA_VIEW_TITLES[viewId] || viewId);
  const root = document.getElementById('viewRoot');
  root.innerHTML = '';
  if (currentRole==='farmer'){
    const map = {dashboard:renderFarmerDashboard, sell:renderSellItem, bidding:renderFarmerBidding,
      demand:renderDemand, chat:renderChat, profile:renderFarmerProfile, settings:renderFarmerSettings,
      pending:renderPendingOrders, completed:renderCompletedOrders, moneyTable:renderMoneyTable};
    (map[viewId]||renderFarmerDashboard)(root);
  } else {
    const map = {dashboard:renderConsumerDashboard, nearby:renderNearby, bidding:renderConsumerBidding,
      search:renderSearch, settings:renderConsumerSettings, itemsOrdered:renderItemsOrdered,
      history:renderOrderHistory, cart:renderCart, moneyTable:renderConsumerMoneyTable, following:renderFollowing,
      profile:renderConsumerProfile,
      farmerProfile:renderFarmerPublicProfile};
    (map[viewId]||renderConsumerDashboard)(root);
  }
}

// Opens a farmer's public profile page (view-only entry point used by
// both Search results and Nearby You). Remembers which view to return
// to so the "← Back" button on the profile feels natural.
function openFarmerProfile(uname, fromView){
  viewingFarmerId = uname;
  cameFromView = fromView || currentView;
  goTo('farmerProfile');
}

/* ======================================================================= *
 *  FARMER VIEWS
 * ======================================================================= */
function renderFarmerDashboard(root){
  const orders = store.orders().filter(o=>o.farmer===currentUser);
  const pending = orders.filter(o=>o.status==='pending');
  const completed = orders.filter(o=>o.status==='completed');
  // Money Received = completed order sales + any donations this farmer got.
  const totalMoney = completed.reduce((s,o)=>s+o.price,0) + farmerDonationsTotal(currentUser);

  root.innerHTML = `
    <div class="stat-strip">
      <div class="stat-cell" id="cellPending"><span class="stat-num">${pending.length}</span><span class="stat-label">${t('ordersPending')}</span></div>
      <div class="stat-cell" id="cellCompleted"><span class="stat-num">${completed.length}</span><span class="stat-label">${t('ordersCompleted')}</span></div>
      <div class="stat-cell" id="cellMoney"><span class="stat-num">${money(totalMoney)}</span><span class="stat-label">${t('moneyReceived')}</span></div>
    </div>
    <div class="section-head"><h3>Your produce listings</h3><span class="muted">${store.produce().filter(p=>p.farmer===currentUser).length} active</span></div>
    <div class="produce-grid" id="myProduce"></div>
  `;
  document.getElementById('cellPending').onclick = ()=> goTo('pending');
  document.getElementById('cellCompleted').onclick = ()=> goTo('completed');
  document.getElementById('cellMoney').onclick = ()=> goTo('moneyTable');

  const grid = document.getElementById('myProduce');
  const mine = store.produce().filter(p=>p.farmer===currentUser);
  if (!mine.length){ grid.innerHTML = `<div class="empty-state"><div class="glyph">🌱</div>No produce listed yet. Go to "Sell Item" to add your first listing.</div>`; }
  mine.forEach(p=> grid.appendChild(produceCardEl(p, true)));
}

function produceCardEl(p, isOwner){
  const div = document.createElement('div');
  div.className = 'produce-card';
  div.innerHTML = `
    <div class="produce-img">${p.icon}</div>
    <div class="produce-body">
      <div class="produce-name">${p.name}</div>
      <div class="produce-meta">${p.qty} ${p.unit} available</div>
      <span class="badge perish">Keeps ${p.perish}</span>
      <div class="produce-price">${money(p.price)} <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">/ ${p.unit}</span></div>
      ${!isOwner ? `<div style="margin-top:4px;color:var(--ink-soft);font-size:12px;">by ${getUser(p.farmer)?.name || p.farmer}</div>` : ''}
    </div>
  `;
  return div;
}

// ===============================
// DELIVERY TRACKING
// One shared "deliveryStage" per order drives THREE things at once:
// the farmer's order-management view, the consumer's order list, and
// the consumer's tracking timeline — so they can never go out of sync.
// Older/seeded orders don't have a deliveryStage saved, so
// getOrderStage() derives a sensible one from the existing status.
// ===============================
const DELIVERY_STAGES = ['placed','confirmed','packed','atFarmerCity','atCustomerCity','atFpo','outForDelivery','delivered'];
const DELIVERY_STAGE_LABELS = {
  placed:'Order Placed', confirmed:'Order Confirmed', packed:'Packed',
  atFarmerCity:'Reached farmer city', atCustomerCity:'Reached destination',
  atFpo:'Arrived at FPO office', outForDelivery:'Out for Delivery', delivered:'Delivered'
};
const DELIVERY_STAGE_DESC = {
  placed:'Your order has been placed.', confirmed:'Farmer has confirmed the order.',
  packed:'Your produce has been packed.', atFarmerCity:'Your order has reached the farmer city.',
  atCustomerCity:'Your order has reached its destination.',
  atFpo:'Your order has reached the customer-city FPO office.',
  outForDelivery:'Your order is on the way to your address.', delivered:'Your order has been delivered.'
};
// Returns this order's current delivery stage, falling back to a
// reasonable guess (based on status) for orders saved before tracking existed.
function getOrderStage(o){
  if (o.deliveryStage === 'atFarmerFpo') return 'atFarmerCity';
  if (o.deliveryStage === 'atCity') return 'atCustomerCity';
  if (o.deliveryStage) return o.deliveryStage;
  if (o.status === 'completed') return 'delivered';
  return 'placed';
}
function isDeliveredOrder(order){
  return order.status!=='refunded' && (order.status==='completed' || getOrderStage(order)==='delivered');
}
function productForOrder(order){
  const itemName = order.item || order.name;
  return store.produce().find(product=>
    (order.productId && product.id===order.productId) ||
    (product.farmer===order.farmer && product.name===itemName)
  );
}
function deliveryStageLabel(order, stage=getOrderStage(order)){
  const farmerVillage = getUser(order.farmer)?.village || '';
  const farmerCity = cityFromAddress(farmerVillage) || farmerVillage.split(',')[0].trim() || 'Farm';
  const customerCity = customerCityForOrder(order) || 'Customer city';
  if (stage==='atFarmerCity') return farmerCity;
  if (stage==='atCustomerCity') return customerCity;
  if (stage==='atFpo') return `${customerCity} FPO office`;
  return DELIVERY_STAGE_LABELS[stage];
}
function customerCityForOrder(order){
  const customer = Object.values(store.users()).find(user=>user.type==='consumer' && user.name===order.consumer);
  return customer?.city?.trim() || order.city?.trim() || '';
}
// A short "FD1024"-style display code, so the tracking view has a
// friendly order number instead of the raw internal id.
function orderDisplayId(o){
  return 'FD' + o.id.replace(/[^0-9]/g,'').slice(-4).padStart(4,'0');
}
function cityFromAddress(address){
  if (!address) return '';
  const cities = ['Chennai','Salem','Coimbatore','Erode','Madurai','Trichy','Tiruchirappalli','Thanjavur'];
  return cities.find(city=>address.toLowerCase().includes(city.toLowerCase())) || '';
}
const CITY_COORDINATES = {
  chennai:{lat:13.0827,lon:80.2707},
  salem:{lat:11.6643,lon:78.1460},
  coimbatore:{lat:11.0168,lon:76.9558},
  erode:{lat:11.3410,lon:77.7172},
  madurai:{lat:9.9252,lon:78.1198},
  trichy:{lat:10.7905,lon:78.7047},
  tiruchirappalli:{lat:10.7905,lon:78.7047},
  thanjavur:{lat:10.7870,lon:79.1378}
};
function coordinatesForCity(city){
  if (!city) return null;
  const normalized = city.toLowerCase().replace(/[^a-z]/g,'');
  const cityName = Object.keys(CITY_COORDINATES)
    .sort((a,b)=>b.length-a.length)
    .find(name=>normalized.includes(name));
  return cityName ? CITY_COORDINATES[cityName] : null;
}
function distanceBetweenCitiesKm(fromCity,toCity){
  const from = coordinatesForCity(fromCity);
  const to = coordinatesForCity(toCity);
  if (!from || !to) return null;
  const radians = degrees=>degrees*Math.PI/180;
  const latDelta = radians(to.lat-from.lat);
  const lonDelta = radians(to.lon-from.lon);
  const a = Math.sin(latDelta/2)**2 + Math.cos(radians(from.lat))*Math.cos(radians(to.lat))*Math.sin(lonDelta/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
// Moves an order one step forward through DELIVERY_STAGES. Reaching
// "delivered" also marks the order status "completed" so it's counted
// in Money Received / Orders Completed, same as before tracking existed.
function advanceOrderStage(orderId){
  const orders = store.orders();
  const o = orders.find(x=>x.id===orderId);
  if (!o) return;
  if (getOrderStage(o)==='atFpo' && !o.fpoDeliveryTiming){
    toast('Choose a delivery time in order tracking before dispatch.');
    return;
  }
  const idx = DELIVERY_STAGES.indexOf(getOrderStage(o));
  const next = DELIVERY_STAGES[Math.min(idx+1, DELIVERY_STAGES.length-1)];
  o.deliveryStage = next;
  if (next === 'delivered') o.status = 'completed';
  store.saveOrders(orders);
  toast(`📦 Order ${orderDisplayId(o)} → ${deliveryStageLabel(o,next)}`);
  renderView(currentView);
}
// Builds and shows the Amazon-style vertical delivery timeline for one
// order. Used by the consumer's "Track Delivery" button.
function openTrackingModal(orderId){
  const o = store.orders().find(x=>x.id===orderId);
  if (!o) return;
  const stage = getOrderStage(o);
  const curIdx = DELIVERY_STAGES.indexOf(stage);
  const orderedProduct = productForOrder(o);
  const farmer = getUser(orderedProduct?.farmer || o.farmer);
  const currentCustomer = getUser(currentUser);
  const customer = currentCustomer?.type==='consumer' && currentCustomer.name===o.consumer
    ? currentCustomer
    : Object.values(store.users()).find(user=>user.type==='consumer' && user.name===o.consumer);
  const destinationAddress = customer?.address || o.address || '';
  const destinationCity = customer?.city?.trim() || o.city || 'Customer city';
  const farmerLocation = [farmer?.village,orderedProduct?.farmAddress,orderedProduct?.location,o.farmAddress]
    .map(location=>String(location||'').trim())
    .find(location=>location && !/^(not set|unknown|n\/a|village not set|farm location)(?:\b|,)/i.test(location)) || '';
  const farmAddress = farmerLocation;
  const farmerCityName = cityFromAddress(farmerLocation) || farmerLocation.split(',')[0].trim();
  const customerFpoAddress = o.fpoAddress || `FPO office, ${destinationCity}, Tamil Nadu`;
  const overlay = document.createElement('div'); overlay.className='modal-overlay';
  overlay.innerHTML = `<div class="tracker-modal">
    <header class="tracker-header">
      <div><p class="eyebrow">Live order tracking</p><h3>Order tracking</h3>
        <p class="tracker-order-meta">Order #${orderDisplayId(o)} · ${o.item} · ${o.qty}${o.unit} · ${money(o.price)}</p></div>
      <button class="icon-close" id="closeTracking" type="button" aria-label="Close tracking">✕</button>
    </header>
    <div class="tracker-layout">
      <section class="tracker-sidebar">
        <div id="dynamic-tracking-timeline" class="tracking-timeline"></div>
        <div class="tracker-actions"><span class="status-label">Current status: <strong id="trackerStatusLabel"></strong></span>
          <button class="btn-primary tracker-advance" id="btnSimulateStep" type="button" disabled>Advance tracking</button>
        </div>
      </section>
      <section class="tracker-map-column">
        <p id="routeMessage" class="tracker-route-message" role="status" hidden></p>
        <div id="routeStatsHUD" class="stats-hud hidden">
          <div class="stat-pill"><span>Road distance</span><strong id="statDistance">—</strong></div>
          <div class="stat-pill"><span>Estimated travel time</span><strong id="statDuration">—</strong></div>
          <div class="stat-pill"><span>City route</span><strong>${farmerCityName} → ${destinationCity}</strong></div>
        </div>
        <div id="liveTrackingMap" class="tracker-map"></div>
        <section id="fpoDispatchCard" class="arrival-drawer hidden">
          <div class="arrival-icon" aria-hidden="true">🏢</div><div>
            <h4>Order reached ${destinationCity} FPO office</h4>
            <p>Choose a delivery time for ${destinationCity}.</p>
            <form id="frmFpoSchedule" class="delivery-schedule-form" data-schedule="fpo">
              <label>Delivery time<select class="schedule-choice" required><option value="" disabled selected>Choose a time</option><option value="morning">Morning (8:00 AM–11:00 AM)</option><option value="afternoon">Afternoon (1:00 PM–4:00 PM)</option><option value="evening">Evening (5:00 PM–8:00 PM)</option><option value="custom">Custom timing</option></select></label>
              <div class="custom-time-wrap hidden">
                <label>Delivery date<input class="custom-date-input" type="text" inputmode="numeric" placeholder="DD/MM" maxlength="5" autocomplete="off"></label>
                <label>Delivery time<input class="custom-time-input" type="time"></label>
              </div>
              <button class="btn-success" type="submit">Confirm delivery time</button>
              <p class="schedule-saved hidden" role="status"></p>
            </form>
          </div>
        </section>
      </section>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#closeTracking').onclick = ()=> overlay.remove();

  const timeline = overlay.querySelector('#dynamic-tracking-timeline');
  const advanceButton = overlay.querySelector('#btnSimulateStep');
  const statusLabel = overlay.querySelector('#trackerStatusLabel');
  const routeMessage = overlay.querySelector('#routeMessage');
  const fpoCard = overlay.querySelector('#fpoDispatchCard');
  let map = null;
  let routeStops = [];
  let routeCoordinates = [];
  let currentRouteStage = Math.max(0,curIdx);

  function renderTrackingProgress(){
    timeline.innerHTML = DELIVERY_STAGES.map((deliveryStage,index)=>{
      const state = index<currentRouteStage?'done':index===currentRouteStage?'current':'upcoming';
      const label = deliveryStageLabel(o,deliveryStage);
      const description = deliveryStage==='atFarmerCity' ? `From ${farmerCityName}.`
        : deliveryStage==='atCustomerCity' ? `Order arrived in ${destinationCity}.`
        : deliveryStage==='atFpo' ? currentRouteStage<index
          ? `Delivery time can be chosen after arrival at the ${destinationCity} FPO office.`
          : currentRouteStage===index
            ? `Order arrived at the ${destinationCity} FPO office. Choose a delivery time to continue.`
            : `Delivery time confirmed; order dispatched from the ${destinationCity} FPO office.`
        : DELIVERY_STAGE_DESC[deliveryStage];
      return `<div class="tracking-step ${state}"><div class="tracking-dot">${index<currentRouteStage?'✓':index===currentRouteStage?'●':'○'}</div>
        <div class="tracking-text"><div class="tracking-label">${label}</div><div class="tracking-desc">${description}</div></div></div>`;
    }).join('');
    const currentStage = DELIVERY_STAGES[currentRouteStage];
    statusLabel.textContent = DELIVERY_STAGE_LABELS[currentStage];
    fpoCard.classList.toggle('hidden',currentStage!=='atFpo');
    advanceButton.disabled = !routeStops.length || currentRouteStage>=DELIVERY_STAGES.length-1 ||
      (currentStage==='atFpo' && !o.fpoDeliveryTiming);
      advanceButton.textContent = currentRouteStage>=DELIVERY_STAGES.length-1 ? 'Delivered' : 'Advance tracking';
    advanceButton.textContent = currentRouteStage>=DELIVERY_STAGES.length-1 ? 'Delivered' : 'Advance tracking';
  }

  function wireScheduleForm(form){
    const select = form.querySelector('.schedule-choice');
    const customWrap = form.querySelector('.custom-time-wrap');
    const customInput = form.querySelector('.custom-time-input');
      const customDate = form.querySelector('.custom-date-input');
    const savedMessage = form.querySelector('.schedule-saved');
    const property = 'fpoDeliveryTiming';
    const existing = o[property];
    if (existing){
      select.value = existing.type;
      if (existing.type==='custom'){
        customWrap.classList.remove('hidden');
        customDate.required = true;
        customInput.required = true;
        const savedValue = existing.value || '';
        const legacyValue = savedValue.match(/^\d{4}-(\d{2})-(\d{2})T(\d{2}:\d{2})/);
        const [savedDate,savedTime] = savedValue.split('|');
        customDate.value = legacyValue ? `${legacyValue[2]}/${legacyValue[1]}` : savedDate || '';
        customInput.value = legacyValue ? legacyValue[3] : savedTime || '';
      }
      savedMessage.textContent = `Saved: ${existing.label}`;
      savedMessage.classList.remove('hidden');
    }
    select.onchange = ()=>{
      const isCustom = select.value==='custom';
      customWrap.classList.toggle('hidden',!isCustom);
      customDate.required = isCustom;
      customInput.required = isCustom;
      if (isCustom) customDate.focus();
    };
    form.onsubmit = event=>{
      event.preventDefault();
      const isCustom = select.value==='custom';
      if (!select.value) return;
      if (isCustom){
        const dateMatch = customDate.value.match(/^(\d{2})\/(\d{2})$/);
        if (!dateMatch || Number(dateMatch[1])<1 || Number(dateMatch[1])>31 || Number(dateMatch[2])<1 || Number(dateMatch[2])>12 || !customInput.value){
          toast('Enter the date as DD/MM and choose a time.');
          return;
        }
        const maximumDay = new Date(2024,Number(dateMatch[2]),0).getDate();
        if (Number(dateMatch[1])>maximumDay){
          toast('Enter a valid date as DD/MM.');
          return;
        }
      }
      const optionLabel = select.selectedOptions[0].textContent;
      const customValue = `${customDate.value}|${customInput.value}`;
      const timing = {type:select.value,value:isCustom?customValue:'',label:isCustom?`${customDate.value} at ${customInput.value}`:optionLabel};
      const orders = store.orders();
      const trackedOrder = orders.find(order=>order.id===orderId);
      if (!trackedOrder) return;
      trackedOrder[property] = timing;
      store.saveOrders(orders);
      o[property] = timing;
      savedMessage.textContent = `Saved: ${timing.label}`;
      savedMessage.classList.remove('hidden');
      renderTrackingProgress();
      toast('Delivery time saved.');
    };
  }
  wireScheduleForm(overlay.querySelector('#frmFpoSchedule'));

  advanceButton.onclick = ()=>{
    if (advanceButton.disabled) return;
    currentRouteStage = Math.min(currentRouteStage+1,DELIVERY_STAGES.length-1);
    const stageName = DELIVERY_STAGES[currentRouteStage];
    const stopIndex = stageName==='atFarmerCity' ? 1 : stageName==='atCustomerCity' ? 2 : stageName==='atFpo' ? 3 : stageName==='outForDelivery' || stageName==='delivered' ? 4 : 0;
    const stop = routeStops[stopIndex];
    if (stop && map){
      map.panTo([stop.lat,stop.lon]);
      routeCoordinates.forEach((point,index)=>{
        const isCurrent = index===stopIndex;
        point.marker.setOpacity(isCurrent?1:.65);
      });
    }
    const orders = store.orders();
    const trackedOrder = orders.find(order=>order.id===orderId);
    if (trackedOrder){
      trackedOrder.deliveryStage = stageName;
      if (stageName==='delivered') trackedOrder.status='completed';
      store.saveOrders(orders);
      o.deliveryStage = stageName;
    }
    renderTrackingProgress();
  };

  function fallbackCoordinates(address){
    const city = cityFromAddress(address);
    const coords = coordinatesForCity(city);
    return coords ? {lat:coords.lat,lon:coords.lon,label:city} : null;
  }

  async function geocodeLocation(address){
    try{
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`);
      if (!response.ok) return null;
      const results = await response.json();
      if (!results.length) return null;
      return {lat:Number(results[0].lat),lon:Number(results[0].lon),label:results[0].display_name.split(',')[0]};
    } catch (error){ return null; }
  }

  async function initializeRoadRoute(){
    const customerCity=destinationCity;
    const customerAddress=destinationAddress || destinationCity;
    if (!farmAddress || !farmerCityName){
      routeMessage.hidden=false;
      routeMessage.textContent='Tracking needs a farm location in the farmer profile.';
      return;
    }
    const locations=[farmAddress,farmerCityName,customerCity,customerFpoAddress,customerAddress];
    if (!window.L){
      routeMessage.hidden=false;
      routeMessage.textContent='The map library is unavailable. Delivery status remains available, but a road map cannot be loaded.';
      return;
    }
    routeMessage.hidden=false;
    routeMessage.textContent='Loading delivery tracking…';
    try{
      const locationResults=[];
      for (let index=0;index<locations.length;index++){
        let addressToGeocode=locations[index];
        if (index<=1 && !/tamil\s*nadu|india/i.test(addressToGeocode)){
          addressToGeocode=`${addressToGeocode}, Tamil Nadu, India`;
        } else if (index===4 && !addressToGeocode.toLowerCase().includes(customerCity.toLowerCase())){
          addressToGeocode=`${addressToGeocode}, ${customerCity}, Tamil Nadu, India`;
        }
        let result=index===1 || index===2 ? fallbackCoordinates(locations[index])
          : index===3 ? locationResults[2]
          : null;
        if (!result) result=await geocodeLocation(addressToGeocode);
        if (!result) result=fallbackCoordinates(locations[index]);
        if (!result) throw new Error(`Could not locate ${locations[index]}. Add a Tamil Nadu city to the address and retry.`);
        locationResults.push(result);
        if (index<locations.length-1) await new Promise(resolve=>window.setTimeout(resolve,1100));
      }
      const farmerCity=locationResults[1];
      const customerCityPoint=locationResults[2];
      const customerFpo=locationResults[3];
      const home=locationResults[4];
      routeStops=[
        {...locationResults[0],name:'Farm pickup'},
        {...farmerCity,name:farmerCityName},
        {...customerCityPoint,name:destinationCity},
        {...customerFpo,name:`${destinationCity} FPO office`},
        {...home,name:'Customer address'}
      ];
      const routeWaypoints=routeStops.reduce((waypoints,stop)=>{
        const previous=waypoints[waypoints.length-1];
        if (!previous || Math.abs(previous.lat-stop.lat)>0.00001 || Math.abs(previous.lon-stop.lon)>0.00001){
          waypoints.push(stop);
        }
        return waypoints;
      },[]);
      if (routeWaypoints.length<2) throw new Error('Could not build a road route between the farmer and customer cities.');
      const coordinateList=routeWaypoints.map(stop=>`${stop.lon},${stop.lat}`).join(';');
      const routeResponse=await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinateList}?overview=full&geometries=geojson&steps=false`);
      const routeData=await routeResponse.json();
      if (!routeResponse.ok || routeData.code!=='Ok' || !routeData.routes?.length) throw new Error('Road routing service could not find a route for these locations.');
      const roadRoute=routeData.routes[0];
      const distanceKm=roadRoute.distance/1000;
      const durationMinutes=Math.round(roadRoute.duration/60);
      overlay.querySelector('#statDistance').textContent=`${distanceKm.toFixed(1)} km`;
      overlay.querySelector('#statDuration').textContent=durationMinutes<60
        ? `${durationMinutes} min`
        : `${Math.floor(durationMinutes/60)} hr ${durationMinutes%60} min`;
      overlay.querySelector('#routeStatsHUD').classList.remove('hidden');
      if (map) map.remove();
      map=L.map(overlay.querySelector('#liveTrackingMap')).setView([routeStops[0].lat,routeStops[0].lon],7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
      const line=L.geoJSON(roadRoute.geometry,{style:{color:'#16794b',weight:5,opacity:.86}}).addTo(map);
      routeCoordinates=routeStops.map((stop,index)=>{
        const marker=L.marker([stop.lat,stop.lon]).addTo(map).bindPopup(stop.name);
        return {marker,index};
      });
      map.fitBounds(line.getBounds(),{padding:[28,28]});
      const orders=store.orders();
      const trackedOrder=orders.find(order=>order.id===orderId);
      if (trackedOrder){
        trackedOrder.productId ||= orderedProduct?.id;
        trackedOrder.farmAddress=locations[0];
        trackedOrder.city=customerCity;
        trackedOrder.fpoAddress=locations[3];
        trackedOrder.address=locations[4];
        store.saveOrders(orders);
      }
      advanceButton.disabled=false;
      renderTrackingProgress();
      routeMessage.hidden=true;
      routeMessage.textContent='';
      window.setTimeout(()=>map?.invalidateSize(),100);
    } catch(error){
      routeMessage.hidden=false;
      routeMessage.textContent=error.message || 'Could not calculate this route. Check the addresses and try again.';
    }
  }

  renderTrackingProgress();
  initializeRoadRoute();
}

// ===============================
// ORDERS (farmer side)
// Pending = still to be delivered/refunded.
// Completed = delivered, counted in Money Received.
// ===============================
function renderPendingOrders(root){
  const pending = store.orders().filter(o=>o.farmer===currentUser && o.status==='pending');
  root.innerHTML = `<div class="section-head"><h3>${t('ordersPending')}</h3></div><div class="card" id="pList"></div>`;
  const list = document.getElementById('pList');
  if (!pending.length){ list.innerHTML = `<div class="empty-state"><div class="glyph">📦</div>No pending orders right now.</div>`; return; }
  pending.forEach(o=>{
    const stage = getOrderStage(o);
    const nextIdx = Math.min(DELIVERY_STAGES.indexOf(stage)+1, DELIVERY_STAGES.length-1);
    const nextLabel = deliveryStageLabel(o,DELIVERY_STAGES[nextIdx]);
    const waitingForDeliveryTime = stage==='atFpo' && !o.fpoDeliveryTiming;
    const row = document.createElement('div'); row.className = 'order-row';
    row.innerHTML = `
      <div>
        <div class="order-item-name">${o.item} × ${o.qty}${o.unit} <span class="badge">${deliveryStageLabel(o,stage)}</span></div>
        <div class="order-sub">From ${o.consumer} · ${o.address}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="produce-price" style="font-size:15px;">${money(o.price)}</span>
        <button class="pill-btn" data-a="advance" ${waitingForDeliveryTime||stage==='delivered'?'disabled':''}>${waitingForDeliveryTime?'Waiting for delivery time':stage==='delivered' ? 'Delivered' : '→ '+nextLabel}</button>
        <button class="pill-btn danger" data-a="refund">Refund</button>
      </div>`;
    row.querySelector('[data-a="advance"]').onclick = ()=> advanceOrderStage(o.id);
    row.querySelector('[data-a="refund"]').onclick = ()=> updateOrderStatus(o.id,'refunded');
    list.appendChild(row);
  });
}
function updateOrderStatus(id,status){
  const orders = store.orders();
  const o = orders.find(x=>x.id===id);
  o.status = status;
  store.saveOrders(orders);
  toast(status==='completed' ? "✅ Order marked delivered" : "💸 Refund issued to consumer");
  renderView(currentView);
}

function renderCompletedOrders(root){
  const completed = store.orders().filter(o=>o.farmer===currentUser && o.status==='completed');
  root.innerHTML = `<div class="section-head"><h3>${t('ordersCompleted')}</h3></div><div class="card" id="cList"></div>`;
  const list = document.getElementById('cList');
  if (!completed.length){ list.innerHTML = `<div class="empty-state"><div class="glyph">✅</div>No completed orders yet.</div>`; return; }
  completed.forEach(o=>{
    const row = document.createElement('div'); row.className = 'order-row';
    row.innerHTML = `<div>
        <div class="order-item-name">${o.item} × ${o.qty}${o.unit}</div>
        <div class="order-sub">${o.consumer} · ${o.address} · ${o.date}</div>
      </div>
      <span class="produce-price" style="font-size:15px;">${money(o.price)}</span>`;
    list.appendChild(row);
  });
}

// Shows every rupee this farmer has received: completed order sales AND
// donations, combined into one table so the total matches the dashboard stat.
function renderMoneyTable(root){
  const completed = store.orders().filter(o=>o.farmer===currentUser && o.status==='completed');
  const myDonations = store.donations().filter(d=>d.farmerId===currentUser);
  const total = completed.reduce((s,o)=>s+o.price,0) + myDonations.reduce((s,d)=>s+d.amount,0);

  const orderRows = completed.map(o=>`<tr><td>${o.date}</td><td>${o.item} ×${o.qty}${o.unit}</td><td>${o.consumer}</td><td>${money(o.price)}</td></tr>`);
  const donationRows = myDonations.map(d=>`<tr><td>${d.date.slice(0,10)}</td><td>Donation</td><td>${getUser(d.consumerId)?.name||d.consumerId}</td><td>${money(d.amount)}</td></tr>`);

  root.innerHTML = `<div class="section-head"><h3>${t('moneyReceived')}</h3><span class="muted">${money(total)} total</span></div>
    <div class="card"><table><thead><tr><th>Date</th><th>Item</th><th>Buyer</th><th>Amount</th></tr></thead>
    <tbody>${[...orderRows, ...donationRows].join('') || '<tr><td colspan="4">No transactions yet.</td></tr>'}</tbody></table></div>`;
}

function renderSellItem(root){
  root.innerHTML = `
    <div class="section-head"><h3>${t('sellItem')}</h3></div>
    <div class="card">
      <div class="form-grid">
        <label>Category
          <select id="sCategory">
            <option value="vegetable">Vegetable</option>
            <option value="fruit">Fruit</option>
            <option value="dairy">Dairy product</option>
            <option value="grains/cereals/pulses">Grains / Cereals / Pulses</option>
          </select>
        </label>
        <label>Produce name
          <input type="text" id="sName" placeholder="e.g. Tomato">
        </label>
        <label>Available quantity
          <input type="number" id="sQty" placeholder="e.g. 100" min="1">
        </label>
        <label>Unit
          <select id="sUnit"><option value="kg">kg</option><option value="litre">litre</option><option value="dozen">dozen</option></select>
        </label>
        <label class="full">Price per unit (₹)
          <input type="number" id="sPrice" placeholder="e.g. 30" min="1">
        </label>
      </div>
      <button class="btn-primary" id="addProduceBtn" style="margin-top:16px;">＋ Add produce</button>
    </div>
    <div class="section-head" style="margin-top:24px;"><h3>Live on marketplace</h3></div>
    <div class="produce-grid" id="myProduce2"></div>
  `;
  document.getElementById('addProduceBtn').onclick = ()=>{
    const name = document.getElementById('sName').value.trim();
    const category = document.getElementById('sCategory').value;
    const qty = Number(document.getElementById('sQty').value);
    const unit = document.getElementById('sUnit').value;
    const price = Number(document.getElementById('sPrice').value);
    if (!name || !qty || !price){ toast("⚠️ Fill in all fields."); return; }
    const produce = store.produce();
    produce.push({id:'p'+Date.now(), farmer:currentUser, name, category, qty, unit, price,
      icon:iconFor(name,category), perish:guessPerishability(name,category), sold:false});
    store.saveProduce(produce);
    toast(`✅ ${name} listed on the marketplace`);
    renderView('sell');
  };
  const grid = document.getElementById('myProduce2');
  store.produce().filter(p=>p.farmer===currentUser).forEach(p=> grid.appendChild(produceCardEl(p,true)));
}

// ===============================
// AUCTIONS / BIDDING
// Farmers start an auction with a
// base price and duration; consumers
// place bids until it ends, then the
// highest bidder wins (see placeBid
// and closeAuctionIfNeeded below).
// ===============================
function renderFarmerBidding(root){
  const auctions = store.auctions().filter(a=>a.farmer===currentUser);
  root.innerHTML = `
    <div class="section-head"><h3>${t('bidding')}</h3></div>
    <div class="card">
      <div class="form-grid">
        <label>Produce to auction
          <select id="aItem">${store.produce().filter(p=>p.farmer===currentUser).map(p=>`<option value="${p.id}">${p.name}</option>`).join('') || '<option>Add produce first</option>'}</select>
        </label>
        <label>Base rate (₹/unit)<input type="number" id="aBase" placeholder="e.g. 40"></label>
        <label>Auction duration<select id="aDuration"><option value="1">1 hour</option><option value="2" selected>2 hours</option><option value="6">6 hours</option><option value="24">24 hours</option></select></label>
        <label>Quantity available<input type="number" id="aQty" placeholder="e.g. 200"></label>
      </div>
      <button class="btn-primary" id="startAuctionBtn" style="margin-top:14px;">🚀 Start auction</button>
    </div>
    <div class="section-head" style="margin-top:22px;"><h3>Your active &amp; past auctions</h3></div>
    <div id="auctionList"></div>
  `;
  document.getElementById('startAuctionBtn').onclick = ()=>{
    const pid = document.getElementById('aItem').value;
    const p = store.produce().find(x=>x.id===pid);
    const base = Number(document.getElementById('aBase').value);
    const hrs = Number(document.getElementById('aDuration').value);
    const qty = Number(document.getElementById('aQty').value);
    if (!p || !base || !qty){ toast("⚠️ Fill all auction fields."); return; }
    const auctions = store.auctions();
    auctions.push({id:'a'+Date.now(), farmer:currentUser, item:p.name, icon:p.icon, baseRate:base,
      unit:p.unit, qty, highestBid:base, highestBidder:null, endsAt:Date.now()+hrs*3600*1000, sold:false});
    store.saveAuctions(auctions);
    toast("🚀 Auction started!");
    renderView('bidding');
  };
  renderAuctionList(document.getElementById('auctionList'), auctions, false);
}

function renderAuctionList(container, auctions, biddable){
  if (!auctions.length){ container.innerHTML = `<div class="empty-state"><div class="glyph">⚖️</div>No auctions yet.</div>`; return; }
  container.innerHTML = '';
  auctions.forEach(a=>{
    const div = document.createElement('div'); div.className = 'auction-card';
    div.innerHTML = `
      <div class="auction-icon">${a.icon}</div>
      <div class="auction-info">
        <div class="order-item-name">${a.item} <span class="order-sub">(${a.qty} ${a.unit}, base ${money(a.baseRate)})</span></div>
        <div class="auction-bid-row">
          <span>Highest bid: <strong class="produce-price" style="font-size:15px;">${money(a.highestBid)}</strong></span>
          <span class="order-sub">${a.highestBidder ? 'by '+a.highestBidder : 'No bids yet'}</span>
        </div>
        ${biddable ? `<div class="auction-bid-row"><input type="number" class="bid-input" placeholder="Your bid" data-id="${a.id}"><button class="pill-btn" data-bid="${a.id}">Place bid</button></div>` : ''}
      </div>
      <div style="text-align:right;">
        <div class="timer" data-timer="${a.id}"></div>
        ${a.sold ? `<span class="badge sold">Sold out</span>` : ''}
      </div>
    `;
    container.appendChild(div);
    if (biddable && !a.sold){
      div.querySelector(`[data-bid="${a.id}"]`).onclick = ()=> placeBid(a.id, div.querySelector(`.bid-input[data-id="${a.id}"]`).value);
    }
  });
  tickTimers();
}

function placeBid(auctionId, amountStr){
  const amount = Number(amountStr);
  const auctions = store.auctions();
  const a = auctions.find(x=>x.id===auctionId);
  if (!a || a.sold) { toast("This auction has ended."); return; }
  if (a.endsAt <= Date.now()){ toast("⏱ Auction time is up."); closeAuctionIfNeeded(a); return; }
  if (!amount || amount <= a.highestBid){ toast(`⚠️ Bid must be higher than ${money(a.highestBid)}`); return; }
  a.highestBid = amount;
  a.highestBidder = getUser(currentUser).name;
  store.saveAuctions(auctions);
  toast("✅ Bid placed! You're the highest bidder.");
  renderView(currentView);
}

function closeAuctionIfNeeded(a){
  if (a.sold) return;
  const auctions = store.auctions();
  const live = auctions.find(x=>x.id===a.id);
  if (!live || live.sold) return;
  live.sold = true;
  store.saveAuctions(auctions);
  if (live.highestBidder === getUser(currentUser)?.name && currentRole==='consumer'){
    const cart = store.cart(currentUser);
    cart.push({id:'c'+Date.now(), name:live.item, icon:live.icon, qty:live.qty, unit:live.unit,
      price:live.highestBid, farmer:live.farmer});
    store.saveCart(currentUser, cart);
    toast(`🏆 You won the auction for ${live.item}! Added to your cart.`);
  }
}

let timerInterval = null;
function tickTimers(){
  clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    document.querySelectorAll('[data-timer]').forEach(el=>{
      const id = el.dataset.timer;
      const a = store.auctions().find(x=>x.id===id);
      if (!a) return;
      const remain = a.endsAt - Date.now();
      if (remain <= 0){
        el.textContent = "Auction ended";
        el.classList.remove('calm');
        closeAuctionIfNeeded(a);
        return;
      }
      const h = Math.floor(remain/3600000), m = Math.floor((remain%3600000)/60000), s = Math.floor((remain%60000)/1000);
      el.textContent = `${h>0?h+'h ':''}${m}m ${s}s left`;
      el.classList.toggle('calm', remain > 600000);
    });
  }, 1000);
}

// ===============================
// DEMAND TRACKER
// Shows produce ranked by recent
// order volume (ud_demand data).
// The chatbot's crop/demand
// intents reuse this same data.
// ===============================
function renderDemand(root){
  const demand = store.demand();
  const sorted = Object.entries(demand).sort((a,b)=>b[1]-a[1]);
  const max = sorted[0][1];
  root.innerHTML = `<div class="section-head"><h3>${t('demand')}</h3><span class="muted">Based on last 30 days of orders</span></div><div class="card" id="demandCard"></div>`;
  const card = document.getElementById('demandCard');
  sorted.forEach(([name,val],i)=>{
    const row = document.createElement('div'); row.className='demand-row';
    row.innerHTML = `<div class="demand-rank">#${i+1}</div><div class="demand-name">${iconFor(name,'')} ${name}</div>
      <div class="demand-bar-track"><div class="demand-bar-fill" style="width:${(val/max*100).toFixed(0)}%"></div></div>
      <div class="demand-val">${val} orders</div>`;
    card.appendChild(row);
  });
}

/* ===============================
   FARMER AI CHATBOT
   Handles farmer questions and
   returns simple rule-based answers.
   This is a demo assistant (no real
   AI API) — see craftChatReply()
   below for the question/answer logic.
   =============================== */
const CHAT_SUGGESTIONS = ["Today's market rate for tomato", "What crop should I grow?", "How do I list a new produce?", "Help"];
function renderChat(root){
  root.innerHTML = `
    <div class="section-head"><h3>${t('aiChat')}</h3><span class="muted">Ask about market rates, pricing, or app help</span></div>
    <div class="chat-wrap">
      <div class="chat-log" id="chatLog"></div>
      <div class="chat-suggestions" id="chatChips"></div>
      <div class="chat-input-row">
        <input type="text" id="chatInput" placeholder="Type your question...">
        <button class="pill-btn" id="chatSend">Send</button>
      </div>
    </div>`;
  const log = document.getElementById('chatLog');
  const seedMsgs = [{who:'bot',text:`வணக்கம் ${getUser(currentUser).name.split(' ')[0]}! I'm Uzhavan AI, your farming assistant. Ask me about crops, prices, demand, selling, fertilizers or storage — or type "help" any time for a topic list.`}];
  seedMsgs.forEach(m=>addChatMsg(log,m.who,m.text));
  const chips = document.getElementById('chatChips');
  CHAT_SUGGESTIONS.forEach(s=>{
    const c = document.createElement('button'); c.className='chip'; c.textContent = s;
    c.onclick = ()=> sendChat(s);
    chips.appendChild(c);
  });
  document.getElementById('chatSend').onclick = ()=> sendChat(document.getElementById('chatInput').value);
  document.getElementById('chatInput').addEventListener('keydown', e=>{ if (e.key==='Enter') sendChat(e.target.value); });
}
function addChatMsg(log, who, text){
  const d = document.createElement('div'); d.className = 'msg '+who; d.textContent = text;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
}
const MOCK_RATES = {tomato:"₹26-30/kg", onion:"₹32-38/kg", rice:"₹40-44/kg", milk:"₹50-54/litre",
  mango:"₹55-65/kg", carrot:"₹28-32/kg", potato:"₹22-26/kg", "toor dal":"₹105-115/kg"};
function sendChat(text){
  text = (text||'').trim();
  if (!text) return;
  const log = document.getElementById('chatLog');
  addChatMsg(log,'user',text);
  document.getElementById('chatInput').value = '';
  setTimeout(()=>{
    addChatMsg(log,'bot', craftChatReply(text));
  }, 450);
}
// Recognises basic greetings (hi/hello/hey/good morning etc.) so the
// bot doesn't answer them with an unrelated farming fact.
function isGreeting(lower){
  return /^(hi|hello|hey|vanakkam|good morning|good evening|good afternoon)\b/.test(lower);
}

// ===============================
// CHATBOT QUESTION / ANSWER LOGIC
// Keyword/intent matching (not real
// NLP) — each block below checks
// for a few keyword patterns and
// returns a matching canned reply.
// Order matters: more specific
// checks run before general ones,
// so e.g. "best time to sell onions"
// is answered as a timing question,
// not a plain price lookup.
// ===============================
function craftChatReply(text){
  const lower = text.toLowerCase().trim();

  // 1. Greeting
  if (isGreeting(lower)){
    return `வணக்கம்! 👋 I'm Uzhavan AI, your farming assistant. How can I help you today?`;
  }

  // 2. Name
  if (lower.includes('your name') || lower === 'who are you'){
    return `I'm Uzhavan AI, your agricultural market assistant. I can help with crops, prices, demand, selling, fertilizers, storage and basic farming questions.`;
  }

  // 3. What can you do?
  if (lower.includes('what can you do') || lower.includes('what do you do')){
    return `I can help with: 🌱 crop suggestions, 📈 demand, 💰 prices, 🛒 selling & listing produce, 🏷️ auctions, ♻️ reducing wastage, 🌾 fertilizer basics, and 📦 storage. Just ask!`;
  }

  // 25. Help (exact match, checked early)
  if (lower === 'help' || lower === 'menu'){
    return `🌱 Crops  📈 Demand  💰 Prices  🛒 Selling  🏷️ Auctions  ♻️ Wastage  🌾 Fertilizers  📦 Storage  🐛 Pest management\nAsk me about any of these!`;
  }

  // 6/7/8. Market rate for a specific crop (also covers "tomato price?",
  // "onion market rate?", "how much is rice today?" style variations).
  // Uses a whole-word match so e.g. the word "price" doesn't falsely
  // match the crop "rice" (since "price" contains "rice" as text).
  for (const item in MOCK_RATES){
    const wordPattern = new RegExp('\\b' + item.replace(/\s+/g, '\\s+') + '\\b');
    if (wordPattern.test(lower)){
      if (lower.includes('base') || lower.includes('auction')){
        const low = parseInt(MOCK_RATES[item]);
        return `For ${item}, I'd suggest setting your auction base rate around ₹${low-2}-${low}/unit — a bit under today's market low of ${MOCK_RATES[item]} tends to attract more bulk buyers and drives the price up during bidding.`;
      }
      if (lower.includes('price') || lower.includes('rate') || lower.includes('how much') || lower.includes('today')){
        return `Today's indicative market rate for ${item} is ${MOCK_RATES[item]}. Rates can vary by mandi and quality grade.`;
      }
      // crop name mentioned without a clear price/auction question —
      // fall through so other intents (e.g. selling time) can match.
    }
  }

  // 10. Auction base price (no specific crop matched above)
  if (lower.includes('base price') || (lower.includes('auction') && (lower.includes('price') || lower.includes('rate') || lower.includes('base')))){
    return `Set your auction base price a little below today's market rate — it draws in more bidders and often finishes higher than a flat listing. Start one from "Online Bidding".`;
  }

  // 9. General price recommendation (no crop, not auction-specific)
  if ((lower.includes('price') || lower.includes('rate')) && (lower.includes('set') || lower.includes('should'))){
    return `A good rule of thumb is to price close to today's mandi average — check "Demand Tracker" for what's trending, and slightly undercut the market high if you want faster sales.`;
  }

  // 4. Crop recommendation (excludes "season" phrasing, which is its own intent below)
  if ((lower.includes('what crop') && !lower.includes('season')) || (lower.includes('crop') && lower.includes('grow'))){
    const demand = store.demand();
    const top = Object.entries(demand).sort((a,b)=>b[1]-a[1])[0];
    return `Based on current demand trends, ${top ? top[0] : 'Rice'} is seeing strong orders right now — it could be a good crop to focus on this season. Always confirm with your local soil and water conditions first.`;
  }

  // 5/22. High-demand crops / demand forecast
  if (lower.includes('high demand') || lower.includes('more demand') || lower.includes('demand forecast') || (lower.includes('demand') && lower.includes('crop'))){
    const demand = store.demand();
    const top = Object.entries(demand).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n])=>n).join(', ');
    return `Right now, these crops have the highest demand: ${top}. Check the "Demand Tracker" page for the full live breakdown.`;
  }

  // 11/12. Best time to sell (checked before the generic list/sell intent)
  if (lower.includes('when') && lower.includes('sell')){
    if (lower.includes('onion')){
      return `Onion demand and prices usually peak just before major festivals and during monsoon supply gaps — holding stock a week or two before those periods can fetch better rates, if your storage allows it.`;
    }
    return `The best time to sell depends on the crop's shelf life and current demand — check the "Demand Tracker" for what's trending, and sell perishables quickly rather than holding them.`;
  }
  if (lower.includes('best time') && lower.includes('onion')){
    return `Onion demand and prices usually peak just before major festivals and during monsoon supply gaps — holding stock a week or two before those periods can fetch better rates, if your storage allows it.`;
  }

  // 13/23. How to list / sell produce (covers "how do I add a product?" etc.)
  if (lower.includes('list') || lower.includes('add produce') || lower.includes('add a product') || lower.includes('sell')){
    return `To list produce: go to "Sell Item" in the sidebar, pick a category, enter quantity and price per unit, then tap "Add produce". It'll appear on the marketplace immediately for consumers to discover and order.`;
  }

  // 14. Reduce wastage
  if (lower.includes('wastage') || lower.includes('waste')){
    return `To cut wastage: 📦 store produce properly, 🚜 avoid over-harvesting, ✂️ sort out damaged items early, ⚡ sell perishables quickly, and use suitable packaging for transport.`;
  }

  // 15. Fertilizer (kept general — no dosage claims, see safety note below)
  if (lower.includes('fertilizer') || lower.includes('fertiliser')){
    return `For the correct fertilizer, consider your crop, soil condition and local agricultural recommendations. A soil test or your local agriculture officer can give more precise advice.`;
  }

  // 16. Improve yield
  if (lower.includes('yield') || (lower.includes('improve') && lower.includes('crop'))){
    return `To improve yield: use good-quality seeds, keep irrigation consistent, get a soil test done, apply nutrients appropriately, monitor for pests regularly, and harvest at the right time.`;
  }

  // 17. Pest problem
  if (lower.includes('pest') || lower.includes('insect') || lower.includes('bug')){
    return `For pest management: inspect crops regularly, use traps or barriers where possible, remove affected plants early, and rotate crops each season. For chemical treatment, consult your local agriculture officer for the right product and dosage.`;
  }

  // 18. Storage
  if (lower.includes('stor')){ // matches both "storage" and "store"
    return `Storage depends on the produce — dry grains keep well in cool, dry, pest-proof containers, while perishables like leafy greens and fruit need cool, ventilated spaces and quick turnover. Check each item's "Keeps X days" badge in your listings.`;
  }

  // 19. Reduce production cost
  if (lower.includes('reduce') && (lower.includes('cost') || lower.includes('expense'))){
    return `To reduce costs: use efficient irrigation (like drip), apply fertilizer only as needed, cut down on wastage, buy inputs in bulk with nearby farmers, and sell direct to consumers to skip middleman margins.`;
  }

  // 20. Harvesting
  if (lower.includes('harvest')){
    return `Harvest timing depends on the crop's maturity, colour, size and what the market wants — harvesting too early or too late can both hurt your price.`;
  }

  // 21. Seasonal crops
  if (lower.includes('season')){
    return `Crop choice for this season depends on your location, soil type and rainfall. As a general guide, check the "Demand Tracker" for what's currently selling well — for precise seasonal advice, consult your local agriculture office.`;
  }

  // 24. How auctions work
  if (lower.includes('auction') && (lower.includes('how') || lower.includes('work'))){
    return `Here's how auctions work: you create an auction with a base price → consumers place bids → the highest bid wins → you close the auction when you're ready to sell. Start one from "Online Bidding".`;
  }

  // Generic help fallback (phrases that mention "help"/"how" but didn't
  // match a more specific intent above)
  if (lower.includes('help') || lower.includes('how')){
    return `I can help with live market rates, suggested auction base prices, crop and fertilizer basics, storage tips, and general app guidance. Try asking "today's rate for rice" or "how do I start an auction?" — or just type "help" for a topic list.`;
  }

  return `I noted that down. Try asking about a crop's market rate, demand, fertilizer, storage, pests, or how to list/sell produce — or type "help" to see what I can do.`;
}

// ===============================
// FARMER PROFILE
// Shows the farmer's public info
// plus a table of donations they've
// received (fed by recordDonation()
// in the DONATION TRANSACTION section).
// ===============================
function renderFarmerProfile(root){
  const u = getUser(currentUser);
  const {avg, count} = getFarmerAverageRating(currentUser);
  const myRatings = store.ratings().filter(r=>r.farmerId===currentUser).slice().reverse();
  root.innerHTML = `
    <div class="section-head"><h3>${t('profile')}</h3></div>
    <div class="card">
      <div class="profile-head">
        <div class="avatar">${u.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div>
          <h3 style="font-size:20px;">${u.name}</h3>
          <div class="order-sub">📍 ${u.village || 'Village not set'} · 📞 ${u.phone}</div>
          <div class="order-sub">${(u.followers||[]).length} followers</div>
        </div>
      </div>
      <p style="margin-top:14px;color:var(--ink-soft);">${u.bio || 'No bio yet.'}</p>
    </div>
    <div class="section-head" style="margin-top:20px;"><h3>Accept donations</h3><span class="muted">For crop loss due to flood/drought</span></div>
    <div class="card">
      <table><thead><tr><th>Donor</th><th>Amount</th><th>Note</th></tr></thead>
      <tbody id="donationRows">${(u.donations||[]).map(d=>`<tr><td>${d.name}</td><td>${money(d.amount)}</td><td>${d.note||'-'}</td></tr>`).join('') || '<tr><td colspan="3">No donations received yet.</td></tr>'}</tbody></table>
    </div>
    <div class="section-head" style="margin-top:20px;"><h3>⭐ Ratings from consumers</h3><span class="muted">Visible only to you</span></div>
    <div class="card">
      <div class="rating-summary-row">
        <div class="rating-avg">${count ? avg.toFixed(1) : '—'}</div>
        <div><div class="stars-display">${starString(avg)}</div><div class="order-sub">${count} rating${count===1?'':'s'}</div></div>
      </div>
      ${myRatings.length ? myRatings.map(r=>`
        <div class="order-row">
          <div>
            <div class="order-item-name">${r.consumerName} <span class="stars-display" style="font-size:13px;">${starString(r.stars)}</span></div>
            ${r.comment ? `<div class="order-sub">"${r.comment}"</div>` : ''}
          </div>
          <div class="order-sub">${r.date.slice(0,10)}</div>
        </div>`).join('') : `<div class="empty-state"><div class="glyph">⭐</div>No ratings yet.</div>`}
    </div>
  `;
}

function renderFarmerSettings(root){
  const u = getUser(currentUser);
  root.innerHTML = `
    <div class="section-head"><h3>${t('settings')}</h3></div>
    <div class="card">
      <div class="settings-row"><div><div class="settings-row-label">❓ Help &amp; how to use Uzhavan Direct</div>
        <div class="settings-row-sub">List produce from "Sell Item", start auctions from "Online Bidding", track pending/completed orders from your dashboard cards, and ask the AI chat for live rates.</div></div></div>
      <div class="settings-row"><div class="settings-row-label">🌐 Language</div>
        <select id="settingsLang" class="lang-select"><option value="en">English</option><option value="ta">தமிழ்</option><option value="hi">हिन्दी</option></select></div>
      <div class="settings-row"><div><div class="settings-row-label">👤 Edit profile</div></div></div>
      <div class="form-grid" style="margin-top:10px;">
        <label>Village / location<input type="text" id="editVillage" value="${u.village||''}"></label>
        <label class="full">Bio<input type="text" id="editBio" value="${u.bio||''}"></label>
      </div>
      <button class="btn-primary" id="saveProfileBtn" style="margin-top:12px;">Save changes</button>
    </div>
  `;
  document.getElementById('settingsLang').value = lang;
  document.getElementById('settingsLang').onchange = e=>{
    lang = e.target.value; localStorage.setItem('ud_lang', lang);
    document.getElementById('langSelect').value = lang;
    renderNav(); renderView(currentView);
  };
  document.getElementById('saveProfileBtn').onclick = ()=>{
    const users = store.users();
    users[currentUser].village = document.getElementById('editVillage').value;
    users[currentUser].bio = document.getElementById('editBio').value;
    store.saveUsers(users);
    toast("✅ Profile updated");
  };
}

/* ======================================================================= *
 *  CONSUMER VIEWS
 * ======================================================================= */
function renderConsumerDashboard(root){
  const orders = store.orders().filter(o=>o.consumer===getUser(currentUser).name);
  const activeOrders = orders.filter(order=>order.status!=='refunded' && !isDeliveredOrder(order));
  // Money Spent = product purchases + any donations this consumer has made.
  const spent = orders.reduce((s,o)=>s+o.price,0) + consumerDonationsTotal(currentUser);
  root.innerHTML = `
    <div class="stat-strip">
      <button class="stat-cell" id="cellActiveOrders" type="button"><span class="stat-num">${activeOrders.length}</span><span class="stat-label">${t('itemsOrdered')}</span></button>
      <button class="stat-cell" id="cellSpent" type="button"><span class="stat-num">${money(spent)}</span><span class="stat-label">${t('moneySpent')}</span></button>
    </div>
    <div class="section-head"><h3>Fresh from nearby farmers</h3><span class="muted">Within 10km</span></div>
    <div class="produce-grid" id="featured"></div>
  `;
  document.getElementById('cellActiveOrders').onclick = ()=> goTo('itemsOrdered');
  document.getElementById('cellSpent').onclick = ()=> goTo('moneyTable');
  const grid = document.getElementById('featured');
  store.produce().filter(p=>!p.sold).slice(0,4).forEach(p=>{
    const el = produceCardEl(p,false);
    const btn = document.createElement('button'); btn.className='pill-btn'; btn.style.margin='10px 14px 14px'; btn.textContent='Add to cart';
    btn.onclick = ()=> openCartQuantityPicker(p,1,el.querySelector('.produce-img'));
    el.appendChild(btn);
    grid.appendChild(el);
  });
}

function addToCart(p, qty){
  const cart = store.cart(currentUser);
  const existing = cart.find(c=>c.name===p.name && c.farmer===p.farmer);
  if (existing){
    existing.qty += qty;
    existing.productId ||= p.id;
  } else cart.push({id:'c'+Date.now(), productId:p.id, name:p.name, icon:p.icon, qty, unit:p.unit, price:p.price, farmer:p.farmer});
  store.saveCart(currentUser, cart);
  renderCartDrawer();
  toast(`🛒 Added ${p.name} to cart`);
  playCartPopSound();
}

let pendingCartProduct = null;
let pendingCartSource = null;
let currentCartPickerQty = 1;
let cartAudioContext = null;
let resumeCheckoutAfterProfileSave = false;

function openCartQuantityPicker(product, initialQty=1, sourceElement=null){
  if (currentRole!=='consumer') return;
  pendingCartProduct = product;
  pendingCartSource = sourceElement;
  currentCartPickerQty = Math.max(1,Number(initialQty)||1);
  document.getElementById('qtyModalEmoji').textContent = product.icon || '🌿';
  document.getElementById('qtyModalTitle').textContent = product.name;
  document.getElementById('qtyModalSubtitle').textContent = `${money(product.price)} / ${product.unit}`;
  document.getElementById('qtyPickerUnit').textContent = product.unit;
  updateCartPickerDisplay();
  const modal = document.getElementById('qtyModalOverlay');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  document.getElementById('confirmQtyBtn').focus();
}

function closeCartQuantityPicker(){
  const modal = document.getElementById('qtyModalOverlay');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  pendingCartProduct = null;
  pendingCartSource = null;
}

function updateCartPickerDisplay(){
  document.getElementById('qtyPickerVal').textContent = currentCartPickerQty;
  document.getElementById('qtyTotalPrice').textContent = money(pendingCartProduct.price*currentCartPickerQty);
}

function getCartAudioContext(){
  if (!cartAudioContext){
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    cartAudioContext = new AudioContextClass();
  }
  if (cartAudioContext.state==='suspended') cartAudioContext.resume();
  return cartAudioContext;
}

function playCartPopSound(){
  try{
    const context = getCartAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(400,context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880,context.currentTime+.08);
    gain.gain.setValueAtTime(.12,context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.08);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime+.08);
  } catch{}
}

function playCheckoutChime(){
  try{
    const context = getCartAudioContext();
    if (!context) return;
    [[523.25,0,.15],[659.25,.12,.25]].forEach(([frequency,offset,duration])=>{
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startTime = context.currentTime+offset;
      oscillator.type='triangle';
      oscillator.frequency.setValueAtTime(frequency,startTime);
      gain.gain.setValueAtTime(.16,startTime);
      gain.gain.exponentialRampToValueAtTime(.001,startTime+duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime+duration);
    });
  } catch{}
}

function animateAddToCart(sourceElement,onComplete){
  const cartButton = document.getElementById('cartBtn');
  if (!sourceElement || !cartButton){ onComplete(); return; }
  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = cartButton.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className='cart-flying-item';
  flyer.textContent = sourceElement.textContent.trim() || '🌿';
  flyer.style.left=`${sourceRect.left+sourceRect.width/2}px`;
  flyer.style.top=`${sourceRect.top+sourceRect.height/2}px`;
  document.body.appendChild(flyer);
  let completed = false;
  const finish = ()=>{
    if (completed) return;
    completed = true;
    flyer.remove();
    cartButton.classList.remove('catching');
    onComplete();
  };
  flyer.addEventListener('transitionend',event=>{
    if (event.propertyName==='transform') finish();
  });
  window.setTimeout(finish,850);
  window.setTimeout(()=>cartButton.classList.add('catching'),220);
  requestAnimationFrame(()=>{
    flyer.style.left=`${targetRect.left+targetRect.width/2}px`;
    flyer.style.top=`${targetRect.top+targetRect.height/2}px`;
    flyer.classList.add('in-flight');
  });
}

function renderItemsOrdered(root){
  const orders = store.orders().filter(order=>
    order.consumer===getUser(currentUser).name && order.status!=='refunded' && !isDeliveredOrder(order)
  );
  root.innerHTML = `<div class="section-head"><h3>${t('itemsOrdered')}</h3><span class="muted">Track active deliveries</span></div><div class="card" id="activeOrderList"></div>`;
  renderActiveOrderRows(document.getElementById('activeOrderList'),orders);
}

document.getElementById('btnQtyMinus').onclick = ()=>{
  currentCartPickerQty = Math.max(1,currentCartPickerQty-1);
  updateCartPickerDisplay();
};
document.getElementById('btnQtyPlus').onclick = ()=>{
  currentCartPickerQty++;
  updateCartPickerDisplay();
};
document.getElementById('closeQtyModal').onclick = closeCartQuantityPicker;
document.getElementById('qtyModalOverlay').onclick = event=>{
  if (event.target===event.currentTarget) closeCartQuantityPicker();
};
document.getElementById('confirmQtyBtn').onclick = ()=>{
  if (!pendingCartProduct) return;
  const product = pendingCartProduct;
  const quantity = currentCartPickerQty;
  const sourceElement = pendingCartSource;
  closeCartQuantityPicker();
  animateAddToCart(sourceElement,()=>addToCart(product,quantity));
};

function groupOrdersByFarmerProduct(orders){
  const groups = new Map();
  orders.forEach(order=>{
    const productName = String(order.item||order.name||'').trim();
    const unit = String(order.unit||'').trim();
    const key = `${order.farmer}|${productName.toLowerCase()}|${unit.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key,{farmer:order.farmer,item:productName,unit,orders:[]});
    groups.get(key).orders.push(order);
  });
  return [...groups.values()].map(group=>({
    ...group,
    orders:group.orders.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))),
    quantity:group.orders.reduce((total,order)=>total+Number(order.qty||0),0),
    total:group.orders.reduce((total,order)=>total+Number(order.price||0),0)
  }));
}

function renderActiveOrderRows(list,orders){
  if (!orders.length){ list.innerHTML = `<div class="empty-state"><div class="glyph">📦</div>No active orders.</div>`; return; }
  orders.forEach(order=>{
    const farmerUser = getUser(order.farmer);
    const row = document.createElement('div'); row.className='order-row';
    row.innerHTML = `<div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar" style="width:40px;height:40px;font-size:14px;">${(farmerUser?.name||order.farmer).split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div>
          <div class="order-item-name">${order.item} × ${order.qty}${order.unit}</div>
          <div class="order-sub">Sold by ${farmerUser?.name || order.farmer} · ${order.date||''}</div>
        </div>
      </div>
      <div style="text-align:right;display:flex;gap:10px;align-items:center;">
        <div>
          <div class="produce-price" style="font-size:15px;">${money(order.price)}</div>
          <span class="badge" style="margin-top:4px;">${deliveryStageLabel(order)}</span>
        </div>
        <button class="pill-btn" data-a="track">📦 Track Delivery</button>
      </div>`;
    row.querySelector('[data-a="track"]').onclick = ()=>openTrackingModal(order.id);
    list.appendChild(row);
  });
}

function renderOrderHistory(root){
  const orders = store.orders()
    .filter(order=>order.consumer===getUser(currentUser).name && isDeliveredOrder(order))
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  root.innerHTML = `<div class="section-head"><h3>${t('history')}</h3></div><div class="card" id="historyList"></div>`;
  const list = document.getElementById('historyList');
  if (!orders.length){
    list.innerHTML = `<div class="empty-state"><div class="glyph">🕘</div>No delivered orders yet.</div>`;
    return;
  }
  groupOrdersByFarmerProduct(orders).forEach(group=>{
    const latestOrder = group.orders[0];
    const farmer = getUser(group.farmer);
    const product = productForOrder(latestOrder);
    const available = product && !product.sold && Number(product.qty)>0;
    const row = document.createElement('div');
    row.className='order-row';
    row.innerHTML = `<div>
        <div class="order-item-name">${group.item} × ${group.quantity}${group.unit}</div>
        <div class="order-sub">Sold by ${farmer?.name||group.farmer} · Ordered ${group.orders.length} ${group.orders.length===1?'time':'times'} · Last delivered ${latestOrder.date||''}</div>
        <div class="produce-price" style="font-size:14px;margin-top:4px;">${money(group.total)}</div>
      </div>
      <button class="pill-btn" data-a="reorder" ${available?'':'disabled'}>${available?'Order again':'Unavailable'}</button>`;
    if (available){
      row.querySelector('[data-a="reorder"]').onclick = ()=>{
        const quantity = Math.min(Number(latestOrder.qty)||1,Number(product.qty));
        openCartQuantityPicker(product,quantity,null);
      };
    }
    list.appendChild(row);
  });
}

function renderCart(root){
  const cart = store.cart(currentUser);
  renderCartDrawer();
  root.innerHTML = `<div class="section-head"><h3>${t('cart')}</h3></div><div class="card" id="cartList"></div>`;
  const list = document.getElementById('cartList');
  if (!cart.length){
    list.innerHTML = `<div class="empty-state"><div class="glyph">🛒</div>Your cart is empty.<br><button class="pill-btn" id="browseProduceBtn" type="button">Browse produce</button></div>`;
    list.querySelector('#browseProduceBtn').onclick = ()=>goTo('nearby');
    return;
  }
  let total = 0;
  cart.forEach(c=>{
    total += c.price * c.qty;
    const row = document.createElement('div'); row.className='cart-row';
    row.innerHTML = `<div style="font-size:26px;">${c.icon}</div>
      <div style="flex:1;">
        <div class="order-item-name">${c.name}</div>
        <div class="order-sub">${money(c.price)} / ${c.unit} · sold by ${getUser(c.farmer)?.name||c.farmer}</div>
      </div>
      <div class="qty-control">
        <button data-a="dec">−</button><span>${c.qty}</span><button data-a="inc">＋</button>
      </div>
      <div class="produce-price" style="font-size:15px;min-width:70px;text-align:right;">${money(c.price*c.qty)}</div>
      <button class="pill-btn danger" data-a="remove">Remove</button>`;
    row.querySelector('[data-a="inc"]').onclick = ()=> changeCartQty(c.id, 1);
    row.querySelector('[data-a="dec"]').onclick = ()=> changeCartQty(c.id, -1);
    row.querySelector('[data-a="remove"]').onclick = ()=> removeFromCart(c.id);
    list.appendChild(row);
  });
  const bar = document.createElement('div'); bar.className='cart-total-bar';
  bar.innerHTML = `<div><div style="font-size:12.5px;opacity:.8;">Total</div><div style="font-family:'Fraunces',serif;font-size:22px;">${money(total)}</div></div>
    <button class="btn-primary" id="cartPageCheckoutBtn">Proceed to checkout</button>`;
  root.appendChild(bar);
  document.getElementById('cartPageCheckoutBtn').onclick = openPaymentModal;
}
function renderCartDrawer(){
  const drawerList = document.getElementById('drawerItemsList');
  if (!drawerList) return;
  const cart = currentUser && currentRole==='consumer' ? store.cart(currentUser) : [];
  const subtotal = cart.reduce((sum,item)=>sum + Number(item.price)*Number(item.qty),0);
  document.getElementById('cartBadge').textContent = cart.reduce((sum,item)=>sum + Number(item.qty),0);
  document.getElementById('cartSubtotal').textContent = money(subtotal);
  document.getElementById('checkoutBtn').disabled = cart.length===0;
  document.getElementById('clearCartBtn').disabled = cart.length===0;

  if (!cart.length){
    drawerList.innerHTML = `<div class="drawer-empty-state"><div class="glyph">🧺</div><p>Your basket is empty.</p><button class="pill-btn" id="drawerBrowseBtn" type="button">Browse produce</button></div>`;
    drawerList.querySelector('#drawerBrowseBtn').onclick = ()=>{ closeCartDrawer(); goTo('nearby'); };
    return;
  }

  drawerList.innerHTML = cart.map(item=>{
    const farmerName = getUser(item.farmer)?.name || item.farmer;
    return `<article class="cart-item-row" data-id="${item.id}">
      <div class="cart-item-emoji" aria-hidden="true">${item.icon}</div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.name}</h4>
        <p class="cart-item-farmer">${farmerName}</p>
        <p class="cart-item-price">${money(item.price)} / ${item.unit}</p>
      </div>
      <div class="cart-item-actions">
        <div class="cart-qty-control" aria-label="Quantity">
          <button class="btn-qty" data-a="dec" type="button" aria-label="Decrease ${item.name} quantity">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="btn-qty" data-a="inc" type="button" aria-label="Increase ${item.name} quantity">+</button>
        </div>
        <strong class="cart-item-line-total">${money(item.price*item.qty)}</strong>
        <button class="btn-remove-item" data-a="remove" type="button" aria-label="Remove ${item.name}" title="Remove item">Remove</button>
      </div>
    </article>`;
  }).join('');

  drawerList.querySelectorAll('.cart-item-row').forEach(row=>{
    const id = row.dataset.id;
    row.querySelector('[data-a="inc"]').onclick = ()=>changeCartQty(id,1);
    row.querySelector('[data-a="dec"]').onclick = ()=>changeCartQty(id,-1);
    row.querySelector('[data-a="remove"]').onclick = ()=>removeFromCart(id);
  });
}

function refreshCartViews(){
  renderCartDrawer();
  if (currentRole==='consumer' && currentView==='cart') renderView('cart');
  if (currentRole==='consumer' && currentView==='dashboard') renderView('dashboard');
}

function openCartDrawer(){
  if (currentRole!=='consumer') return;
  renderCartDrawer();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').setAttribute('aria-hidden','false');
  document.getElementById('cartOverlay').setAttribute('aria-hidden','false');
  document.getElementById('cartBtn').setAttribute('aria-expanded','true');
  document.body.classList.add('cart-drawer-open');
  document.getElementById('closeCartBtn').focus();
}

function closeCartDrawer(){
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) return;
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  drawer.setAttribute('aria-hidden','true');
  overlay.setAttribute('aria-hidden','true');
  document.getElementById('cartBtn').setAttribute('aria-expanded','false');
  document.body.classList.remove('cart-drawer-open');
}

function changeCartQty(id, delta){
  const cart = store.cart(currentUser);
  const item = cart.find(c=>c.id===id);
  if (!item) return;
  item.qty += delta;
  if (item.qty<=0){
    store.saveCart(currentUser, cart.filter(c=>c.id!==id));
    refreshCartViews();
    return;
  }
  store.saveCart(currentUser, cart);
  refreshCartViews();
}
function removeFromCart(id){
  let cart = store.cart(currentUser);
  cart = cart.filter(c=>c.id!==id);
  store.saveCart(currentUser, cart);
  toast("Removed from cart");
  refreshCartViews();
}

// ===============================
// DEMO PAYMENT OTP
// This is only a simulated OTP for
// demonstration purposes.
// No real SMS/payment service is used.
// ===============================
function customerAddressIsComplete(){
  const customer = getUser(currentUser);
  return Boolean(customer?.city?.trim() && customer?.address?.trim());
}

function requireCustomerAddressForCheckout(){
  resumeCheckoutAfterProfileSave = true;
  closeCartDrawer();
  goTo('profile');
  toast('Add your city and home address to continue checkout.');
}

function openPaymentModal(){
  if (!customerAddressIsComplete()){
    requireCustomerAddressForCheckout();
    return;
  }
  // Generate the demo OTP ONCE per modal open — it must stay the
  // same for as long as this payment modal is on screen, so it's
  // captured here (not regenerated on every render/keystroke).
  const otp = String(Math.floor(100000+Math.random()*900000));

  const overlay = document.createElement('div'); overlay.className='modal-overlay';
  overlay.innerHTML = `<div class="modal-box">
    <h3 style="font-size:19px;margin-bottom:4px;">Choose payment method</h3>
    <div class="pay-methods">
      <div class="pay-method" data-m="GPay">📱 Google Pay</div>
      <div class="pay-method" data-m="Card">💳 Credit / Debit card</div>
      <div class="pay-method" data-m="UPI">🏦 UPI</div>
      <div class="pay-method" data-m="COD">💵 Cash on delivery</div>
    </div>

    <!-- DEMO PAYMENT OTP: shown right here in the modal (no SMS sent)
         so the OTP is never hidden from the person doing the demo. -->
    <div class="otp-block">
      <div class="demo-otp-label">🔐 Demo Payment Verification</div>
      <div class="demo-otp-value">Your Demo OTP: <b id="demoPayOtpDisplay">${otp}</b></div>
      <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--ink-soft);margin-top:8px;">Enter OTP
        <input type="text" id="payOtp" placeholder="Enter the demo OTP shown above" maxlength="6">
      </label>
      <p class="auth-hint">Demo only — no real payment or SMS service is connected.</p>
    </div>

    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="pill-btn" id="cancelPay" style="flex:1;">Cancel</button>
      <button class="btn-primary" id="confirmPay" style="flex:1;margin:0;">✓ Verify &amp; Pay</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  let selectedMethod = null;
  overlay.querySelectorAll('.pay-method').forEach(m=>{
    m.onclick = ()=>{ overlay.querySelectorAll('.pay-method').forEach(x=>x.classList.remove('selected')); m.classList.add('selected'); selectedMethod = m.dataset.m; };
  });
  overlay.querySelector('#cancelPay').onclick = ()=> overlay.remove();
  overlay.querySelector('#confirmPay').onclick = ()=>{
    if (!selectedMethod){ toast("⚠️ Select a payment method"); return; }
    if (overlay.querySelector('#payOtp').value.trim() !== otp){ toast("❌ Incorrect OTP"); return; }
    if (!completeCheckout()) return;
    overlay.remove();
  };
}
// Turns the current cart into real orders (one per cart line), reduces
// each produce listing's stock, and empties the cart. Runs after the
// demo payment OTP above is confirmed.
function completeCheckout(){
  if (!customerAddressIsComplete()){
    requireCustomerAddressForCheckout();
    return false;
  }
  const cart = store.cart(currentUser);
  if (!cart.length) return false;
  playCheckoutChime();
  const orders = store.orders();
  const u = getUser(currentUser);
  cart.forEach(c=>{
    const produce = store.produce();
    const product = produce.find(item=>(c.productId && item.id===c.productId) || (item.farmer===c.farmer && item.name===c.name));
    orders.push({id:'o'+Date.now()+Math.random().toString(36).slice(2,5), farmer:c.farmer, consumer:u.name,
      productId:c.productId || product?.id, item:c.name, qty:c.qty, unit:c.unit, price:c.price*c.qty, city:u.city.trim(), address:u.address.trim(),
      status:'pending', date:new Date().toISOString().slice(0,10),
      // DELIVERY TRACKING: every new order starts at "placed" and moves
      // forward through DELIVERY_STAGES as the farmer updates it.
      deliveryStage:'placed'});
    if (product){ product.qty = Math.max(0, product.qty - c.qty); if (product.qty===0) product.sold = true; store.saveProduce(produce); }
  });
  store.saveOrders(orders);
  store.saveCart(currentUser, []);
  renderCartDrawer();
  toast("✅ Order placed! Track it on your dashboard.");
  goTo('dashboard');
  return true;
}

// Shows every rupee this consumer has spent: product orders AND donations,
// combined into one table so the total always matches the dashboard stat.
function renderConsumerMoneyTable(root){
  const orders = store.orders().filter(o=>o.consumer===getUser(currentUser).name);
  const myDonations = store.donations().filter(d=>d.consumerId===currentUser);
  const total = orders.reduce((s,o)=>s+o.price,0) + myDonations.reduce((s,d)=>s+d.amount,0);

  const orderRows = orders.map(o=>`<tr><td>${o.date}</td><td>${o.item} ×${o.qty}${o.unit}</td><td>${getUser(o.farmer)?.name||o.farmer}</td><td>${money(o.price)}</td></tr>`);
  const donationRows = myDonations.map(d=>`<tr><td>${d.date.slice(0,10)}</td><td>Donation</td><td>${getUser(d.farmerId)?.name||d.farmerId}</td><td>${money(d.amount)}</td></tr>`);

  root.innerHTML = `<div class="section-head"><h3>${t('moneySpent')}</h3><span class="muted">${money(total)} total</span></div>
    <div class="card"><table><thead><tr><th>Date</th><th>Item</th><th>Farmer</th><th>Amount</th></tr></thead>
    <tbody>${[...orderRows, ...donationRows].join('') || '<tr><td colspan="4">No transactions yet.</td></tr>'}</tbody></table></div>`;
}

function renderNearby(root){
  const consumer = getUser(currentUser);
  const customerCity = consumer.city || cityFromAddress(consumer.address);
  const customerCoordinates = coordinatesForCity(customerCity);
  const farmers = Object.entries(store.users())
    .filter(([,user])=>user.type==='farmer')
    .map(([username,farmer])=>{
      const farmerCity = cityFromAddress(farmer.village);
      return {username,farmer,farmerCity,distance:distanceBetweenCitiesKm(customerCity,farmerCity)};
    })
    .sort((a,b)=>{
      if (a.distance===null) return b.distance===null ? 0 : 1;
      if (b.distance===null) return -1;
      return a.distance-b.distance;
    });
  const distanceContext = customerCoordinates
    ? `Distances from ${customerCity} city centre`
    : 'Set a supported city in your profile to calculate distances';
  root.innerHTML = `<div class="section-head"><h3>${t('nearby')}</h3><span class="muted">${distanceContext}</span></div><div id="nearbyList"></div>`;
  const list = document.getElementById('nearbyList');
  farmers.forEach(({username,farmer,distance})=>{
    const produce = store.produce().filter(p=>p.farmer===username && !p.sold);
    const distanceLabel = distance===null ? 'Distance unavailable' : `${Math.round(distance)} km away`;
    const div = document.createElement('div'); div.className='nearby-card';
    div.innerHTML = `<div class="avatar">${farmer.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
      <div style="flex:1;">
        <div class="order-item-name">${farmer.name} <span class="dist-badge" title="Straight-line distance between city centres">${distanceLabel}</span></div>
        <div class="order-sub">${farmer.village||''} · ${produce.map(p=>p.icon+' '+p.name).join('  ')}</div>
      </div>
      <button class="pill-btn" data-a="produce">View produce</button>
      <button class="pill-btn" data-a="profile">View Profile</button>`;
    div.querySelector('[data-a="produce"]').onclick = ()=> showFarmerProduce(username);
    div.querySelector('[data-a="profile"]').onclick = ()=> openFarmerProfile(username,'nearby');
    list.appendChild(div);
  });
  const holder = document.createElement('div'); holder.id='nearbyProduceHolder'; holder.style.marginTop='20px';
  root.appendChild(holder);
}
function showFarmerProduce(uname){
  const holder = document.getElementById('nearbyProduceHolder');
  const f = getUser(uname);
  const produce = store.produce().filter(p=>p.farmer===uname);
  holder.innerHTML = `<div class="section-head"><h3>${f.name}'s produce</h3></div><div class="produce-grid" id="fp"></div>`;
  const grid = document.getElementById('fp');
  produce.forEach(p=>{
    const el = produceCardEl(p,false);
    const btn = document.createElement('button'); btn.className='pill-btn'; btn.style.margin='10px 14px 14px'; btn.textContent='Add to cart';
    btn.onclick = ()=> openCartQuantityPicker(p,1,el.querySelector('.produce-img'));
    el.appendChild(btn);
    grid.appendChild(el);
  });
}

function renderConsumerBidding(root){
  root.innerHTML = `<div class="section-head"><h3>${t('bidding')}</h3><span class="muted">Bid on bulk produce lots</span></div><div id="cAuctions"></div>`;
  renderAuctionList(document.getElementById('cAuctions'), store.auctions(), true);
}

function renderConsumerProfile(root){
  const u = getUser(currentUser);
  root.innerHTML = `
    <div class="section-head"><h3>${t('profile')}</h3><span class="muted">Your customer details</span></div>
    <div class="card">
      <div class="profile-head">
        <div class="avatar">${u.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div>
          <h3 style="font-size:20px;">${u.name}</h3>
          <div class="order-sub">📞 ${u.phone}</div>
        </div>
      </div>
      <div class="profile-address-block">
        <div class="settings-row-label">📍 City name</div>
        <input id="consumerCity" type="text" value="${u.city||''}" placeholder="e.g. Chennai">
        <div class="settings-row-label" style="margin-top:14px;">🏠 Home address</div>
        <textarea id="consumerAddress" rows="3" placeholder="Enter your full home address">${u.address||''}</textarea>
        <button class="btn-primary" id="saveConsumerProfile" style="margin-top:12px;">Save address</button>
      </div>
    </div>
  `;
  document.getElementById('saveConsumerProfile').onclick = ()=>{
    const city = document.getElementById('consumerCity').value.trim();
    const address = document.getElementById('consumerAddress').value.trim();
    if (!city || !address){ toast("⚠️ Enter both your city and home address"); return; }
    const users = store.users();
    users[currentUser].city = city;
    users[currentUser].address = address;
    store.saveUsers(users);
    toast("✅ City and home address saved");
    if (resumeCheckoutAfterProfileSave){
      resumeCheckoutAfterProfileSave = false;
      openPaymentModal();
    }
  };
}

// ===============================
// MARKETPLACE SEARCH
// Searches both product names and
// farmer names using case-insensitive
// partial matching.
// ===============================
// Finds farmers whose names match the consumer's search text
// (case-insensitive, partial match on first name or full name).
function searchFarmers(query){
  if (!query) return [];
  const q = query.toLowerCase();
  return Object.entries(store.users())
    .filter(([uname,u])=> u.type==='farmer' && u.name.toLowerCase().includes(q))
    .map(([uname,u])=>uname);
}
// Compact profile-preview card shown when a search matches a farmer's
// name — clicking "View Profile" opens their full public profile.
function farmerResultCardEl(uname){
  const f = getUser(uname);
  const productCount = store.produce().filter(p=>p.farmer===uname && !p.sold).length;
  const {avg,count} = getFarmerAverageRating(uname);
  const div = document.createElement('div'); div.className='nearby-card farmer-result-card';
  div.innerHTML = `<div class="avatar">${f.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
    <div style="flex:1;">
      <div class="order-item-name">🧑‍🌾 ${f.name}</div>
      <div class="order-sub">📍 ${f.village||'Village not set'} · ⭐ ${count ? avg.toFixed(1) : 'No ratings yet'}</div>
      <div class="order-sub">${productCount} Product${productCount===1?'':'s'}</div>
    </div>
    <button class="pill-btn" data-a="viewProfile">View Profile</button>`;
  div.querySelector('[data-a="viewProfile"]').onclick = ()=> openFarmerProfile(uname,'search');
  return div;
}
function renderSearch(root){
  root.innerHTML = `
    <div class="section-head"><h3>${t('search')}</h3></div>
    <div class="card"><input type="text" id="searchBox" placeholder="Search for rice, tomato, milk, or a farmer's name..." style="width:100%;padding:12px 14px;border-radius:8px;border:1px solid var(--line);font-family:inherit;font-size:14.5px;"></div>
    <div id="farmerResults" style="margin-top:16px;"></div>
    <div class="produce-grid" id="searchResults" style="margin-top:18px;"></div>
  `;
  const box = document.getElementById('searchBox');
  const renderResults = (q)=>{
    const query = q.toLowerCase();

    // Farmer name matches -> full profile-preview cards (checked first,
    // so a name search surfaces the farmer, not just their produce).
    const farmerMatches = searchFarmers(q);
    const farmerHolder = document.getElementById('farmerResults');
    farmerHolder.innerHTML = '';
    farmerMatches.forEach(uname=> farmerHolder.appendChild(farmerResultCardEl(uname)));

    // Product name OR farmer name -> produce grid (unchanged behaviour,
    // still works simultaneously alongside the farmer cards above).
    const results = store.produce().filter(p=>{
      if (p.sold) return false;
      const farmerName = (getUser(p.farmer)?.name || '').toLowerCase();
      return p.name.toLowerCase().includes(query) || farmerName.includes(query);
    });
    const grid = document.getElementById('searchResults');
    grid.innerHTML = '';
    if (q && !results.length && !farmerMatches.length){ grid.innerHTML = `<div class="empty-state"><div class="glyph">🔍</div>No produce matching "${q}"</div>`; return; }
    results.forEach(p=>{
      const el = produceCardEl(p,false);
      const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.padding='0 14px 14px';
      const qtyInput = document.createElement('input'); qtyInput.type='number'; qtyInput.value=1; qtyInput.min=1; qtyInput.style.width='60px'; qtyInput.style.padding='8px'; qtyInput.style.borderRadius='6px'; qtyInput.style.border='1px solid var(--line)';
      const btn = document.createElement('button'); btn.className='pill-btn'; btn.textContent='Add to cart'; btn.style.flex='1';
      btn.onclick = ()=> openCartQuantityPicker(p,Number(qtyInput.value)||1,el.querySelector('.produce-img'));
      row.appendChild(qtyInput); row.appendChild(btn);
      el.appendChild(row);
      grid.appendChild(el);
    });
  };
  box.addEventListener('input', e=> renderResults(e.target.value));
  renderResults('');
}

// ===============================
// FARMER PROFILE (consumer-facing)
// Opened from a farmer-name search
// result or from "Nearby You" via
// openFarmerProfile(). Shows the
// farmer's public info plus Follow,
// Rate and Donate actions — reusing
// toggleFollow(), openRateModal()
// and openDonateModal() so there is
// only ever one implementation of
// each of those actions.
// ===============================
function renderFarmerPublicProfile(root){
  const uname = viewingFarmerId;
  const f = getUser(uname);
  if (!f){ root.innerHTML = `<div class="empty-state"><div class="glyph">🧑‍🌾</div>Farmer not found.</div>`; return; }

  const {avg, count} = getFarmerAverageRating(uname);
  const isFollowing = (getUser(currentUser).following || []).includes(uname);
  const produce = store.produce().filter(p=>p.farmer===uname && !p.sold);

  root.innerHTML = `
    <button class="pill-btn" id="backBtn" style="margin-bottom:16px;">← Back</button>
    <div class="card">
      <div class="profile-head">
        <div class="avatar">${f.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div style="flex:1;">
          <h3 style="font-size:20px;">🧑‍🌾 ${f.name}</h3>
          <div class="order-sub">📍 ${f.village || 'Village not set'}</div>
          <div class="order-sub">${(f.followers||[]).length} followers</div>
        </div>
        <button class="follow-btn ${isFollowing?'following':''}" id="followBtn">${isFollowing ? '✓ Following' : '+ Follow'}</button>
      </div>
      <p style="margin-top:14px;color:var(--ink-soft);">${f.bio || 'No bio yet.'}</p>
      <div class="rating-summary-row" style="border-top:1px solid var(--line);border-bottom:none;margin-top:14px;padding-top:14px;">
        <div class="rating-avg">${count ? avg.toFixed(1) : '—'}</div>
        <div><div class="stars-display">${starString(avg)}</div><div class="order-sub">${count} rating${count===1?'':'s'}</div></div>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button class="pill-btn" id="rateBtn">⭐ Rate</button>
          <button class="pill-btn" id="donateBtn">💚 Donate</button>
        </div>
      </div>
    </div>
    <div class="section-head" style="margin-top:20px;"><h3>${produce.length} Product${produce.length===1?'':'s'}</h3></div>
    <div class="produce-grid" id="farmerProfileProduce"></div>
  `;

  document.getElementById('backBtn').onclick = ()=> goTo(cameFromView);
  document.getElementById('followBtn').onclick = ()=>{ toggleFollow(uname); };
  document.getElementById('rateBtn').onclick = ()=> openRateModal(uname);
  document.getElementById('donateBtn').onclick = ()=> openDonateModal(uname);

  const grid = document.getElementById('farmerProfileProduce');
  if (!produce.length){ grid.innerHTML = `<div class="empty-state"><div class="glyph">🌱</div>No produce listed yet.</div>`; return; }
  produce.forEach(p=>{
    const el = produceCardEl(p,false);
    const btn = document.createElement('button'); btn.className='pill-btn'; btn.style.margin='10px 14px 14px'; btn.textContent='Add to cart';
    btn.onclick = ()=> openCartQuantityPicker(p,1,el.querySelector('.produce-img'));
    el.appendChild(btn);
    grid.appendChild(el);
  });
}

// ===============================
// DONATIONS (consumer side)
// "Farmers you follow" list, with
// a 💚 Donate button per farmer
// that opens openDonateModal()
// below to start a donation.
// ===============================
function renderFollowing(root){
  const u = getUser(currentUser);
  const following = u.following || [];
  root.innerHTML = `<div class="section-head"><h3>Farmers you follow</h3></div><div id="followList"></div>`;
  const list = document.getElementById('followList');
  if (!following.length){ list.innerHTML = `<div class="empty-state"><div class="glyph">🧑‍🌾</div>You're not following any farmers yet. Visit "Nearby You" to discover local farmers.</div>`; return; }
  following.forEach(uname=>{
    const f = getUser(uname);
    if (!f) return;
    const div = document.createElement('div'); div.className='nearby-card';
    div.innerHTML = `<div class="avatar">${f.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
      <div style="flex:1;"><div class="order-item-name">${f.name}</div><div class="order-sub">📞 ${f.phone} · ${f.village||''}</div></div>
      <button class="pill-btn" id="rate-${uname}">⭐ Rate</button>
      <button class="pill-btn" id="donate-${uname}">💚 Donate</button>
      <button class="pill-btn danger" id="unfollow-${uname}">Unfollow</button>`;
    list.appendChild(div);
    div.querySelector(`#unfollow-${uname}`).onclick = ()=> toggleFollow(uname);
    div.querySelector(`#donate-${uname}`).onclick = ()=> openDonateModal(uname);
    div.querySelector(`#rate-${uname}`).onclick = ()=> openRateModal(uname);
  });
}
// Opens a modal where the consumer picks 1-5 stars and an optional
// comment for a farmer they follow, then saves it via recordRating().
function openRateModal(uname){
  const existing = store.ratings().find(r=>r.consumerId===currentUser && r.farmerId===uname);
  let selectedStars = existing ? existing.stars : 0;
  const overlay = document.createElement('div'); overlay.className='modal-overlay';
  overlay.innerHTML = `<div class="modal-box">
    <h3 style="font-size:19px;">Rate ${getUser(uname).name}</h3>
    <p style="color:var(--ink-soft);font-size:13.5px;">Share your experience buying from this farmer.</p>
    <div class="star-picker" id="starPicker">
      ${[1,2,3,4,5].map(n=>`<button type="button" class="star-btn" data-star="${n}">★</button>`).join('')}
    </div>
    <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--ink-soft);margin-top:10px;">Comment (optional)
      <textarea id="rateComment" rows="2" placeholder="e.g. Fresh produce, delivered on time" style="font-family:inherit;padding:10px;border-radius:8px;border:1px solid var(--line);">${existing ? (existing.comment||'') : ''}</textarea>
    </label>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="pill-btn" id="cancelRate" style="flex:1;">Cancel</button>
      <button class="btn-primary" id="confirmRate" style="flex:1;margin:0;">Submit rating</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  const paintStars = ()=>{
    overlay.querySelectorAll('.star-btn').forEach(btn=>{
      btn.classList.toggle('filled', Number(btn.dataset.star) <= selectedStars);
    });
  };
  overlay.querySelectorAll('.star-btn').forEach(btn=>{
    btn.onclick = ()=>{ selectedStars = Number(btn.dataset.star); paintStars(); };
  });
  paintStars();

  overlay.querySelector('#cancelRate').onclick = ()=> overlay.remove();
  const confirmBtn = overlay.querySelector('#confirmRate');
  confirmBtn.onclick = ()=>{
    // Guard against double-submits creating extra work (recordRating
    // itself also de-dupes per consumer+farmer, this just avoids the
    // button being hammered while the modal is closing).
    if (confirmBtn.disabled) return;
    if (!selectedStars){ toast("⚠️ Pick a star rating"); return; }
    confirmBtn.disabled = true;
    const comment = document.getElementById('rateComment').value.trim();
    recordRating(currentUser, uname, selectedStars, comment);
    toast(`⭐ Thanks for rating ${getUser(uname).name}!`);
    overlay.remove();
  };
}
function toggleFollow(uname){
  const users = store.users();
  const u = users[currentUser];
  u.following = u.following || [];
  const farmer = users[uname];
  farmer.followers = farmer.followers || [];
  if (u.following.includes(uname)){
    u.following = u.following.filter(x=>x!==uname);
    farmer.followers = farmer.followers.filter(x=>x!==currentUser);
    toast("Unfollowed");
  } else {
    u.following.push(uname);
    farmer.followers.push(currentUser);
    toast("✅ Now following");
  }
  store.saveUsers(users);
  renderView(currentView);
}
function openDonateModal(uname){
  const overlay = document.createElement('div'); overlay.className='modal-overlay';
  overlay.innerHTML = `<div class="modal-box">
    <h3 style="font-size:19px;">Support ${getUser(uname).name}</h3>
    <p style="color:var(--ink-soft);font-size:13.5px;">Directly help this farmer recover from crop loss due to floods, drought, or other calamities.</p>
    <label style="display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--ink-soft);margin-top:10px;">Amount (₹)
      <input type="number" id="donateAmt" placeholder="e.g. 500">
    </label>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="pill-btn" id="cancelDonate" style="flex:1;">Cancel</button>
      <button class="btn-primary" id="confirmDonate" style="flex:1;margin:0;">Donate</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelDonate').onclick = ()=> overlay.remove();
  const confirmBtn = overlay.querySelector('#confirmDonate');
  confirmBtn.onclick = ()=>{
    // Guard: ignore extra clicks once a donation is already being saved,
    // so one click can never create two transactions.
    if (confirmBtn.disabled) return;
    const amt = Number(document.getElementById('donateAmt').value);
    if (!amt || amt <= 0){ toast("⚠️ Enter a valid amount"); return; }
    confirmBtn.disabled = true;
    recordDonation(currentUser, uname, amt);
    toast(`💚 Thank you! ₹${amt} sent to ${getUser(uname).name}`);
    overlay.remove();
  };
}

// ===============================
// CONSUMER SETTINGS
// Help text, quick link to the
// farmers-you-follow list, and
// the language switcher.
// ===============================
function renderConsumerSettings(root){
  root.innerHTML = `
    <div class="section-head"><h3>${t('settings')}</h3></div>
    <div class="card">
      <div class="settings-row"><div><div class="settings-row-label">❓ Help &amp; how to use Uzhavan Direct</div>
        <div class="settings-row-sub">Browse "Nearby You" for local farmers, "Search" to find specific produce, add to cart, then checkout with GPay/card/UPI/COD. Bid on bulk lots under "Online Bidding".</div></div></div>
      <div class="settings-row"><div class="settings-row-label">🧑‍🌾 Farmers you follow</div>
        <button class="pill-btn" id="goFollowing">View list</button></div>
      <div class="settings-row"><div class="settings-row-label">🌐 Language</div>
        <select id="settingsLang2" class="lang-select"><option value="en">English</option><option value="ta">தமிழ்</option><option value="hi">हिन्दी</option></select></div>
    </div>
  `;
  document.getElementById('goFollowing').onclick = ()=> goTo('following');
  document.getElementById('settingsLang2').value = lang;
  document.getElementById('settingsLang2').onchange = e=>{
    lang = e.target.value; localStorage.setItem('ud_lang', lang);
    document.getElementById('langSelect').value = lang;
    renderNav(); renderView(currentView);
  };
}

/* ---------- Init ---------- */
boot();