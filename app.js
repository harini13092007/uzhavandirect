
// Sample initial data
let crops = [
    { name: "Ponni Rice", price: 55, location: "Thanjavur", qty: 200 },
    { name: "Country Tomatoes", price: 30, location: "Salem", qty: 80 },
    { name: "Organic Turmeric", price: 120, location: "Erode", qty: 50 }
];

const productGrid = document.getElementById("productGrid");
const cropForm = document.getElementById("cropForm");

// Function to render cards
function renderCrops() {
    productGrid.innerHTML = "";
    crops.forEach((crop) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${crop.name}</h3>
            <p>📍 Location: ${crop.location}</p>
            <p>📦 Quantity: ${crop.qty} kg</p>
            <p class="price">₹${crop.price} / kg</p>
        `;
        productGrid.appendChild(card);
    });
}

// Handle new crop submission
cropForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const newCrop = {
        name: document.getElementById("cropName").value,
        price: Number(document.getElementById("cropPrice").value),
        location: document.getElementById("farmerLocation").value,
        qty: Number(document.getElementById("cropQty").value)
    };

    crops.unshift(newCrop);
    renderCrops();
    cropForm.reset();
});

// Initial render on load
renderCrops();