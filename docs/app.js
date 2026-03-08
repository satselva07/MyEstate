const properties = [
  {
    id: "p1",
    name: "Radha Illam",
    city: "Chennai",
    pricePerNight: 4500,
    facilities: ["2 Bedrooms", "WiFi", "Private Parking", "Kitchen"],
    address:
      "VJD's Mitra, 22, EB Colony 2nd St, Vel Nagar, Radha Nagar, Adambakkam, Chennai, Tamil Nadu 600042",
  },
  {
    id: "p2",
    name: "Neithal Homes",
    city: "Puducherry",
    pricePerNight: 7500,
    facilities: ["2 Bedrooms", "WiFi", "Kitchen", "Family Friendly"],
    address: "No.31 Nehru bazzar Chinnasubbrayapillai street, Puducherry, 605001",
  },
  {
    id: "p3",
    name: "Marutham Farms",
    city: "Puducherry",
    pricePerNight: 4500,
    facilities: ["Farm Stay", "2 Bedrooms", "WiFi", "Parking"],
    address: "Ariyankuppam, Puducherry",
  },
  {
    id: "p4",
    name: "Kurunji Retreat",
    city: "Kodaikkanal",
    pricePerNight: 15000,
    facilities: ["3 Bedrooms", "Mountain View", "WiFi", "Parking"],
    address: "Pethuparai Village, Villpatti, Kodaikkanal",
  },
];

const ui = {
  cityFilter: document.getElementById("cityFilter"),
  propertiesList: document.getElementById("propertiesList"),
  bookingForm: document.getElementById("bookingForm"),
  propertyId: document.getElementById("propertyId"),
  checkIn: document.getElementById("checkIn"),
  checkOut: document.getElementById("checkOut"),
  guestName: document.getElementById("guestName"),
  guestPhone: document.getElementById("guestPhone"),
  guestEmail: document.getElementById("guestEmail"),
  bookingNote: document.getElementById("bookingNote"),
  bookingMessage: document.getElementById("bookingMessage"),
  inquiryForm: document.getElementById("inquiryForm"),
  inqName: document.getElementById("inqName"),
  inqPhone: document.getElementById("inqPhone"),
  inqEmail: document.getElementById("inqEmail"),
  inqMessage: document.getElementById("inqMessage"),
  inquiryMessage: document.getElementById("inquiryMessage"),
};

function message(target, text, type = "") {
  target.textContent = text;
  target.className = `muted ${type}`.trim();
}

function sanitize(value) {
  return String(value || "").trim();
}

function isDateRangeValid(start, end) {
  if (!start || !end) return false;
  return new Date(start) < new Date(end);
}

function getSupabaseClient() {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
  return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
}

function renderProperties(city = "All Cities") {
  const filtered = city === "All Cities" ? properties : properties.filter((p) => p.city === city);
  ui.propertiesList.innerHTML = "";

  filtered.forEach((property) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${property.name}</h3>
      <p>${property.city} • ₹${property.pricePerNight}/night</p>
      <p>${property.facilities.join(" • ")}</p>
      <p>${property.address}</p>
    `;
    ui.propertiesList.appendChild(card);
  });
}

function initFilters() {
  const cities = ["All Cities", ...new Set(properties.map((p) => p.city))];
  ui.cityFilter.innerHTML = "";
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    ui.cityFilter.appendChild(option);
  });

  ui.cityFilter.addEventListener("change", () => {
    renderProperties(ui.cityFilter.value);
  });
}

function initPropertySelect() {
  ui.propertyId.innerHTML = "";
  properties.forEach((property) => {
    const option = document.createElement("option");
    option.value = property.id;
    option.textContent = `${property.name} (${property.city})`;
    ui.propertyId.appendChild(option);
  });
}

async function submitBooking(event) {
  event.preventDefault();
  message(ui.bookingMessage, "Submitting...");

  const payload = {
    property_id: sanitize(ui.propertyId.value),
    guest_name: sanitize(ui.guestName.value),
    guest_phone: sanitize(ui.guestPhone.value),
    guest_email: sanitize(ui.guestEmail.value),
    check_in: sanitize(ui.checkIn.value),
    check_out: sanitize(ui.checkOut.value),
    notes: sanitize(ui.bookingNote.value),
    status: "pending",
  };

  if (!payload.notes) {
    message(ui.bookingMessage, "Please enter booking comments.", "err");
    return;
  }

  if (!isDateRangeValid(payload.check_in, payload.check_out)) {
    message(ui.bookingMessage, "Check-out must be after check-in.", "err");
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    message(
      ui.bookingMessage,
      "Supabase config missing. Create config.js from config.example.js.",
      "err"
    );
    return;
  }

  const { error } = await supabase.from("bookings").insert(payload);
  if (error) {
    if (
      String(error.message || "").includes("bookings_no_overlap") ||
      String(error.message || "").toLowerCase().includes("overlap")
    ) {
      message(
        ui.bookingMessage,
        "This property is already booked for overlapping dates. Choose different dates.",
        "err"
      );
      return;
    }

    message(ui.bookingMessage, error.message || "Booking failed.", "err");
    return;
  }

  ui.bookingForm.reset();
  message(ui.bookingMessage, "Booking request submitted successfully.", "ok");
}

async function submitInquiry(event) {
  event.preventDefault();
  message(ui.inquiryMessage, "Submitting...");

  const payload = {
    name: sanitize(ui.inqName.value),
    email: sanitize(ui.inqEmail.value),
    phone: sanitize(ui.inqPhone.value),
    message: sanitize(ui.inqMessage.value),
  };

  if (!payload.message) {
    message(ui.inquiryMessage, "Please enter your query details.", "err");
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    message(
      ui.inquiryMessage,
      "Supabase config missing. Create config.js from config.example.js.",
      "err"
    );
    return;
  }

  const { error } = await supabase.from("inquiries").insert(payload);
  if (error) {
    message(ui.inquiryMessage, error.message || "Query submission failed.", "err");
    return;
  }

  ui.inquiryForm.reset();
  message(ui.inquiryMessage, "Query submitted. We will reach you soon.", "ok");
}

function init() {
  initFilters();
  initPropertySelect();
  renderProperties();

  ui.bookingForm.addEventListener("submit", submitBooking);
  ui.inquiryForm.addEventListener("submit", submitInquiry);
}

init();
