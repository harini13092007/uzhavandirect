
/* ==========================================================
   UZHAVAN DIRECT - COMPLETE PRODUCTION LOGIC
   ========================================================== */

// 1. Translations & Dictionary
const translations = {
    en: {
        heroTitle: "Direct Farm-to-Buyer Digital Ecosystem",
        heroSubtitle: "Zero Middlemen. Fair Mandi Rates. Transparent Auctions. Direct Farmer Empowerment.",
        farmerDashTitle: "Farmer Control Center",
        addProduce: "List New Produce",
        pendingOrders: "Pending Orders",
        completedOrders: "Completed Orders",
        totalReceived: "Total Money Received",
        myCurrentStock: "My Active Farm Produce in Market",
        sellProduceHeading: "List Fresh Farm Produce",
        cropCategory: "Produce Category",
        cropName: "Produce Name",
        pricePerKg: "Price (₹ per Kg / Liter)",
        quantityAvailable: "Available Quantity (Kg / Liters)",
        perishabilityLife: "Perishability / Shelf Life",
        uploadProduceBtn: "Upload Produce to Marketplace",
        auctionHeader: "Launch Bulk Buyer Crop Auction",
        startAuctionBtn: "Start Auction",
        activeAuctions: "Active Bidding Sessions",
        demandTrackerHeading: "Agricultural Demand Forecast & Daily Sales",
        marketTips: "Kisan Advisory Alert",
        publicProfile: "Farmer Public Profile",
        reliefFundDonations: "Kisan Calamity Relief Donations",
        helpGuideTitle: "Help & How It Works",
        consumerDashTitle: "Consumer & Buyer Portal",
        consumerDashSub: "Fresh harvest directly from local verified farmers",
        cart: "Cart",
        itemsOrdered: "Items Ordered",
        cartItems: "Cart Ready",
        moneySpent: "Money Spent",
        availableFreshProduce: "All Available Farm Harvests",
        nearbyHeading: "Nearby Farmers (Within 10 km Radius)",
        wholesaleBidding: "Bulk Wholesale Bidding Arena",
        myPurchases: "My Orders & Live Dispatch Tracking",
        myCart: "Your Farm Cart",
        proceedCheckout: "Proceed to Checkout",
        followingTitle: "Farmers You Follow",
        appGuideConsumer: "Consumer Guide & Direct Support",
        logout: "Logout"
    },
    ta: {
        heroTitle: "நேரடி உழவர் - நுகர்வோர் டிஜிட்டல் சந்தை",
        heroSubtitle: "இடைத்தரகர் இல்லாத வர்த்தகம். நியாயமான மண்டி விலை. வெளிப்படையான ஏலம். உழவர் முன்னேற்றம்.",
        farmerDashTitle: "விவசாயிகள் கட்டுப்பாட்டு மையம்",
        addProduce: "புதிய விளைபொருளை சேர்க்க",
        pendingOrders: "நிலுவையில் உள்ள ஆர்டர்கள்",
        completedOrders: "முடிவுற்ற ஆர்டர்கள்",
        totalReceived: "பெறப்பட்ட மொத்த தொகை",
        myCurrentStock: "சந்தையில் உள்ள எனது பயிர்கள்",
        sellProduceHeading: "புதிய விளைபொருட்களை விற்க",
        cropCategory: "விளைபொருள் வகை",
        cropName: "பயிரின் பெயர்",
        pricePerKg: "விலை (₹ கிலோ / லிட்டர்)",
        quantityAvailable: "இருப்பு அளவு (கிலோ / லிட்டர்)",
        perishabilityLife: "பயிரின் ஆயுட்காலம் / கெட்டுப்போகும் நேரம்",
        uploadProduceBtn: "சந்தையில் பதிவேற்றவும்",
        auctionHeader: "மொத்த வியாபாரிகளுக்கான பயிர் ஏலம்",
        startAuctionBtn: "ஏலத்தை தொடங்கவும்",
        activeAuctions: "நடைபெறும் நேரடி ஏலங்கள்",
        demandTrackerHeading: "தேவை கண்காணிப்பான் & தினசரி விற்பனை",
        marketTips: "விவசாயிகளுக்கான ஆலோசனை",
        publicProfile: "விவசாயியின் சுயவிவரம்",
        reliefFundDonations: "இயற்கை பேரிடர் நிவாரண நிதி",
        helpGuideTitle: "உதவி & வழிகாட்டி",
        consumerDashTitle: "நுகர்வோர் & வாங்குபவர் தளம்",
        consumerDashSub: "விவசாயிகளிடமிருந்து நேரடியாக நுகர்வோருக்கு",
        cart: "கூடை",
        itemsOrdered: "ஆர்டர் செய்தவை",
        cartItems: "கூடையில் உள்ளவை",
        moneySpent: "செலவழித்த தொகை",
        availableFreshProduce: "அனைத்து புதிய விளைபொருட்கள்",
        nearbyHeading: "அருகிலுள்ள விவசாயிகள் (10 கி.மீ சுற்றளவில்)",
        wholesaleBidding: "மொத்த விற்பனை ஏலக்களம்",
        myPurchases: "எனது ஆர்டர்கள் & வாகன கண்காணிப்பு",
        myCart: "உங்கள் கூடை",
        proceedCheckout: "பணம் செலுத்தி முடிக்கவும்",
        followingTitle: "நீங்கள் பின்தொடரும் விவசாயிகள்",
        appGuideConsumer: "நுகர்வோர் வழிகாட்டி",
        logout: "வெளியேறு"
    },
    hi: {
        heroTitle: "प्रत्यक्ष किसान-से-उपभोक्ता डिजिटल बाज़ार",
        heroSubtitle: "बिचौलिया मुक्त व्यापार। उचित मंडी दर। पारदर्शी नीलामी। किसान सशक्तिकरण।",
        farmerDashTitle: "किसान नियंत्रण केंद्र",
        addProduce: "नई उपज जोड़ें",
        pendingOrders: "लंबित ऑर्डर",
        completedOrders: "पूर्ण किए गए ऑर्डर",
        totalReceived: "प्राप्त कुल राशि",
        myCurrentStock: "बाजार में मेरी सक्रिय फसलें",
        sellProduceHeading: "ताज़ी उपज सूचीबद्ध करें",
        cropCategory: "उपज श्रेणी",
        cropName: "फसल का नाम",
        pricePerKg: "मूल्य (₹ प्रति किलो/लीटर)",
        quantityAvailable: "उपलब्ध मात्रा",
        perishabilityLife: "शेल्फ लाइफ",
        uploadProduceBtn: "बाज़ार में अपलोड करें",
        auctionHeader: "थोक खरीदारों के लिए नीलामी शुरू करें",
        startAuctionBtn: "नीलामी शुरू करें",
        activeAuctions: "सक्रिय नीलामी सत्र",
        demandTrackerHeading: "मांग ट्रैकर और दैनिक बिक्री",
        marketTips: "किसान परामर्श चेतावनी",
        publicProfile: "किसान प्रोफ़ाइल",
        reliefFundDonations: "आपदा राहत सहायता",
        helpGuideTitle: "सहायता और उपयोग गाइड",
        consumerDashTitle: "उपभोक्ता एवं खरीदार पोर्टल",
        consumerDashSub: "सत्यापित स्थानीय किसानों से सीधे ताज़ा फसल",
        cart: "कार्ट",
        itemsOrdered: "ऑर्डर किए गए आइटम",
        cartItems: "कार्ट आइटम",
        moneySpent: "कुल खर्च",
        availableFreshProduce: "सभी उपलब्ध ताज़ी फसलें",
        nearbyHeading: "आपके नजदीकी किसान (10 किमी के भीतर)",
        wholesaleBidding: "थोक बोली क्षेत्र",
        myPurchases: "मेरे ऑर्डर और लाइव ट्रैकिंग",
        myCart: "आपकी कार्ट",
        proceedCheckout: "चेकआउट के लिए आगे बढ़ें",
        followingTitle: "किसान जिन्हें आप फ़ॉलो करते हैं",
        appGuideConsumer: "उपभोक्ता सहायता",
        logout: "लॉग आउट"
    }
};

const cropDictionary = {
    "Country Tomatoes": { ta: "நாட்டுத் தக்காளி", hi: "देसी टमाटर" },
    "Ponni Rice": { ta: "பொன்னி அரிசி", hi: "पोन्नी चावल" },
    "A2 Cow Milk": { ta: "நாட்டுப் பசும்பால்", hi: "देसी गाय का दूध" },
    "Organic Potatoes": { ta: "இயற்கை உருளைக்கிழங்கு", hi: "आलू" },
    "Small Onions": { ta: "சின்ன வெங்காயம்", hi: "छोटा प्याज" },
    "Fresh Carrots": { ta: "கேரட்", hi: "गाजर" }
};

let currentLang = 'en';

// 2. Dynamic Icon Finder (Resolves Image Mismatch)
function getAccurateCropIcon(name, category) {
    const n = name.toLowerCase();
    if (n.includes("tomato")) return "🍅";
    if (n.includes("potato")) return "🥔";
    if (n.includes("onion") || n.includes("shallot")) return "🧅";
    if (n.includes("rice") || n.includes("paddy")) return "🌾";
    if (n.includes("milk")) return "🥛";
    if (n.includes("ghee") || n.includes("butter")) return "🧈";
    if (n.includes("carrot")) return "🥕";
    if (n.includes("brinjal") || n.includes("eggplant")) return "🍆";
    if (n.includes("chilli") || n.includes("pepper")) return "🌶️";
    if (n.includes("apple")) return "🍎";
    if (n.includes("banana")) return "🍌";
    if (n.includes("mango")) return "🥭";
    if (n.includes("wheat") || n.includes("cereal") || n.includes("grain")) return "🌾";
    if (n.includes("turmeric") || n.includes("herb")) return "🌿";
    
    // Category fallback
    if (category === "Vegetables") return "🥦";
    if (category === "Fruits") return "🍉";
    if (category === "Dairy") return "🥛";
    return "🌱";
}

// 3. Central Application State
const state = {
    user: null, // Logged in user object
    registeredFarmers: [
        { name: "Murugan K", username: "murugan_k", phone: "+91 98421 23000", address: "Thiruvaiyaru, Thanjavur", distance: 3.2, rating: "4.9 ★" },
        { name: "Senthil Kumar", username: "senthil_dairy", phone: "+91 97892 11444", address: "Papanasam, Thanjavur", distance: 7.8, rating: "4.8 ★" },
        { name: "Ramanathan P", username: "raman_farm", phone: "+91 94432 99881", address: "Vallam, Thanjavur", distance: 5.1, rating: "4.7 ★" }
    ],
    crops: [
        { id: 1, name: "Ponni Rice", category: "Grains", price: 56, qty: 300, shelfLife: "6 Months", farmer: "Murugan K", farmerUsername: "murugan_k", location: "Thiruvaiyaru, Thanjavur", distance: 3.2, icon: "🌾", farmerPhone: "+91 98421 23000" },
        { id: 2, name: "Country Tomatoes", category: "Vegetables", price: 34, qty: 90, shelfLife: "4 Days", farmer: "Murugan K", farmerUsername: "murugan_k", location: "Thiruvaiyaru, Thanjavur", distance: 3.2, icon: "🍅", farmerPhone: "+91 98421 23000" },
        { id: 3, name: "A2 Cow Milk", category: "Dairy", price: 65, qty: 40, shelfLife: "6 Hours", farmer: "Senthil Kumar", farmerUsername: "senthil_dairy", location: "Papanasam, Thanjavur", distance: 7.8, icon: "🥛", farmerPhone: "+91 97892 11444" }
    ],
    auctions: [
        { 
            id: 101, 
            item: "Country Tomatoes", 
            farmer: "Murugan K", 
            farmerPhone: "+91 98421 23000",
            totalQty: 100, 
            availableQty: 100, 
            basePrice: 30, 
            currentBid: 32, 
            highestBidder: "Saravana Bhavan Hotel", 
            timeLeftSeconds: 3600, 
            status: "Active" 
        }
    ],
    farmerOrders: [
        { id: "ORD-101", farmerUsername: "murugan_k", item: "Country Tomatoes", qty: 10, total: 340, buyer: "Anand R", address: "14, North Street, Thanjavur", status: "Pending", phone: "+91 94441 12345" },
        { id: "ORD-102", farmerUsername: "murugan_k", item: "Ponni Rice", qty: 25, total: 1400, buyer: "Deepa S", address: "Plot 8, Cauvery Nagar", status: "Completed", phone: "+91 98402 67890" }
    ],
    consumerCart: [],
    consumerOrders: [],
    consumerTransactions: [
        { id: "TXN-881", item: "Ponni Rice (10 kg)", date: "02 Sep 2026", type: "Purchase", amount: 560 },
        { id: "TXN-872", item: "A2 Cow Milk (2 L)", date: "01 Sep 2026", type: "Purchase", amount: 130 }
    ],
    donations: [
        { donor: "Harini M", farmer: "Murugan K", amount: 500, message: "For rain damages" }
    ],
    followingFarmers: [
        { name: "Murugan K", username: "murugan_k", phone: "+91 98421 23000", address: "Thiruvaiyaru, Thanjavur", rating: "4.9 ★" }
    ],
    demandData: [
        { crop: "Country Tomatoes", score: 95, tag: "High Deficit" },
        { crop: "Small Onions", score: 88, tag: "Critical Demand" },
        { crop: "Ponni Rice", score: 78, tag: "Consistent Bulk" },
        { crop: "A2 Cow Milk", score: 72, tag: "Daily Need" }
    ]
};

// 4. Initialization & Role Handling
function initUI() {
    renderDemandTracker();
    startAuctionTickers();
    if (!state.user) {
        document.getElementById("guestHero").classList.remove("hidden");
        document.getElementById("sidebar").classList.add("hidden");
        document.getElementById("authNavButtons").classList.remove("hidden");
        document.getElementById("userNavProfile").classList.add("hidden");
    } else {
        setupUserSession();
    }
}

function selectAuthRole(role) {
    document.getElementById("roleBtnFarmer").classList.toggle("active", role === 'farmer');
    document.getElementById("roleBtnConsumer").classList.toggle("active", role === 'consumer');
    state.tempRole = role;
    
    // Toggle address label
    const addrLabel = document.getElementById("authAddressLabel");
    if (role === 'farmer') {
        addrLabel.textContent = "Farm Address (Village / District)";
    } else {
        addrLabel.textContent = "Delivery Address (Home / Business)";
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById("authFullName").value;
    const username = document.getElementById("authUsername").value.trim().toLowerCase();
    const phone = document.getElementById("authPhone").value;
    const address = document.getElementById("authAddress").value;
    const role = state.tempRole || 'farmer';

    state.user = { name: fullName, username, phone, address, role };

    if (role === 'farmer') {
        const existing = state.registeredFarmers.find(f => f.username === username);
        if (!existing) {
            state.registeredFarmers.push({ name: fullName, username, phone, address, distance: 3.0, rating: "5.0 ★" });
        }
    }

    closeModal('authModal');
    setupUserSession();
    showToast(`Signed in successfully as ${fullName}!`);
}

function quickLogin(role) {
    if (role === 'farmer') {
        state.user = { name: "Murugan K", username: "murugan_k", phone: "+91 98421 23000", address: "Thiruvaiyaru, Thanjavur", role: "farmer" };
    } else {
        state.user = { name: "Harini", username: "harini_buyer", phone: "+91 98840 55112", address: "Cauvery Nagar, Thanjavur", role: "consumer" };
    }
    setupUserSession();
    showToast(`Entered as ${state.user.role.toUpperCase()}`);
}

function setupUserSession() {
    document.getElementById("guestHero").classList.add("hidden");
    document.getElementById("sidebar").classList.remove("hidden");
    document.getElementById("authNavButtons").classList.add("hidden");
    document.getElementById("userNavProfile").classList.remove("hidden");

    document.getElementById("navUsername").textContent = state.user.name;
    document.getElementById("userRoleBadge").textContent = state.user.role;
    document.getElementById("sidebarName").textContent = state.user.name;
    document.getElementById("sidebarRoleLabel").textContent = state.user.role === 'farmer' ? 'Verified Farmer' : 'Verified Buyer';
    document.getElementById("sidebarAddressLabel").textContent = `📍 ${state.user.address}`;
    document.getElementById("sidebarAvatar").textContent = state.user.role === 'farmer' ? '👨‍🌾' : '🛒';

    buildSidebarMenu();

    if (state.user.role === 'farmer') {
        showTab('farmerDashboard');
        renderFarmerDashboard();
    } else {
        showTab('consumerDashboard');
        renderConsumerMarketplace();
        renderNearbyMarketplace();
        renderConsumerCart();
        renderFollowingList();
        updateConsumerMoneySpent();
    }
}

function logout() {
    state.user = null;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    initUI();
    showToast("Logged out");
}

function buildSidebarMenu() {
    const menu = document.getElementById("sidebarMenu");
    menu.innerHTML = "";

    if (state.user.role === 'farmer') {
        menu.innerHTML = `
            <button class="active" onclick="showTab('farmerDashboard')">📊 Dashboard</button>
            <button onclick="showTab('farmer-sell')">🌱 Sell Item</button>
            <button onclick="showTab('farmer-auction')">🔨 Online Bidding</button>
            <button onclick="showTab('farmer-demand')">📈 Demand Tracker</button>
            <button onclick="showTab('farmer-ai')">🤖 Kisan AI Chat</button>
            <button onclick="showTab('farmer-settings')">⚙️ Settings & Profile</button>
        `;
    } else {
        menu.innerHTML = `
            <button class="active" onclick="showTab('consumerDashboard')">🛒 Marketplace</button>
            <button onclick="showTab('consumer-nearby')">📍 Nearby You (10 km)</button>
            <button onclick="showTab('consumer-bidding')">🔨 Online Bidding</button>
            <button onclick="showTab('consumer-orders')">📦 Items Ordered</button>
            <button onclick="showTab('consumer-cart')">🛍️ Cart & Checkout</button>
            <button onclick="showTab('consumer-settings')">⚙️ Settings & Following</button>
        `;
    }
}

function showTab(tabId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

    const buttons = document.querySelectorAll('#sidebarMenu button');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabId));
    });
}

// 5. Farmer Flow & Strict Inventory Filtering
function renderFarmerDashboard() {
    document.getElementById("farmerAddressSubtitle").textContent = `Farm Location: ${state.user.address}`;

    // Filter STRICTLY by logged-in farmer username
    const myOrders = state.farmerOrders.filter(o => o.farmerUsername === state.user.username);
    const pending = myOrders.filter(o => o.status === 'Pending');
    const completed = myOrders.filter(o => o.status === 'Completed');
    const totalEarnings = completed.reduce((sum, o) => sum + o.total, 0);

    document.getElementById("farmerPendingCount").textContent = pending.length;
    document.getElementById("farmerCompletedCount").textContent = completed.length;
    document.getElementById("farmerTotalEarnings").textContent = `₹${totalEarnings.toLocaleString()}`;

    // Strict Inventory: Only crops uploaded by this farmer
    const myCrops = state.crops.filter(c => c.farmerUsername === state.user.username);
    const countBadge = document.getElementById("farmerCropCount");
    countBadge.textContent = `${myCrops.length} items live`;

    const grid = document.getElementById("farmerInventoryGrid");
    grid.innerHTML = "";

    if (myCrops.length === 0) {
        grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; padding: 1rem 0;">No active crops listed by you yet. Click <strong>+ List New Produce</strong> to upload your harvest.</p>`;
    } else {
        myCrops.forEach(crop => {
            grid.innerHTML += `
                <div class="crop-card">
                    <div class="crop-image-wrapper">
                        ${crop.icon}
                        <span class="perish-badge" style="position: absolute; top: 10px; right: 10px;">⏳ ${crop.shelfLife}</span>
                    </div>
                    <div class="crop-card-body">
                        <h4>${translateProduce(crop.name)}</h4>
                        <p class="text-muted">Category: ${crop.category}</p>
                        <p>Stock: <strong>${crop.qty} Kg</strong></p>
                    </div>
                    <div class="crop-card-footer">
                        <span class="crop-price">₹${crop.price}/kg</span>
                        <span class="badge badge-gps">Active Live</span>
                    </div>
                </div>
            `;
        });
    }

    // Update settings tab info
    document.getElementById("farmerProfileName").textContent = state.user.name;
    document.getElementById("farmerProfileAddress").textContent = `📍 ${state.user.address}`;
    document.getElementById("farmerProfilePhone").textContent = state.user.phone;
    renderFarmerDonations();
    renderFarmerAuctions();
}

function autoSuggestItem(cat) {
    const input = document.getElementById("cropShelfLife");
    if (cat === "Dairy") input.value = "4 Hours";
    else if (cat === "Vegetables") input.value = "3 Days";
    else if (cat === "Fruits") input.value = "5 Days";
    else input.value = "6 Months";
}

function handleNewProduce(e) {
    e.preventDefault();
    const name = document.getElementById("cropName").value.trim();
    const category = document.getElementById("cropCategory").value;
    const price = Number(document.getElementById("cropPrice").value);
    const qty = Number(document.getElementById("cropQty").value);
    const shelfLife = document.getElementById("cropShelfLife").value;

    const icon = getAccurateCropIcon(name, category);

    const newCrop = {
        id: Date.now(),
        name,
        category,
        price,
        qty,
        shelfLife,
        farmer: state.user.name,
        farmerUsername: state.user.username,
        location: state.user.address,
        distance: 2.4,
        icon,
        farmerPhone: state.user.phone
    };

    state.crops.unshift(newCrop);
    showToast(`${name} uploaded successfully!`);
    document.getElementById("sellForm").reset();
    showTab('farmerDashboard');
    renderFarmerDashboard();
}

function openFarmerOrdersModal(type) {
    const modal = document.getElementById("farmerOrdersModal");
    const title = document.getElementById("farmerOrdersModalTitle");
    const content = document.getElementById("farmerOrdersModalContent");
    modal.classList.remove("hidden");

    title.textContent = type === 'pending' ? 'Pending Orders to Fulfill' : 'Completed Orders (Refund Management)';
    const myOrders = state.farmerOrders.filter(o => o.farmerUsername === state.user.username);
    const list = myOrders.filter(o => o.status.toLowerCase() === type.toLowerCase());

    if (list.length === 0) {
        content.innerHTML = `<p class="text-muted">No ${type} orders at this moment.</p>`;
        return;
    }

    content.innerHTML = list.map(order => `
        <div class="tip-card" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4>${order.item} (${order.qty} kg)</h4>
                    <p>👤 <strong>Buyer:</strong> ${order.buyer} (${order.phone})</p>
                    <p>📍 <strong>Address:</strong> ${order.address}</p>
                    <p>💵 <strong>Amount:</strong> ₹${order.total}</p>
                </div>
                <div>
                    ${order.status === 'Pending' ? 
                        `<button class="btn btn-primary btn-sm" onclick="markOrderDelivered('${order.id}')">Confirm Delivered</button>` :
                        `<button class="btn btn-danger btn-sm" onclick="executeFarmerRefund('${order.id}')">Refund Money (பணம் திருப்பு)</button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function markOrderDelivered(id) {
    const ord = state.farmerOrders.find(o => o.id === id);
    if (ord) {
        ord.status = 'Completed';
        showToast("Order marked completed and payment credited!");
        openFarmerOrdersModal('pending');
        renderFarmerDashboard();
    }
}

function executeFarmerRefund(id) {
    const ord = state.farmerOrders.find(o => o.id === id);
    if (ord) {
        ord.status = 'Refunded';
        showToast(`₹${ord.total} refunded directly to buyer ${ord.buyer}.`);
        openFarmerOrdersModal('completed');
        renderFarmerDashboard();
    }
}

function openFarmerEarningsModal() {
    const modal = document.getElementById("farmerEarningsModal");
    const content = document.getElementById("farmerEarningsContent");
    modal.classList.remove("hidden");

    const myCompleted = state.farmerOrders.filter(o => o.farmerUsername === state.user.username && o.status === 'Completed');
    if (myCompleted.length === 0) {
        content.innerHTML = `<p class="text-muted">No completed transactions yet.</p>`;
        return;
    }

    content.innerHTML = `
        <table class="txn-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Produce</th>
                    <th>Buyer</th>
                    <th>Total (₹)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${myCompleted.map(o => `
                    <tr>
                        <td>${o.id}</td>
                        <td>${o.item} (${o.qty} kg)</td>
                        <td>${o.buyer}</td>
                        <td style="color: var(--primary); font-weight:700;">+ ₹${o.total}</td>
                        <td><span class="badge badge-gps">Received</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// 6. Online Bidding (Per-Kg Multiplication, Splitting & Timed Lock)
function handleStartAuction(e) {
    e.preventDefault();
    const item = document.getElementById("aucItemName").value.trim();
    const totalQty = Number(document.getElementById("aucTotalQty").value);
    const basePrice = Number(document.getElementById("aucBasePrice").value);
    const duration = Number(document.getElementById("aucDuration").value);

    const newAuction = {
        id: Date.now(),
        item,
        farmer: state.user.name,
        farmerPhone: state.user.phone,
        totalQty,
        availableQty: totalQty,
        basePrice,
        currentBid: basePrice,
        highestBidder: "No bids yet",
        timeLeftSeconds: duration * 60,
        status: "Active"
    };

    state.auctions.unshift(newAuction);
    showToast("Auction session launched!");
    document.getElementById("auctionForm").reset();
    renderFarmerAuctions();
}

function renderFarmerAuctions() {
    const list = document.getElementById("farmerAuctionList");
    if (!list) return;
    list.innerHTML = "";

    state.auctions.filter(a => a.farmer === state.user.name).forEach(auc => {
        list.innerHTML += `
            <div class="auction-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>${auc.item}</h4>
                    <span class="auction-timer" id="timer-${auc.id}">${formatTime(auc.timeLeftSeconds)}</span>
                </div>
                <p>Available Qty: <strong>${auc.availableQty} kg</strong> / ${auc.totalQty} kg</p>
                <p>Base: ₹${auc.basePrice}/kg | Top Bid: <strong style="color: var(--primary);">₹${auc.currentBid}/kg</strong></p>
                <small>Top Bidder: ${auc.highestBidder}</small>
                ${auc.status === 'Sold Out' ? `<span class="badge btn-danger mt-2">SOLD OUT</span>` : ''}
            </div>
        `;
    });
}

function renderConsumerAuctions() {
    const grid = document.getElementById("consumerAuctionGrid");
    if (!grid) return;
    grid.innerHTML = "";

    // Show only active or newly sold auctions
    const visible = state.auctions.filter(a => a.status === 'Active' || a.status === 'Sold Out');

    if (visible.length === 0) {
        grid.innerHTML = `<p class="text-muted">No wholesale auctions live currently.</p>`;
        return;
    }

    visible.forEach(auc => {
        const isExpired = auc.timeLeftSeconds <= 0 || auc.status === 'Sold Out' || auc.availableQty <= 0;

        grid.innerHTML += `
            <div class="auction-card" id="aucCard-${auc.id}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>${auc.item}</h4>
                    <span class="auction-timer" id="conTimer-${auc.id}">
                        ${isExpired ? 'CLOSED' : formatTime(auc.timeLeftSeconds)}
                    </span>
                </div>
                <p>👨‍🌾 Farmer: <strong>${auc.farmer}</strong> (📞 ${auc.farmerPhone})</p>
                <p>📦 Available to Bid: <strong>${auc.availableQty} kg</strong></p>
                <p>Base: ₹${auc.basePrice}/kg | Current Bid: <strong style="color:var(--primary); font-size:1.15rem;">₹${auc.currentBid}/kg</strong></p>
                <small>Leading: ${auc.highestBidder}</small>

                ${!isExpired ? `
                    <div style="margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.4rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="number" id="bidQty-${auc.id}" class="form-control" placeholder="Qty (kg)" min="1" max="${auc.availableQty}" value="${Math.min(10, auc.availableQty)}">
                            <input type="number" id="bidPrice-${auc.id}" class="form-control" placeholder="₹/kg > ${auc.currentBid}" min="${auc.currentBid + 1}">
                        </div>
                        <button class="btn btn-dark btn-sm" onclick="placeBuyerBid(${auc.id})">Submit Bid & Reserve Qty</button>
                    </div>
                ` : `
                    <div style="margin-top: 0.8rem;">
                        <span class="badge btn-danger" style="display:block; text-align:center; padding: 0.5rem;">SOLD OUT / AUCTION FINISHED</span>
                    </div>
                `}
            </div>
        `;
    });
}

function placeBuyerBid(aucId) {
    const auc = state.auctions.find(a => a.id === aucId);
    if (!auc || auc.timeLeftSeconds <= 0 || auc.status === 'Sold Out') {
        showToast("This auction has ended and is sold out!");
        return;
    }

    const qtyInput = document.getElementById(`bidQty-${aucId}`);
    const priceInput = document.getElementById(`bidPrice-${aucId}`);
    const qty = Number(qtyInput.value);
    const price = Number(priceInput.value);

    if (qty <= 0 || qty > auc.availableQty) {
        showToast(`Quantity must be between 1 and ${auc.availableQty} kg!`);
        return;
    }

    if (price <= auc.currentBid) {
        showToast(`Your bid must be strictly higher than ₹${auc.currentBid}/kg!`);
        return;
    }

    auc.currentBid = price;
    auc.highestBidder = state.user.name;

    // Deduct quantity won and split if partial
    auc.availableQty -= qty;
    const totalCost = price * qty;

    // Move directly to cart with multiplication
    state.consumerCart.push({
        id: Date.now(),
        name: `${auc.item} (Auction Batch)`,
        price: totalCost,
        cartQty: qty,
        unitPrice: price,
        farmer: auc.farmer,
        icon: "🏆"
    });

    if (auc.availableQty === 0) {
        auc.status = 'Sold Out';
        showToast(`You won all remaining ${qty} kg! Added to cart for ₹${totalCost}.`);
    } else {
        showToast(`Bid accepted! ${qty} kg reserved in your cart (₹${totalCost}). ${auc.availableQty} kg remaining in auction.`);
    }

    renderConsumerAuctions();
    renderConsumerCart();
}

function startAuctionTickers() {
    setInterval(() => {
        state.auctions.forEach(auc => {
            if (auc.timeLeftSeconds > 0 && auc.status === 'Active') {
                auc.timeLeftSeconds--;
                const t1 = document.getElementById(`timer-${auc.id}`);
                const t2 = document.getElementById(`conTimer-${auc.id}`);
                if (t1) t1.textContent = formatTime(auc.timeLeftSeconds);
                if (t2) t2.textContent = formatTime(auc.timeLeftSeconds);
            } else if (auc.timeLeftSeconds <= 0 && auc.status === 'Active') {
                auc.status = 'Sold Out';
                renderConsumerAuctions();
                renderFarmerAuctions();
            }
        });
    }, 1000);
}

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

// 7. Consumer Search (Crops AND Farmers) & Follow/Unfollow
function filterMarketplaceAndFarmers() {
    const query = document.getElementById("marketSearchInput").value.trim().toLowerCase();
    
    // Filter Crops
    const cards = document.querySelectorAll("#consumerMarketGrid .crop-card");
    cards.forEach(card => {
        const title = card.querySelector("h4").textContent.toLowerCase();
        const farmer = card.querySelector(".farmer-tag").textContent.toLowerCase();
        card.style.display = (title.includes(query) || farmer.includes(query)) ? "flex" : "none";
    });

    // Farmer Profile Search Row
    const farmerRow = document.getElementById("farmerSearchResults");
    if (!query) {
        farmerRow.classList.add("hidden");
        return;
    }

    const matchedFarmers = state.registeredFarmers.filter(f => 
        f.name.toLowerCase().includes(query) || f.address.toLowerCase().includes(query)
    );

    if (matchedFarmers.length > 0) {
        farmerRow.classList.remove("hidden");
        farmerRow.innerHTML = matchedFarmers.map(f => {
            const isFollowing = state.followingFarmers.some(fol => fol.username === f.username);
            return `
                <div class="farmer-search-card">
                    <strong>👨‍🌾 ${f.name}</strong>
                    <small>📍 ${f.address}</small>
                    <small>📞 ${f.phone}</small>
                    ${isFollowing ? 
                        `<button class="btn btn-secondary btn-sm mt-2" onclick="unfollowFarmer('${f.username}')">Following ✓</button>` :
                        `<button class="btn btn-primary btn-sm mt-2" onclick="followFarmer('${f.username}')">+ Follow Farmer</button>`
                    }
                </div>
            `;
        }).join('');
    } else {
        farmerRow.classList.add("hidden");
    }
}

function followFarmer(username) {
    const farmer = state.registeredFarmers.find(f => f.username === username);
    if (farmer && !state.followingFarmers.some(f => f.username === username)) {
        state.followingFarmers.push(farmer);
        showToast(`You are now following ${farmer.name}!`);
        filterMarketplaceAndFarmers();
        renderFollowingList();
    }
}

function unfollowFarmer(username) {
    state.followingFarmers = state.followingFarmers.filter(f => f.username !== username);
    showToast(`Unfollowed farmer.`);
    filterMarketplaceAndFarmers();
    renderFollowingList();
}

function renderFollowingList() {
    const list = document.getElementById("followingFarmersList");
    if (!list) return;
    list.innerHTML = "";

    if (state.followingFarmers.length === 0) {
        list.innerHTML = `<p class="text-muted">You are not following any farmers yet. Search and follow local growers to get instant harvest updates!</p>`;
        return;
    }

    state.followingFarmers.forEach(f => {
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.8rem 0; border-bottom: 1px solid var(--border);">
                <div>
                    <strong>👨‍🌾 ${f.name}</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">📍 ${f.address || 'Thanjavur Delta'}</p>
                    <p style="font-size: 0.85rem;">📞 Direct Phone: <a href="tel:${f.phone}"><strong>${f.phone}</strong></a></p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="openDonationModal('${f.name}')">❤️ Donate</button>
                    <button class="btn btn-danger btn-sm" onclick="unfollowFarmer('${f.username}')">Unfollow</button>
                </div>
            </div>
        `;
    });
}

// 8. Consumer Money Spent, Table Modal & Donations
function updateConsumerMoneySpent() {
    const total = state.consumerTransactions.reduce((acc, txn) => acc + txn.amount, 0);
    document.getElementById("consumerTotalSpent").textContent = `₹${total.toLocaleString()}`;
}

function openConsumerTransactionsModal() {
    const modal = document.getElementById("consumerTransactionsModal");
    const content = document.getElementById("consumerTransactionsContent");
    modal.classList.remove("hidden");

    if (state.consumerTransactions.length === 0) {
        content.innerHTML = `<p class="text-muted">No expenses recorded yet.</p>`;
        return;
    }

    content.innerHTML = `
        <table class="txn-table">
            <thead>
                <tr>
                    <th>Txn ID</th>
                    <th>Item / Purpose</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Money Spent (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${state.consumerTransactions.map(t => `
                    <tr>
                        <td><strong>${t.id}</strong></td>
                        <td>${t.item}</td>
                        <td>${t.date}</td>
                        <td><span class="badge ${t.type === 'Donation' ? 'btn-danger' : 'badge-gps'}">${t.type}</span></td>
                        <td style="font-weight: 700;">₹${t.amount.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function openDonationModal(farmerName) {
    document.getElementById("donateFarmerName").textContent = farmerName;
    document.getElementById("donateModal").classList.remove("hidden");
}

function executeFarmerDonation() {
    const amount = Number(document.getElementById("donateAmount").value);
    const donor = document.getElementById("donorName").value;
    const farmer = document.getElementById("donateFarmerName").textContent;

    if (amount <= 0) return;

    // 1. Add to farmer donations ledger
    state.donations.unshift({ donor, farmer, amount, message: "Direct Relief Fund" });

    // 2. Add to Consumer transactions table & update money spent
    state.consumerTransactions.unshift({
        id: `DON-${Math.floor(100 + Math.random() * 900)}`,
        item: `Kisan Relief to ${farmer}`,
        date: "Today",
        type: "Donation",
        amount
    });

    closeModal("donateModal");
    updateConsumerMoneySpent();
    renderFarmerDonations();
    showToast(`₹${amount} donated directly to ${farmer}! Recorded in expenses.`);
}

function renderFarmerDonations() {
    const list = document.getElementById("farmerDonationLedger");
    if (!list) return;
    list.innerHTML = "";
    state.donations.filter(d => d.farmer === state.user.name).forEach(d => {
        list.innerHTML += `
            <li>
                <span><strong>${d.donor}:</strong> "${d.message}"</span>
                <span style="color: var(--primary); font-weight:700;">+ ₹${d.amount}</span>
            </li>
        `;
    });
}

// 9. Consumer Marketplace & Cart
function renderConsumerMarketplace() {
    const grid = document.getElementById("consumerMarketGrid");
    grid.innerHTML = "";

    state.crops.forEach(crop => {
        grid.innerHTML += `
            <div class="crop-card">
                <div class="crop-image-wrapper">
                    ${crop.icon}
                    <span class="perish-badge" style="position: absolute; top: 10px; right: 10px;">⏳ ${crop.shelfLife}</span>
                </div>
                <div class="crop-card-body">
                    <h4>${translateProduce(crop.name)}</h4>
                    <p class="farmer-tag" style="font-size:0.85rem; color:var(--text-muted);">Farmer: <strong>${crop.farmer}</strong></p>
                    <p style="font-size:0.85rem;">📍 ${crop.location} (${crop.distance} km)</p>
                    <p style="font-size:0.85rem;">Available: <strong>${crop.qty} kg</strong></p>
                </div>
                <div class="crop-card-footer">
                    <span class="crop-price">₹${crop.price}/kg</span>
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${crop.id})">Add to Cart 🛒</button>
                </div>
            </div>
        `;
    });

    renderConsumerAuctions();
}

function renderNearbyMarketplace() {
    const grid = document.getElementById("nearbyProduceGrid");
    grid.innerHTML = "";

    state.crops.filter(c => c.distance <= 10).forEach(crop => {
        grid.innerHTML += `
            <div class="crop-card">
                <div class="crop-image-wrapper">
                    ${crop.icon}
                    <span class="badge badge-gps" style="position: absolute; top: 10px; left: 10px;">⚡ ${crop.distance} km away</span>
                    <span class="perish-badge" style="position: absolute; top: 10px; right: 10px;">⏳ ${crop.shelfLife}</span>
                </div>
                <div class="crop-card-body">
                    <h4>${translateProduce(crop.name)}</h4>
                    <p style="font-size:0.85rem;">Farmer: <strong>${crop.farmer}</strong></p>
                    <p style="font-size:0.85rem;">📞 Direct Call: ${crop.farmerPhone}</p>
                </div>
                <div class="crop-card-footer">
                    <span class="crop-price">₹${crop.price}/kg</span>
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${crop.id})">Direct Buy</button>
                </div>
            </div>
        `;
    });
}

function addToCart(cropId) {
    const crop = state.crops.find(c => c.id === cropId);
    if (crop.qty <= 0) {
        showToast("Crop is out of stock!");
        return;
    }

    crop.qty -= 1;
    state.consumerCart.push({ ...crop, cartQty: 1, unitPrice: crop.price });
    renderConsumerCart();
    renderConsumerMarketplace();
    showToast(`${crop.name} added to cart!`);
}

function renderConsumerCart() {
    const list = document.getElementById("cartItemsList");
    const count = document.getElementById("consumerCartCount");
    const valBadge = document.getElementById("consumerCartValue");
    const summary = document.getElementById("cartSummaryBlock");
    
    count.textContent = state.consumerCart.length;

    if (state.consumerCart.length === 0) {
        list.innerHTML = `<p class="text-muted">Your cart is empty.</p>`;
        summary.classList.add("hidden");
        valBadge.textContent = "₹0";
        return;
    }

    summary.classList.remove("hidden");
    let total = 0;
    list.innerHTML = "";

    state.consumerCart.forEach((item, index) => {
        total += item.price;
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8rem 0; border-bottom:1px solid var(--border);">
                <div>
                    <strong>${item.icon} ${translateProduce(item.name)}</strong>
                    <p style="font-size:0.85rem; color:var(--text-muted);">Qty: ${item.cartQty || 1} kg | Farmer: ${item.farmer}</p>
                </div>
                <div style="display:flex; align-items:center; gap:1rem;">
                    <span style="font-weight:700;">₹${item.price}</span>
                    <button class="btn btn-secondary btn-sm" onclick="removeFromCart(${index})">&times;</button>
                </div>
            </div>
        `;
    });

    valBadge.textContent = `₹${total}`;
    document.getElementById("cartSubtotal").textContent = `₹${total}`;
    document.getElementById("cartGrandTotal").textContent = `₹${total + 30}`;
}

function removeFromCart(index) {
    const item = state.consumerCart.splice(index, 1)[0];
    const originalCrop = state.crops.find(c => c.id === item.id);
    if (originalCrop) originalCrop.qty += (item.cartQty || 1);
    renderConsumerCart();
    renderConsumerMarketplace();
}

function openCheckoutModal() {
    document.getElementById("checkoutModal").classList.remove("hidden");
}

function processCheckoutPayment(e) {
    e.preventDefault();
    const address = document.getElementById("deliveryAddress").value;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    state.consumerCart.forEach(item => {
        const orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
        
        // 1. Add to consumer active orders
        state.consumerOrders.unshift({
            id: orderId,
            item: item.name,
            qty: item.cartQty || 1,
            price: item.price,
            farmer: item.farmer,
            icon: item.icon,
            status: "Dispatched",
            distanceAwayKm: 4.0,
            address
        });

        // 2. Add to farmer pending orders
        state.farmerOrders.unshift({
            id: orderId,
            farmerUsername: item.farmerUsername || "murugan_k",
            item: item.name,
            qty: item.cartQty || 1,
            total: item.price,
            buyer: state.user.name,
            address,
            phone: state.user.phone,
            status: "Pending"
        });

        // 3. Add to Consumer money spent transaction table
        state.consumerTransactions.unshift({
            id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
            item: `${item.name} (${item.cartQty || 1} kg)`,
            date: "Today",
            type: "Purchase",
            amount: item.price
        });
    });

    state.consumerCart = [];
    closeModal("checkoutModal");
    updateConsumerMoneySpent();
    renderConsumerCart();
    renderConsumerOrders();
    showTab("consumer-orders");
    showToast(`Order confirmed via ${method}!`);
}

function renderConsumerOrders() {
    const list = document.getElementById("consumerOrdersList");
    const count = document.getElementById("consumerOrderCount");
    if (!list) return;

    count.textContent = `${state.consumerOrders.length} Active`;
    list.innerHTML = "";

    if (state.consumerOrders.length === 0) {
        list.innerHTML = `<p class="text-muted">No active orders placed yet.</p>`;
        return;
    }

    state.consumerOrders.forEach(order => {
        list.innerHTML += `
            <div class="section-card" style="margin-bottom: 1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>${order.icon} ${translateProduce(order.item)} (${order.qty} kg)</h3>
                        <p style="font-size:0.9rem; color:var(--text-muted);">Farmer: <strong>${order.farmer}</strong></p>
                        <p style="font-size:0.9rem;">Paid: <strong>₹${order.price}</strong> | Status: <span class="badge badge-gps">${order.status}</span></p>
                    </div>
                    <button class="btn btn-primary" onclick="openLiveTrackingModal('${order.id}')">📍 Track Dispatch Live</button>
                </div>
            </div>
        `;
    });
}

function openLiveTrackingModal(id) {
    const modal = document.getElementById("navigationModal");
    modal.classList.remove("hidden");

    let dist = 4.0;
    const distEl = document.getElementById("navDistanceRemaining");
    const fillEl = document.getElementById("gpsProgressFill");

    const trackInterval = setInterval(() => {
        dist = Math.max(0.1, dist - 0.6);
        distEl.textContent = `${dist.toFixed(1)} km away`;
        fillEl.style.width = `${Math.min(100, (4.0 - dist) * 25)}%`;

        if (dist <= 0.2) {
            clearInterval(trackInterval);
            distEl.textContent = "Arrived at destination!";
            showToast("Farmer dispatch vehicle has arrived at your address!");
        }
    }, 1200);
}

// 10. AI Chat & Demand Tracker
function sendFarmerAIMessage() {
    const input = document.getElementById("aiUserInput");
    const query = input.value.trim();
    if (!query) return;

    const chatWindow = document.getElementById("aiChatWindow");
    chatWindow.innerHTML += `<div class="message user"><p>${query}</p></div>`;
    input.value = "";

    setTimeout(() => {
        let reply = "Current mandi rates in Thanjavur: Tomato is ₹32-36/kg, Paddy is ₹22/kg at DPC centers. Suggested auction base: ₹30/kg.";
        if (query.toLowerCase().includes("tomato")) {
            reply = "Tomatoes are high in demand this week. Recommended wholesale reserve: ₹30/kg for quick sales.";
        }
        chatWindow.innerHTML += `<div class="message ai"><p>${reply}</p></div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 600);
}

function renderDemandTracker() {
    const list = document.getElementById("demandRankList");
    if (!list) return;
    list.innerHTML = "";

    state.demandData.forEach((item, index) => {
        list.innerHTML += `
            <div class="demand-row">
                <div style="width: 100%;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>#${index + 1} ${translateProduce(item.crop)}</strong>
                        <span class="badge" style="background:#e0f2fe; color:#0369a1;">${item.tag}</span>
                    </div>
                    <div class="demand-bar">
                        <div class="demand-fill" style="width: ${item.score}%;"></div>
                    </div>
                </div>
            </div>
        `;
    });
}
// ==========================================================
// INDIVIDUAL FARMER RATING SYSTEM
// ==========================================================
let selectedFarmerRating = 0;
let currentRatingFarmer = "murugan_k";

function loadDefaultFarmerRating() {
    currentRatingFarmer = "murugan_k";
    selectedFarmerRating = 0;
    updateFarmerRating(currentRatingFarmer);
}

function setCurrentRatingFarmer(farmerUsername) {
    if (!farmerUsername) return;

    currentRatingFarmer = farmerUsername;
    selectedFarmerRating = 0;

    document.querySelectorAll("#ratingStars button").forEach(star => {
        star.classList.remove("selected");
    });

    const ratingText = document.getElementById("ratingText");

    if (ratingText) {
        ratingText.textContent = "Select a rating";
    }

    updateFarmerRating(farmerUsername);
}

function setFarmerRating(rating) {
    if (!currentRatingFarmer) {
        showToast("Please select a farmer first.");
        return;
    }

    selectedFarmerRating = rating;

    document.querySelectorAll("#ratingStars button").forEach((star, index) => {
        star.classList.toggle("selected", index < rating);
    });

    const ratingText = document.getElementById("ratingText");

    if (ratingText) {
        ratingText.textContent = `${rating} out of 5 stars`;
    }
}

function submitFarmerRating() {
    if (!currentRatingFarmer) {
        showToast("Farmer profile not selected.");
        return;
    }

    if (selectedFarmerRating === 0) {
        showToast("Please select a rating first.");
        return;
    }

    let allRatings = JSON.parse(
        localStorage.getItem("farmerRatings") || "{}"
    );

    if (!allRatings[currentRatingFarmer]) {
        allRatings[currentRatingFarmer] = [];
    }

    allRatings[currentRatingFarmer].push({
        rating: selectedFarmerRating,
        ratedBy: state.user ? state.user.username : "guest",
        date: new Date().toISOString()
    });

    localStorage.setItem(
        "farmerRatings",
        JSON.stringify(allRatings)
    );

    updateFarmerRating(currentRatingFarmer);

    showToast("Thank you! Your rating has been submitted.");

    selectedFarmerRating = 0;

    document.querySelectorAll("#ratingStars button").forEach(star => {
        star.classList.remove("selected");
    });

    const ratingText = document.getElementById("ratingText");

    if (ratingText) {
        ratingText.textContent = "Select a rating";
    }
}

function updateFarmerRating(farmerUsername) {
    const allRatings = JSON.parse(
        localStorage.getItem("farmerRatings") || "{}"
    );

    const ratings = allRatings[farmerUsername] || [];

    const ratingElement =
        document.getElementById("farmerOverallRating");

    const countElement =
        document.getElementById("farmerRatingCount");

    if (!ratingElement || !countElement) return;

    if (ratings.length === 0) {
        ratingElement.textContent = "No ratings ★";
        countElement.textContent = "0";
        return;
    }

    const total = ratings.reduce(
        (sum, item) => sum + Number(item.rating),
        0
    );

    const average = total / ratings.length;

    ratingElement.textContent =
        `${average.toFixed(1)} ★`;

    countElement.textContent =
        ratings.length;
}
function askFarmerQuestion(question) {
    const input = document.getElementById("aiUserInput");
    input.value = question;
    sendFarmerAIMessage();
}
// 11. Multi-Language Engine & Dynamic Name Translation
function translateProduce(name) {
    if (currentLang === 'en' || !cropDictionary[name]) return name;
    return cropDictionary[name][currentLang] || name;
}

function changeLanguage(lang) {
    currentLang = lang;
    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });

    // Re-render views to apply translations across produce cards & demand items
    if (state.user) {
        if (state.user.role === 'farmer') renderFarmerDashboard();
        else {
            renderConsumerMarketplace();
            renderNearbyMarketplace();
            renderConsumerCart();
            renderConsumerOrders();
        }
    }
    renderDemandTracker();
    showToast(`Language switched to ${lang === 'ta' ? 'தமிழ்' : lang === 'hi' ? 'हिन्दी' : 'English'}`);
}

// 12. Modal Helpers & Toast
function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

function showToast(msg) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    loadDefaultFarmerRating();
});