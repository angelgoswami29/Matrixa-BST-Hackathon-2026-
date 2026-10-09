const seed = [
  {
    id: "1", name: "Ananya Rao", initials: "AR", rating: 4.8,
    pickup: "Rajajinagar", destination: "Global Village",
    time: "08:30", date: "2026-10-12",
    seats: 3, total: 480, recurring: true,
    note: "Weekday commute.",
    route: ["Rajajinagar", "Vijayanagar", "Global Village"]
  },
  {
    id: "2", name: "Karthik Menon", initials: "KM", rating: 4.6,
    pickup: "Vijayanagar", destination: "Global Village",
    time: "08:45", date: "2026-10-12",
    seats: 2, total: 420, recurring: false,
    note: "Pickup near the main bus stop.",
    route: ["Vijayanagar", "Attiguppe", "Global Village"]
  },
  {
    id: "3", name: "Priya Shetty", initials: "PS", rating: 4.7,
    pickup: "Malleshwaram", destination: "Global Village",
    time: "09:15", date: "2026-10-12",
    seats: 3, total: 520, recurring: false,
    note: "AC hatchback, no smoking.",
    route: ["Malleshwaram", "Majestic", "Global Village"]
  },
  {
    id: "4", name: "Rahul Gowda", initials: "RG", rating: 4.9,
    pickup: "RR Nagar", destination: "Malleshwaram",
    time: "07:50", date: "2026-10-12",
    seats: 1, total: 360, recurring: false,
    note: "Can stop near the metro.",
    route: ["RR Nagar", "Vijayanagar", "Malleshwaram"]
  },
  {
    id: "5", name: "Sneha Iyer", initials: "SI", rating: 4.8,
    pickup: "Rajajinagar", destination: "Electronic City",
    time: "08:00", date: "2026-10-12",
    seats: 2, total: 640, recurring: true,
    note: "Weekday commute.",
    route: ["Rajajinagar", "Majestic", "Electronic City"]
  },
  {
    id: "6", name: "Vikram Hegde", initials: "VH", rating: 4.5,
    pickup: "Jayanagar", destination: "Global Village",
    time: "18:10", date: "2026-10-12",
    seats: 3, total: 450, recurring: false,
    note: "Evening commute.",
    route: ["Jayanagar", "Banashankari", "Global Village"]
  }
];

const KEY = "waylo_rides_demo";
const REQ = "waylo_requests_demo";

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value)
      ? value
      : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

let rides = load(KEY, seed);
let requests = load(REQ, []);
let toastTimer;

function save() {
  localStorage.setItem(KEY, JSON.stringify(rides));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function period(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes;

  if (total < 660) return "morning";
  if (total < 960) return "midday";
  return "evening";
}

function fmtDate(date) {
  if (!date) return "Date flexible";

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day)
    .toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
}

function score(ride, pickup, destination, time) {
  let result = 0;

  const route = [
    ride.pickup,
    ...(ride.route || []),
    ride.destination
  ].join(" ").toLowerCase();

  result += !pickup
    ? 25
    : route.includes(pickup.toLowerCase()) ? 40 : 5;

  result += !destination
    ? 25
    : route.includes(destination.toLowerCase()) ? 40 : 5;

  result += time === "any" || period(ride.time) === time
    ? 25
    : 5;

  return Math.min(99, result);
}

function render(list = rides) {
  const available = list.filter(ride => ride.seats > 0);

  document.querySelector("#rides").innerHTML =
    available.map(ride => {
      const share = Math.round(
        ride.total / (ride.seats + 1)
      );

      const match = ride.match ?? score(ride, "", "", "any");

      return `
        <article class="ride">
          <div class="ride-top">
            <span class="avatar">
              ${esc(ride.initials || ride.name.slice(0, 2).toUpperCase())}
            </span>

            <div class="driver">
              <b>${esc(ride.name)}</b>
              <small>Sample profile · not verified</small>
            </div>

            <span class="rating">
              ★ ${Number(ride.rating || 4.8).toFixed(1)} sample
            </span>
          </div>

          <div class="route">
            <div class="route-dots">
              <i></i><span></span><i></i>
            </div>

            <div class="route-text">
              <div>
                <b>From ${esc(ride.pickup)}</b>
                <small>Pickup area</small>
              </div>

              <div>
                <b>To ${esc(ride.destination)}</b>
                <small>
                  ${esc(ride.time)} · ${fmtDate(ride.date)}
                  ${ride.recurring ? " · Recurring" : ""}
                </small>
              </div>
            </div>
          </div>

          <div class="tags">
            <span class="tag match">${match}% match</span>
            <span class="tag">
              ${ride.seats} seat${ride.seats === 1 ? "" : "s"} open
            </span>
            ${ride.recurring
              ? '<span class="tag">Recurring</span>'
              : ""}
          </div>

          ${ride.note
            ? `<div class="note">“${esc(ride.note)}”</div>`
            : ""}

          <div class="ride-bottom">
            <div>
              <small>Est. share at full occupancy</small>
              <b class="price">₹${share}</b>
              <small>
                ₹${ride.total} total ÷ ${ride.seats + 1} people
              </small>
            </div>

            <button class="request" data-request="${esc(ride.id)}">
              Request seat →
            </button>
          </div>
        </article>
      `;
    }).join("");

  document.querySelector("#empty")
    .classList.toggle("hidden", available.length > 0);

  document.querySelector("#rideCount").textContent =
    available.length;

  document.querySelector("#seatCount").textContent =
    available.reduce((sum, ride) => sum + ride.seats, 0);

  const average = available.length
    ? Math.round(
        available.reduce(
          (sum, ride) => sum + ride.total / (ride.seats + 1),
          0
        ) / available.length
      )
    : 0;

  document.querySelector("#avg").textContent = "₹" + average;

  document.querySelector("#resultsText").textContent =
    `${available.length} ride${available.length === 1 ? "" : "s"} available · illustrative demo listings`;
}

function search(event) {
  if (event) event.preventDefault();

  const pickup = document.querySelector("#pickup").value.trim();
  const destination =
    document.querySelector("#destination").value.trim();

  const date = document.querySelector("#date").value;
  const time = document.querySelector("#time").value;
  const seats = Number(document.querySelector("#seats").value);

  const results = rides
    .filter(ride =>
      ride.seats >= seats &&
      (!date || !ride.date || ride.date === date) &&
      (!pickup ||
        [ride.pickup, ...(ride.route || [])]
          .join(" ").toLowerCase().includes(pickup.toLowerCase())) &&
      (!destination ||
        [ride.destination, ...(ride.route || [])]
          .join(" ").toLowerCase().includes(destination.toLowerCase())) &&
      (time === "any" || period(ride.time) === time)
    )
    .map(ride => ({
      ...ride,
      match: score(ride, pickup, destination, time)
    }))
    .sort((a, b) => b.match - a.match);

  render(results);
}

function toast(message) {
  const element = document.querySelector("#toast");

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2700);
}

// Search form
document.querySelector("#searchForm")
  .addEventListener("submit", search);

// Example route buttons
document.querySelectorAll("[data-p]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector("#pickup").value = button.dataset.p;
    document.querySelector("#destination").value = button.dataset.d;
    search();
  });
});

// Reset demo data
document.querySelector("#reset").addEventListener("click", () => {
  rides = structuredClone(seed);
  requests = [];

  localStorage.removeItem(KEY);
  localStorage.removeItem(REQ);

  document.querySelector("#searchForm").reset();

  render();
  renderRequests();
  toast("Demo data reset.");
});

// Cost calculator
function calc() {
  const cost = Math.max(
    0,
    Number(document.querySelector("#cost").value) || 0
  );

  const people = Math.max(
    1,
    Number(document.querySelector("#people").value) || 1
  );

  document.querySelector("#share").textContent =
    "₹" + (cost / people).toFixed(2).replace(/\.00$/, "");

  document.querySelector("#math").textContent =
    `₹${cost} ÷ ${people} people`;
}

document.querySelector("#cost").addEventListener("input", calc);
document.querySelector("#people").addEventListener("change", calc);

// Offer ride cost preview
function offerPreview() {
  const cost = Number(
    document.querySelector("#offerCost").value
  ) || 0;

  const seats = Number(
    document.querySelector("#offerSeats").value
  ) || 1;

  document.querySelector("#preview").textContent =
    `Full car: ₹${Math.round(cost / (seats + 1))} each`;
}

document.querySelector("#offerCost")
  .addEventListener("input", offerPreview);

document.querySelector("#offerSeats")
  .addEventListener("input", offerPreview);

// Publish a ride
document.querySelector("#offerForm")
  .addEventListener("submit", event => {
    event.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const pickup = document.querySelector("#from").value.trim();
    const destination = document.querySelector("#to").value.trim();
    const date = document.querySelector("#offerDate").value;
    const time = document.querySelector("#offerTime").value;
    const seats = Number(document.querySelector("#offerSeats").value);
    const total = Number(document.querySelector("#offerCost").value);
    const note = document.querySelector("#note").value.trim();

    if (
      !name || !pickup || !destination || !date || !time ||
      seats < 1 || total <= 0
    ) {
      document.querySelector("#offerMsg").textContent =
        "Please check all fields and enter valid values.";
      return;
    }

    rides.unshift({
      id: "custom" + Date.now(),
      name,
      initials: name.split(/\s+/)
        .map(part => part[0]).join("").slice(0, 2).toUpperCase(),
      rating: 5,
      pickup,
      destination,
      date,
      time,
      seats,
      total,
      note,
      recurring: document.querySelector("#recurring").checked,
      route: [pickup, destination]
    });

    save();
    render();

    document.querySelector("#offerMsg").textContent =
      "Ride published! It now appears in the ride list.";

    event.target.reset();

    document.querySelector("#offerTime").value = "08:30";
    document.querySelector("#offerSeats").value = 3;
    document.querySelector("#offerCost").value = 480;

    offerPreview();
    toast("Demo ride published.");

    document.querySelector("#find")
      .scrollIntoView({ behavior: "smooth" });
  });

// Request a seat
document.querySelector("#rides").addEventListener("click", event => {
  const button = event.target.closest("[data-request]");
  if (!button) return;

  const ride = rides.find(item => item.id === button.dataset.request);

  if (!ride || ride.seats < 1) {
    toast("No seats available.");
    return;
  }

  const person = prompt(
    `Request a demo seat with ${ride.name}\n` +
    `${ride.pickup} → ${ride.destination}\n` +
    `Departure: ${ride.time}\n` +
    `Estimated share: ₹${Math.round(ride.total / (ride.seats + 1))}\n\n` +
    "Enter your name:"
  );

  if (!person || !person.trim()) return;

  if (requests.some(item =>
    item.rideId === ride.id &&
    item.person.toLowerCase() === person.trim().toLowerCase()
  )) {
    toast("You already requested this demo ride.");
    return;
  }

  ride.seats--;

  requests.unshift({
    id: "q" + Date.now(),
    rideId: ride.id,
    person: person.trim(),
    pickup: ride.pickup,
    destination: ride.destination,
    time: ride.time
  });

  localStorage.setItem(REQ, JSON.stringify(requests));
  save();

  render();
  renderRequests();

  toast("Demo seat request recorded locally.");
});

// Display requests
function renderRequests() {
  const box = document.querySelector("#requests");

  if (!requests.length) {
    box.className = "request-empty";
    box.textContent =
      "No requests yet. Search for a ride and tap “Request seat”.";
    return;
  }

  box.className = "";

  box.innerHTML = requests.map(request => `
    <div class="request-item">
      <span class="avatar">✓</span>

      <div>
        <b>${esc(request.pickup)} → ${esc(request.destination)}</b>
        <small>
          Requested by ${esc(request.person)} ·
          ${esc(request.time)} · demo only
        </small>
      </div>

      <button data-cancel="${esc(request.id)}">Cancel</button>
    </div>
  `).join("");
}

// Cancel a request
document.querySelector("#requests")
  .addEventListener("click", event => {
    const button = event.target.closest("[data-cancel]");
    if (!button) return;

    const index = requests.findIndex(
      item => item.id === button.dataset.cancel
    );

    const request = requests.splice(index, 1)[0];

    if (request) {
      const ride = rides.find(item => item.id === request.rideId);
      if (ride) ride.seats++;
    }

    localStorage.setItem(REQ, JSON.stringify(requests));
    save();

    renderRequests();
    render();

    toast("Demo request cancelled.");
  });

// Demo report button
document.querySelector("#reportBtn").addEventListener("click", () => {
  const count =
    Number(localStorage.getItem("waylo_reports") || 0) + 1;

  localStorage.setItem("waylo_reports", count);

  document.querySelector("#reports").textContent = count;

  toast("Concern recorded on this device only. No authority was contacted.");
});

// Set dates and initial values
const today = new Date();

const localDate = new Date(
  today.getTime() - today.getTimezoneOffset() * 60000
).toISOString().slice(0, 10);

document.querySelector("#date").value = "2026-10-12";
document.querySelector("#offerDate").value = localDate;

document.querySelector("#reports").textContent =
  localStorage.getItem("waylo_reports") || "0";

calc();
offerPreview();
render();
renderRequests();