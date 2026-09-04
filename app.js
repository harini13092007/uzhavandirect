
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
      nearby:"Nearby You",search:"Search",logout:"Log out",ordersPending:"Orders pending",
      ordersCompleted:"Orders completed",moneyReceived:"Total money received",moneySpent:"Money spent",
      profile:"Profile", welcome:"Welcome back"},
  ta:{dashboard:"டாஷ்போர்டு",sellItem:"பொருள் விற்பனை",bidding:"ஏலம்",demand:"தேவை கண்காணிப்பு",
      aiChat:"விவசாயி AI அரட்டை",settings:"அமைப்புகள்",itemsOrdered:"ஆர்டர் செய்யப்பட்ட பொருட்கள்",cart:"கார்ட்",
      nearby:"அருகில் உள்ளவை",search:"தேடல்",logout:"வெளியேறு",ordersPending:"நிலுவையிலுள்ள ஆர்டர்கள்",
      ordersCompleted:"முடிக்கப்பட்ட ஆர்டர்கள்",moneyReceived:"பெறப்பட்ட மொத்த பணம்",moneySpent:"செலவிடப்பட்ட பணம்",
      profile:"சுயவிவரம்", welcome:"மீண்டும் வரவேற்கிறோம்"},
  hi:{dashboard:"डैशबोर्ड",sellItem:"वस्तु बेचें",bidding:"ऑनलाइन बोली",demand:"मांग ट्रैकर",
      aiChat:"किसान AI चैट",settings:"सेटिंग्स",itemsOrdered:"ऑर्डर किए गए आइटम",cart:"कार्ट",
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
      following:["karthik_farms"]}
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
    : {type:"consumer",name,phone,password:pass,following:[]};
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
  if (currentUser){
    currentRole = getUser(currentUser).type;
    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
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
      cart:renderCart, moneyTable:renderConsumerMoneyTable, following:renderFollowing,
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
const DELIVERY_STAGES = ['placed','confirmed','packed','outForDelivery','delivered'];
const DELIVERY_STAGE_LABELS = {
  placed:'Order Placed', confirmed:'Order Confirmed', packed:'Packed',
  outForDelivery:'Out for Delivery', delivered:'Delivered'
};
const DELIVERY_STAGE_DESC = {
  placed:'Your order has been placed.', confirmed:'Farmer has confirmed the order.',
  packed:'Your produce has been packed.', outForDelivery:'Your order is on the way.',
  delivered:'Your order has been delivered.'
};
// Returns this order's current delivery stage, falling back to a
// reasonable guess (based on status) for orders saved before tracking existed.
function getOrderStage(o){
  if (o.deliveryStage) return o.deliveryStage;
  if (o.status === 'completed') return 'delivered';
  return 'placed';
}
// A short "FD1024"-style display code, so the tracking view has a
// friendly order number instead of the raw internal id.
function orderDisplayId(o){
  return 'FD' + o.id.replace(/[^0-9]/g,'').slice(-4).padStart(4,'0');
}
// Moves an order one step forward through DELIVERY_STAGES (Placed →
// Confirmed → Packed → Out for Delivery → Delivered). Reaching
// "delivered" also marks the order status "completed" so it's counted
// in Money Received / Orders Completed, same as before tracking existed.
function advanceOrderStage(orderId){
  const orders = store.orders();
  const o = orders.find(x=>x.id===orderId);
  if (!o) return;
  const idx = DELIVERY_STAGES.indexOf(getOrderStage(o));
  const next = DELIVERY_STAGES[Math.min(idx+1, DELIVERY_STAGES.length-1)];
  o.deliveryStage = next;
  if (next === 'delivered') o.status = 'completed';
  store.saveOrders(orders);
  toast(`📦 Order ${orderDisplayId(o)} → ${DELIVERY_STAGE_LABELS[next]}`);
  renderView(currentView);
}
// Builds and shows the Amazon-style vertical delivery timeline for one
// order. Used by the consumer's "Track Delivery" button.
function openTrackingModal(orderId){
  const o = store.orders().find(x=>x.id===orderId);
  if (!o) return;
  const stage = getOrderStage(o);
  const curIdx = DELIVERY_STAGES.indexOf(stage);
  const overlay = document.createElement('div'); overlay.className='modal-overlay';
  overlay.innerHTML = `<div class="modal-box">
    <h3 style="font-size:19px;">📦 Order #${orderDisplayId(o)}</h3>
    <p style="color:var(--ink-soft);font-size:13.5px;margin-top:2px;">${o.item} · Quantity: ${o.qty}${o.unit} · Total: ${money(o.price)}</p>
    <div class="section-head" style="margin-top:14px;margin-bottom:2px;"><h3 style="font-size:14px;">Delivery Status</h3></div>
    <div class="tracking-timeline">
      ${DELIVERY_STAGES.map((s,i)=>`
        <div class="tracking-step ${i<curIdx?'done':i===curIdx?'current':'upcoming'}">
          <div class="tracking-dot">${i<curIdx?'✓':i===curIdx?'●':'○'}</div>
          <div class="tracking-text">
            <div class="tracking-label">${DELIVERY_STAGE_LABELS[s]}</div>
            <div class="tracking-desc">${DELIVERY_STAGE_DESC[s]}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="pill-btn" id="closeTracking" style="width:100%;margin-top:16px;">Close</button>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#closeTracking').onclick = ()=> overlay.remove();
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
    const nextLabel = DELIVERY_STAGE_LABELS[DELIVERY_STAGES[nextIdx]];
    const row = document.createElement('div'); row.className = 'order-row';
    row.innerHTML = `
      <div>
        <div class="order-item-name">${o.item} × ${o.qty}${o.unit} <span class="badge">${DELIVERY_STAGE_LABELS[stage]}</span></div>
        <div class="order-sub">From ${o.consumer} · ${o.address}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="produce-price" style="font-size:15px;">${money(o.price)}</span>
        <button class="pill-btn" data-a="advance">${stage==='delivered' ? 'Delivered' : '→ '+nextLabel}</button>
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
  const cart = store.cart(currentUser);
  // Money Spent = product purchases + any donations this consumer has made.
  const spent = orders.reduce((s,o)=>s+o.price,0) + consumerDonationsTotal(currentUser);
  root.innerHTML = `
    <div class="stat-strip">
      <div class="stat-cell" id="cellItems"><span class="stat-num">${orders.length}</span><span class="stat-label">${t('itemsOrdered')}</span></div>
      <div class="stat-cell" id="cellCart"><span class="stat-num">${cart.length}</span><span class="stat-label">${t('cart')}</span></div>
      <div class="stat-cell" id="cellSpent"><span class="stat-num">${money(spent)}</span><span class="stat-label">${t('moneySpent')}</span></div>
    </div>
    <div class="section-head"><h3>Fresh from nearby farmers</h3><span class="muted">Within 10km</span></div>
    <div class="produce-grid" id="featured"></div>
  `;
  document.getElementById('cellItems').onclick = ()=> goTo('itemsOrdered');
  document.getElementById('cellCart').onclick = ()=> goTo('cart');
  document.getElementById('cellSpent').onclick = ()=> goTo('moneyTable');
  const grid = document.getElementById('featured');
  store.produce().filter(p=>!p.sold).slice(0,4).forEach(p=>{
    const el = produceCardEl(p,false);
    const btn = document.createElement('button'); btn.className='pill-btn'; btn.style.margin='10px 14px 14px'; btn.textContent='Add to cart';
    btn.onclick = ()=> addToCart(p,1);
    el.appendChild(btn);
    grid.appendChild(el);
  });
}

function addToCart(p, qty){
  const cart = store.cart(currentUser);
  const existing = cart.find(c=>c.name===p.name && c.farmer===p.farmer);
  if (existing) existing.qty += qty;
  else cart.push({id:'c'+Date.now(), name:p.name, icon:p.icon, qty, unit:p.unit, price:p.price, farmer:p.farmer});
  store.saveCart(currentUser, cart);
  toast(`🛒 Added ${p.name} to cart`);
}

function renderItemsOrdered(root){
  const orders = store.orders().filter(o=>o.consumer===getUser(currentUser).name);
  root.innerHTML = `<div class="section-head"><h3>📦 ${t('itemsOrdered')} / Track Delivery</h3></div><div class="card" id="ordList"></div>`;
  const list = document.getElementById('ordList');
  if (!orders.length){ list.innerHTML = `<div class="empty-state"><div class="glyph">📦</div>No orders yet — browse "Nearby You" or "Search" to start.</div>`; return; }
  orders.forEach(o=>{
    const farmerUser = getUser(o.farmer);
    const row = document.createElement('div'); row.className='order-row';
    row.innerHTML = `<div style="display:flex;gap:12px;align-items:center;">
        <div class="avatar" style="width:40px;height:40px;font-size:14px;">${(farmerUser?.name||o.farmer).split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
        <div>
          <div class="order-item-name">${o.item} × ${o.qty}${o.unit}</div>
          <div class="order-sub">Sold by ${farmerUser?.name || o.farmer} · ${o.date}</div>
        </div>
      </div>
      <div style="text-align:right;display:flex;gap:10px;align-items:center;">
        <div>
          <div class="produce-price" style="font-size:15px;">${money(o.price)}</div>
          <span class="badge" style="margin-top:4px;">${o.status==='refunded' ? 'Refunded' : DELIVERY_STAGE_LABELS[getOrderStage(o)]}</span>
        </div>
        ${o.status!=='refunded' ? `<button class="pill-btn" data-a="track">📦 Track Delivery</button>` : ''}
      </div>`;
    if (o.status!=='refunded') row.querySelector('[data-a="track"]').onclick = ()=> openTrackingModal(o.id);
    list.appendChild(row);
  });
}

function renderCart(root){
  const cart = store.cart(currentUser);
  root.innerHTML = `<div class="section-head"><h3>${t('cart')}</h3></div><div class="card" id="cartList"></div>`;
  const list = document.getElementById('cartList');
  if (!cart.length){ list.innerHTML = `<div class="empty-state"><div class="glyph">🛒</div>Your cart is empty.</div>`; return; }
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
    <button class="btn-primary" id="checkoutBtn">Proceed to checkout</button>`;
  root.appendChild(bar);
  document.getElementById('checkoutBtn').onclick = openPaymentModal;
}
function changeCartQty(id, delta){
  const cart = store.cart(currentUser);
  const item = cart.find(c=>c.id===id);
  item.qty = Math.max(1, item.qty+delta);
  store.saveCart(currentUser, cart);
  renderView('cart');
}
function removeFromCart(id){
  let cart = store.cart(currentUser);
  cart = cart.filter(c=>c.id!==id);
  store.saveCart(currentUser, cart);
  toast("Removed from cart");
  renderView('cart');
}

// ===============================
// DEMO PAYMENT OTP
// This is only a simulated OTP for
// demonstration purposes.
// No real SMS/payment service is used.
// ===============================
function openPaymentModal(){
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
    completeCheckout();
    overlay.remove();
  };
}
// Turns the current cart into real orders (one per cart line), reduces
// each produce listing's stock, and empties the cart. Runs after the
// demo payment OTP above is confirmed.
function completeCheckout(){
  const cart = store.cart(currentUser);
  if (!cart.length) return;
  const orders = store.orders();
  const u = getUser(currentUser);
  cart.forEach(c=>{
    orders.push({id:'o'+Date.now()+Math.random().toString(36).slice(2,5), farmer:c.farmer, consumer:u.name,
      item:c.name, qty:c.qty, unit:c.unit, price:c.price*c.qty, address:u.address||'Address on file',
      status:'pending', date:new Date().toISOString().slice(0,10),
      // DELIVERY TRACKING: every new order starts at "placed" and moves
      // forward through DELIVERY_STAGES as the farmer updates it.
      deliveryStage:'placed'});
    const produce = store.produce();
    const p = produce.find(x=>x.farmer===c.farmer && x.name===c.name);
    if (p){ p.qty = Math.max(0, p.qty - c.qty); if (p.qty===0) p.sold = true; store.saveProduce(produce); }
  });
  store.saveOrders(orders);
  store.saveCart(currentUser, []);
  toast("✅ Order placed! Track it under 'Items Ordered'.");
  goTo('itemsOrdered');
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
  const farmers = Object.entries(store.users()).filter(([k,v])=>v.type==='farmer');
  root.innerHTML = `<div class="section-head"><h3>${t('nearby')}</h3><span class="muted">Within 10km radius</span></div><div id="nearbyList"></div>`;
  const list = document.getElementById('nearbyList');
  const dists = [2.3,4.8,6.1,8.5];
  farmers.forEach(([uname,f],i)=>{
    const produce = store.produce().filter(p=>p.farmer===uname && !p.sold);
    const div = document.createElement('div'); div.className='nearby-card';
    div.innerHTML = `<div class="avatar">${f.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
      <div style="flex:1;">
        <div class="order-item-name">${f.name} <span class="dist-badge">${dists[i%dists.length]} km</span></div>
        <div class="order-sub">${f.village||''} · ${produce.map(p=>p.icon+' '+p.name).join('  ')}</div>
      </div>
      <button class="pill-btn" data-a="produce">View produce</button>
      <button class="pill-btn" data-a="profile">View Profile</button>`;
    div.querySelector('[data-a="produce"]').onclick = ()=> showFarmerProduce(uname);
    div.querySelector('[data-a="profile"]').onclick = ()=> openFarmerProfile(uname,'nearby');
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
    btn.onclick = ()=> addToCart(p,1);
    el.appendChild(btn);
    grid.appendChild(el);
  });
}

function renderConsumerBidding(root){
  root.innerHTML = `<div class="section-head"><h3>${t('bidding')}</h3><span class="muted">Bid on bulk produce lots</span></div><div id="cAuctions"></div>`;
  renderAuctionList(document.getElementById('cAuctions'), store.auctions(), true);
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
      btn.onclick = ()=> addToCart(p, Number(qtyInput.value)||1);
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
    btn.onclick = ()=> addToCart(p,1);
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