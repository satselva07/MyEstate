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
  availabilityGrid: document.getElementById("availabilityGrid"),
  availabilityNote: document.getElementById("availabilityNote"),
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

const availabilityState = {
  blockedRanges: [],
  checkInPicker: null,
  checkOutPicker: null,
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

function toDateOnly(value) {
  return new Date(`${value}T00:00:00`);
}

function dateToKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateBlocked(dateKey, ranges) {
  const day = toDateOnly(dateKey);
  return ranges.some((range) => {
    const start = toDateOnly(range.check_in);
    const end = toDateOnly(range.check_out);
    return day >= start && day < end;
  });
}

function updatePickersAvailability() {
  const pickerConfig = {
    disable: [(dateObj) => isDateBlocked(dateToKey(dateObj), availabilityState.blockedRanges)],
    onDayCreate: (_dObj, _dStr, _fp, dayElem) => {
      const dateObj = dayElem.dateObj;
      if (!dateObj) return;

      const dateKey = dateToKey(dateObj);
      dayElem.classList.remove("available-date", "full-date");
      if (isDateBlocked(dateKey, availabilityState.blockedRanges)) {
        dayElem.classList.add("full-date");
      } else {
        dayElem.classList.add("available-date");
      }
    },
  };

  if (availabilityState.checkInPicker) {
    availabilityState.checkInPicker.set("disable", pickerConfig.disable);
    availabilityState.checkInPicker.set("onDayCreate", pickerConfig.onDayCreate);
    availabilityState.checkInPicker.redraw();
  }

  if (availabilityState.checkOutPicker) {
    availabilityState.checkOutPicker.set("disable", pickerConfig.disable);
    availabilityState.checkOutPicker.set("onDayCreate", pickerConfig.onDayCreate);
    availabilityState.checkOutPicker.redraw();
  }
}

function initDatePickers() {
  if (!window.flatpickr) return;

  const baseOptions = {
    dateFormat: "Y-m-d",
    minDate: "today",
    disableMobile: true,
  };

  availabilityState.checkInPicker = window.flatpickr(ui.checkIn, {
    ...baseOptions,
    onChange: (_selectedDates, dateStr) => {
      if (availabilityState.checkOutPicker) {
        availabilityState.checkOutPicker.set("minDate", dateStr || "today");
      }
      validateSelectedRange();
    },
  });

  availabilityState.checkOutPicker = window.flatpickr(ui.checkOut, {
    ...baseOptions,
    onChange: () => {
      validateSelectedRange();
    },
  });
}

function hasRangeConflict(startDate, endDate, ranges) {
  if (!startDate || !endDate) return false;

  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  return ranges.some((range) => {
    const rangeStart = toDateOnly(range.check_in);
    const rangeEnd = toDateOnly(range.check_out);
    return start < rangeEnd && end > rangeStart;
  });
}

function renderAvailabilityGrid(ranges) {
  if (!ui.availabilityGrid) return;
  const daysToShow = 21;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  ui.availabilityGrid.innerHTML = "";
  for (let offset = 0; offset < daysToShow; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    const dayKey = toDateKey(day);
    const isBlocked = isDateBlocked(dayKey, ranges);

    const node = document.createElement("div");
    node.className = `availability-day ${isBlocked ? "full" : "available"}`;
    node.textContent = `${day.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · ${isBlocked ? "Full" : "Open"}`;
    ui.availabilityGrid.appendChild(node);
  }
}

function validateSelectedRange() {
  const checkIn = sanitize(ui.checkIn.value);
  const checkOut = sanitize(ui.checkOut.value);
  if (!checkIn || !checkOut) {
    message(ui.availabilityNote, "Choose check-in and check-out to validate availability.");
    return false;
  }

  if (hasRangeConflict(checkIn, checkOut, availabilityState.blockedRanges)) {
    message(
      ui.availabilityNote,
      "Selected range includes full dates for this property. Please choose different dates.",
      "err"
    );
    return true;
  }

  message(ui.availabilityNote, "Selected range is available.", "ok");
  return false;
}

async function refreshAvailability() {
  const propertyId = sanitize(ui.propertyId.value);
  if (!propertyId) return;

  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    availabilityState.blockedRanges = [];
    renderAvailabilityGrid([]);
    message(ui.availabilityNote, "Live availability unavailable. Booking validation still works at submit.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("booked_ranges")
    .select("check_in, check_out")
    .eq("property_id", propertyId)
    .order("check_in", { ascending: true });

  if (error) {
    availabilityState.blockedRanges = [];
    renderAvailabilityGrid([]);
    message(ui.availabilityNote, "Availability preview unavailable right now.", "err");
    return;
  }

  availabilityState.blockedRanges = Array.isArray(data) ? data : [];
  renderAvailabilityGrid(availabilityState.blockedRanges);
  updatePickersAvailability();

  if (!availabilityState.blockedRanges.length) {
    message(ui.availabilityNote, "All upcoming dates appear available for this property.", "ok");
  } else {
    message(ui.availabilityNote, "Red dates are fully booked. Green dates are available.");
  }

  validateSelectedRange();
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

  if (hasRangeConflict(payload.check_in, payload.check_out, availabilityState.blockedRanges)) {
    message(
      ui.bookingMessage,
      "This property is sold out for one or more selected dates. Please choose different dates.",
      "err"
    );
    return;
  }

  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    message(
      ui.bookingMessage,
      "Supabase config missing. Create config.js from config.example.js.",
      "err"
    );
    return;
  }

  const { error } = await supabaseClient.from("bookings").insert(payload);
  if (error) {
    const errorMessage = String(error.message || "");
    const errorMessageLower = errorMessage.toLowerCase();

    if (
      String(error.code || "") === "23P01" ||
      errorMessage.includes("bookings_no_overlap") ||
      errorMessageLower.includes("overlap") ||
      errorMessageLower.includes("conflicting key value violates exclusion constraint") ||
      errorMessageLower.includes("violates row-level security policy")
    ) {
      message(
        ui.bookingMessage,
        "This property is sold out for one or more selected dates. Please choose different dates.",
        "err"
      );
      return;
    }

    message(ui.bookingMessage, errorMessage || "Booking failed.", "err");
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

  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    message(
      ui.inquiryMessage,
      "Supabase config missing. Create config.js from config.example.js.",
      "err"
    );
    return;
  }

  const { error } = await supabaseClient.from("inquiries").insert(payload);
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
  initDatePickers();

  ui.propertyId.addEventListener("change", refreshAvailability);
  ui.checkIn.addEventListener("change", validateSelectedRange);
  ui.checkOut.addEventListener("change", validateSelectedRange);

  ui.bookingForm.addEventListener("submit", submitBooking);
  ui.inquiryForm.addEventListener("submit", submitInquiry);

  refreshAvailability();
}

init();
