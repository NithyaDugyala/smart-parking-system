const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const message = document.getElementById("message");
const slotsContainer = document.getElementById("slotsContainer");
const availableCount = document.getElementById("availableCount");
const occupiedCount = document.getElementById("occupiedCount");
const totalCount = document.getElementById("totalCount");

const users = [
  { username: "admin", password: "1234" },
  { username: "nithya", password: "1111" },
  { username: "akshaya", password: "2222" }
];

const TOTAL_SLOTS = 10;
const BASE_PRICE = 20;
const FREE_MINUTES = 1;
const EXTRA_PER_MINUTE = 5;

let currentUser = null;
let timerInterval = null;

function getSlots() {
  const savedSlots = localStorage.getItem("smartParkingSlots");

  if (savedSlots) {
    return JSON.parse(savedSlots);
  }

  const initialSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    id: i + 1,
    status: "available",
    bookedAt: null,
    bookedBy: null
  }));

  localStorage.setItem("smartParkingSlots", JSON.stringify(initialSlots));
  return initialSlots;
}

function saveSlots(slots) {
  localStorage.setItem("smartParkingSlots", JSON.stringify(slots));
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const foundUser = users.find(
    (user) => user.username === username && user.password === password
  );

  if (foundUser) {
    currentUser = foundUser;
    message.innerText = "";
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    loadSlots();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(loadSlots, 1000);
  } else {
    message.innerText = "Invalid username or password";
  }
}

function logout() {
  currentUser = null;
  dashboardSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  message.innerText = "";

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatDuration(bookedAt) {
  const start = new Date(bookedAt).getTime();
  const now = new Date().getTime();
  const diff = Math.floor((now - start) / 1000);

  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function calculatePrice(bookedAt) {
  const start = new Date(bookedAt).getTime();
  const now = new Date().getTime();
  const totalMinutes = Math.floor((now - start) / 60000);

  let price = BASE_PRICE;

  if (totalMinutes > FREE_MINUTES) {
    price += (totalMinutes - FREE_MINUTES) * EXTRA_PER_MINUTE;
  }

  return price;
}

function loadSlots() {
  const slots = getSlots();
  slotsContainer.innerHTML = "";

  let available = 0;
  let occupied = 0;

  slots.forEach((slot) => {
    if (slot.status === "available") {
      available++;
    } else {
      occupied++;
    }

    const slotCard = document.createElement("div");
    slotCard.className = `slot ${slot.status}`;

    const title = document.createElement("div");
    title.className = "slot-title";
    title.innerText = `Slot ${slot.id}`;

    const status = document.createElement("div");
    status.className = "slot-status";
    status.innerText = slot.status === "available" ? "Available" : "Occupied";

    const time = document.createElement("div");
    time.className = "slot-time";

    if (slot.status === "available") {
      time.innerText = "Click Book Slot";
      slotCard.addEventListener("click", () => bookSlot(slot.id));
    } else {
      const timer = formatDuration(slot.bookedAt);
      const price = calculatePrice(slot.bookedAt);
      const bookedBy = slot.bookedBy || "Unknown";

      time.innerText =
        `Booked by: ${bookedBy}\n` +
        `Timer: ${timer}\n` +
        `Price: ₹${price}`;

      if (currentUser && currentUser.username === slot.bookedBy) {
        const releaseBtn = document.createElement("button");
        releaseBtn.innerText = "Release Slot";
        releaseBtn.className = "release-btn";

        releaseBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          releaseSlot(slot.id);
        });

        slotCard.appendChild(title);
        slotCard.appendChild(status);
        slotCard.appendChild(time);
        slotCard.appendChild(releaseBtn);
      } else {
        const lockText = document.createElement("div");
        lockText.className = "slot-time";
        lockText.innerText = "Only booked user can release";

        slotCard.appendChild(title);
        slotCard.appendChild(status);
        slotCard.appendChild(time);
        slotCard.appendChild(lockText);
      }

      slotsContainer.appendChild(slotCard);
      return;
    }

    slotCard.appendChild(title);
    slotCard.appendChild(status);
    slotCard.appendChild(time);
    slotsContainer.appendChild(slotCard);
  });

  totalCount.innerText = TOTAL_SLOTS;
  availableCount.innerText = available;
  occupiedCount.innerText = occupied;
}

function bookSlot(id) {
  const slots = getSlots();

  const updatedSlots = slots.map((slot) => {
    if (slot.id === id && slot.status === "available") {
      return {
        ...slot,
        status: "occupied",
        bookedAt: new Date().toISOString(),
        bookedBy: currentUser ? currentUser.username : null
      };
    }
    return slot;
  });

  saveSlots(updatedSlots);
  loadSlots();
}

function releaseSlot(id) {
  const slots = getSlots();

  const updatedSlots = slots.map((slot) => {
    if (
      slot.id === id &&
      slot.status === "occupied" &&
      currentUser &&
      slot.bookedBy === currentUser.username
    ) {
      return {
        ...slot,
        status: "available",
        bookedAt: null,
        bookedBy: null
      };
    }
    return slot;
  });

  saveSlots(updatedSlots);
  loadSlots();
}

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);