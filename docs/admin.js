const ui = {
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminEmail: document.getElementById("adminEmail"),
  adminPassword: document.getElementById("adminPassword"),
  logoutBtn: document.getElementById("logoutBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  authMessage: document.getElementById("authMessage"),
  adminData: document.getElementById("adminData"),
  bookingsBody: document.getElementById("bookingsBody"),
  inquiriesBody: document.getElementById("inquiriesBody"),
};

const propertyNameById = {
  p1: "Radha Illam",
  p2: "Neithal Homes",
  p3: "Marutham Farms",
  p4: "Kurunji Retreat",
};

function setMessage(text, type = "") {
  ui.authMessage.textContent = text;
  ui.authMessage.className = `muted ${type}`.trim();
}

function fmt(value) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSupabaseClient() {
  const cfg = window.APP_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
  return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
}

const supabase = getSupabaseClient();

function setSignedInUI(isSignedIn) {
  ui.adminData.classList.toggle("hidden", !isSignedIn);
  ui.logoutBtn.classList.toggle("hidden", !isSignedIn);
}

async function loadBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, created_at, property_id, check_in, check_out, guest_name, guest_phone, guest_email, status, notes")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw error;

  ui.bookingsBody.innerHTML = "";
  if (!data?.length) {
    ui.bookingsBody.innerHTML = '<tr><td colspan="9">No bookings found.</td></tr>';
    return;
  }

  const actionOptions = ["pending", "confirmed", "cancelled"];

  data.forEach((row) => {
    const tr = document.createElement("tr");
    const selectedStatus = String(row.status || "pending").toLowerCase();
    const options = actionOptions
      .map((status) => {
        const selected = status === selectedStatus ? "selected" : "";
        return `<option value="${status}" ${selected}>${status}</option>`;
      })
      .join("");

    tr.innerHTML = `
      <td>${escapeHtml(fmt(row.created_at))}</td>
      <td>${escapeHtml(propertyNameById[row.property_id] || row.property_id)}</td>
      <td>${escapeHtml(row.check_in)} → ${escapeHtml(row.check_out)}</td>
      <td>${escapeHtml(row.guest_name)}</td>
      <td>${escapeHtml(row.guest_phone)}</td>
      <td>${escapeHtml(row.guest_email)}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>
        <div class="row-action">
          <select data-status-select="${escapeHtml(row.id)}">${options}</select>
          <button type="button" data-status-save="${escapeHtml(row.id)}">Save</button>
        </div>
      </td>
      <td>${escapeHtml(row.notes)}</td>
    `;
    ui.bookingsBody.appendChild(tr);
  });

  ui.bookingsBody.querySelectorAll("button[data-status-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-status-save");
      const select = ui.bookingsBody.querySelector(`select[data-status-select=\"${id}\"]`);
      const nextStatus = select ? String(select.value || "").toLowerCase() : "";
      if (!id || !nextStatus) return;

      button.disabled = true;
      try {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: nextStatus })
          .eq("id", id);

        if (updateError) throw updateError;
        setMessage(`Booking status updated to ${nextStatus}.`, "ok");
        await loadBookings();
      } catch (error) {
        setMessage(error?.message || "Failed to update booking status.", "err");
      } finally {
        button.disabled = false;
      }
    });
  });
}

async function loadInquiries() {
  const { data, error } = await supabase
    .from("inquiries")
    .select("created_at, name, email, phone, message")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw error;

  ui.inquiriesBody.innerHTML = "";
  if (!data?.length) {
    ui.inquiriesBody.innerHTML = '<tr><td colspan="5">No inquiries found.</td></tr>';
    return;
  }

  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(fmt(row.created_at))}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.email)}</td>
      <td>${escapeHtml(row.phone)}</td>
      <td>${escapeHtml(row.message)}</td>
    `;
    ui.inquiriesBody.appendChild(tr);
  });
}

async function refreshData() {
  if (!supabase) {
    setMessage("Supabase config missing. Update config.js.", "err");
    return;
  }

  try {
    setMessage("Loading admin data...");
    await Promise.all([loadBookings(), loadInquiries()]);
    setMessage("Data refreshed.", "ok");
  } catch (error) {
    setMessage(error?.message || "Failed to load admin data.", "err");
  }
}

async function signIn(event) {
  event.preventDefault();
  if (!supabase) {
    setMessage("Supabase config missing. Update config.js.", "err");
    return;
  }

  const email = String(ui.adminEmail.value || "").trim();
  const password = String(ui.adminPassword.value || "");

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSignedInUI(false);
      setMessage(error.message || "Sign-in failed.", "err");
      return;
    }

    setSignedInUI(true);
    setMessage("Signed in.", "ok");
    await refreshData();
  } catch (error) {
    setSignedInUI(false);
    setMessage(error?.message || "Sign-in failed due to network/auth configuration issue.", "err");
  }
}

async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  setSignedInUI(false);
  setMessage("Signed out.");
  ui.bookingsBody.innerHTML = "";
  ui.inquiriesBody.innerHTML = "";
}

async function init() {
  if (!supabase) {
    setMessage("Supabase config missing. Update config.js.", "err");
    return;
  }

  ui.adminLoginForm.addEventListener("submit", signIn);
  ui.logoutBtn.addEventListener("click", signOut);
  ui.refreshBtn.addEventListener("click", refreshData);

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setSignedInUI(false);
      setMessage(error.message || "Unable to read session.", "err");
      return;
    }

    const isSignedIn = Boolean(data?.session);
    setSignedInUI(isSignedIn);
    if (isSignedIn) {
      setMessage("Signed in.", "ok");
      await refreshData();
    } else {
      setMessage("Sign in with Supabase admin user.");
    }
  } catch (error) {
    setSignedInUI(false);
    setMessage(error?.message || "Supabase auth initialization failed.", "err");
  }
}

init();
