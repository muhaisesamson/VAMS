const BASE_URL = window.API_BASE_URL || "https://vams-vnbr.onrender.com";


// ===========================
// UTILITIES
// ===========================

function byId(id) { return document.getElementById(id); }

function setMessage(el, text, type = "info") {
    if (!el) return;
    el.textContent = text;
    el.dataset.type = type;
    el.style.display = "block";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearMessage(el) {
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
}

function getToken() {
    return localStorage.getItem("vamsToken");
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("vamsUser"));
    } catch {
        return null;
    }
}

function getUserRole() {
    const user = getUser();
    return user && user.role ? user.role : null;
}

// Redirect to login if no token found
function requireAuth() {

    const protectedPages = [
        "dashboard.html",
        "services.html",
        "community.html"
    ];

    const currentPage = window.location.pathname.split("/").pop();

    if (protectedPages.includes(currentPage) && !getToken()) {
        window.location.href = "login.html";
    }

}


// ===========================
// NAVIGATION
// ===========================

function initNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach(link => {
        if (link.getAttribute("href") === current) link.classList.add("active");
    });
}

function updateNavigation() {
    const user = getUser();
    const nav = document.querySelector(".nav-links");
    if (!nav) return;

    if (user) {
        nav.innerHTML = `
            <a data-nav href="dashboard.html">Dashboard</a>
            <a data-nav href="services.html">Services</a>
            <a data-nav href="community.html">Community</a>
            <a href="#" id="logoutBtn">Logout</a>
        `;
        document.getElementById("logoutBtn").addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("vamsToken");
            localStorage.removeItem("vamsUser");
            window.location.href = "index.html";
        });
    } else {
        nav.innerHTML = `
            <a data-nav href="index.html">Home</a>
            <a data-nav href="login.html">Login</a>
        `;
    }
}

function setupHomeLink() {
    const home = document.getElementById("homeLink");
    if (!home) return;
    home.href = getUser() ? "dashboard.html" : "index.html";
}


// ===========================
// REGISTER
// ===========================

function registerHandlers() {
    const form = byId("registerForm");
    const msg  = byId("registerMessage");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage(msg);

        // Read fields
        const firstName    = byId("firstName").value.trim();
        const lastName     = byId("lastName").value.trim();
        const gender       = byId("gender").value;
        const dateOfBirth  = byId("dateOfBirth").value;
        const nin          = byId("nin").value.trim();
        const serviceNumber = byId("serviceNumber").value.trim();
        const serviceBranch = byId("serviceBranch").value;
        const rank         = byId("rank").value.trim();
        const phone        = byId("phone").value.trim();
        const email        = byId("email").value.trim();
        const yearsServed  = byId("yearsServed").value;
        const password     = byId("password").value;

        const nationalIdFile  = byId("nationalId").files[0];
        const armyIdFile      = byId("armyId").files[0];
        const dischargeFile   = byId("dischargeCertificate").files[0];
        const supportingDocs  = byId("supportingDocs").files;

        // Validate
        if (!firstName || !lastName)   return setMessage(msg, "Enter your first and last name.", "error");
        if (!gender)                   return setMessage(msg, "Select your gender.", "error");
        if (!dateOfBirth)              return setMessage(msg, "Enter your date of birth.", "error");
        if (!nin || nin.length < 10)   return setMessage(msg, "Enter a valid National ID number.", "error");
        if (!serviceNumber || serviceNumber.length < 5) return setMessage(msg, "Enter your service number.", "error");
        if (!serviceBranch)            return setMessage(msg, "Select your service branch.", "error");
        if (!rank)                     return setMessage(msg, "Enter your rank.", "error");
        if (!phone || phone.length < 10) return setMessage(msg, "Enter a valid phone number.", "error");
        if (!email)                    return setMessage(msg, "Enter your email address.", "error");
        if (!yearsServed || Number(yearsServed) < 1) return setMessage(msg, "Enter years served.", "error");
        if (password.length < 8)       return setMessage(msg, "Password must be at least 8 characters.", "error");
        if (!nationalIdFile || !armyIdFile || !dischargeFile) {
            return setMessage(msg, "Upload National ID, Army ID, and discharge certificate.", "error");
        }

        // Build FormData — browser sets the correct multipart boundary automatically
        // Do NOT manually set Content-Type when using FormData
        const formData = new FormData();
        formData.append("first_name",     firstName);
        formData.append("last_name",      lastName);
        formData.append("gender",         gender);
        formData.append("date_of_birth",  dateOfBirth);
        formData.append("national_id",    nin);
        formData.append("phone",          phone);
        formData.append("service_number", serviceNumber);
        formData.append("service_branch", serviceBranch);
        formData.append("rank",           rank);
        formData.append("years_served",   yearsServed);
        formData.append("email",          email);
        formData.append("password",       password);
        formData.append("national_id_file", nationalIdFile);
        formData.append("army_id_file",     armyIdFile);
        formData.append("discharge_file",   dischargeFile);
        for (const file of supportingDocs) {
            formData.append("supporting_docs", file);
        }

        // Disable button while submitting
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "Submitting...";

        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                form.reset();
                setMessage(msg, data.message, "success");
                setTimeout(() => window.location.href = "login.html", 1500);
            } else {
                setMessage(msg, data.message || "Registration failed. Please try again.", "error");
            }

        } catch (err) {
            setMessage(msg, "Could not reach the server. Make sure the backend is running.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Submit registration";
        }
    });
}


// ===========================
// LOGIN
// ===========================

function loginHandlers() {
    const form = byId("loginForm");
    const msg  = byId("loginMessage");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage(msg);

        const emailInput = byId("loginId").value.trim();
        const password   = byId("loginPassword").value;

        if (!emailInput || !password) {
            return setMessage(msg, "Enter your email and password.", "error");
        }

        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "Logging in...";

        try {
            const selectedRole = document.querySelector('input[name="loginRole"]:checked')?.value || 'veteran';
            const loginUrl = selectedRole === 'admin'
              ? `${BASE_URL}/api/auth/admin/login`
              : `${BASE_URL}/api/auth/veteran/login`;
            const payload = { email: emailInput, password };

            console.group("LOGIN REQUEST");
            console.log("➡️ Final URL:", loginUrl);
            console.log("➡️ Payload (sanitized):", { email: emailInput, password: "<REDACTED>" });
            console.log("➡️ Raw payload sent:", payload);
            console.log("➡️ Request start:", new Date().toISOString());

            const response = await fetch(loginUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            console.log("⬅️ Response status:", response.status);
            let responseBody = null;
            try {
                responseBody = await response.clone().json();
            } catch (e) {
                try { responseBody = await response.clone().text(); } catch { responseBody = "<unreadable>"; }
            }
            console.log("⬅️ Response body:", responseBody);
            console.log("⬅️ Request end:", new Date().toISOString());

            if (response.status === 404) {
                console.error("❌ API ROUTE NOT FOUND", { url: loginUrl });
            }

            console.groupEnd();

            const data = responseBody;

            if (data.success) {
                localStorage.setItem("vamsToken", data.token);
                const user = { ...data.user, full_name: data.user.full_name || data.user.name };
                localStorage.setItem("vamsUser", JSON.stringify(user));
                setMessage(msg, "Login successful. Redirecting...", "success");
                const redirectTo = selectedRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
                setTimeout(() => window.location.href = redirectTo, 900);
            } else {
                setMessage(msg, data.message || "Login failed.", "error");
            }

        } catch (err) {
            setMessage(msg, "Could not reach the server. Make sure the backend is running.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Login";
        }
    });

    // Demo account — fills the registered test user credentials
    const demo = byId("useDemoAccount");
    if (demo) {
        demo.addEventListener("click", () => {
            byId("loginId").value = "john.doe@example.com";
            byId("loginPassword").value = "Test1234";
            setMessage(msg, "Demo credentials filled. Click Login.", "success");
        });
    }
}


// ===========================
// DASHBOARD
// ===========================

async function dashboardHandlers() {
    const target = byId("dashboardUser");
    if (!target) return;

    requireAuth();

    try {
        const response = await fetch(`${BASE_URL}/api/veteran/dashboard`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        // Token expired or invalid — send back to login
        if (response.status === 401) {
            localStorage.removeItem("vamsToken");
            localStorage.removeItem("vamsUser");
            window.location.href = "login.html";
            return;
        }
        // Also add this check: don't redirect on non-auth errors
        if (!response.ok) {
            target.textContent = "Error loading data";
            return;
        }

        const data = await response.json();

        if (data.success) {
            const v = data.data;

            target.textContent = `${v.first_name} ${v.last_name}`;

            const status          = byId("verificationStatus");
            const benefits        = byId("benefitCount");
            const messageCount    = byId("messageCount");
            const appointmentCount = byId("appointmentCount");

            if (status)           status.textContent = v.verification_status || "Pending";
            if (benefits)         benefits.textContent = v.documents_uploaded || 0;
            if (messageCount)     messageCount.textContent = "0";
            if (appointmentCount) appointmentCount.textContent = "0";
        }

    } catch (err) {
        console.error("Dashboard error:", err);
        target.textContent = "Error loading data";
    }
}


// ===========================
// PROFILE SUMMARY
// ===========================

async function populateProfile() {
    const profile = byId("profileSummary");
    if (!profile) return;

    requireAuth();

    try {
        const response = await fetch(`${BASE_URL}/api/veteran/profile`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        if (response.status === 401) {
            localStorage.removeItem("vamsToken");
            localStorage.removeItem("vamsUser");
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        if (data.success) {
            const v = data.data;
            profile.innerHTML = `
                <div class="row-item"><strong>Name</strong><span>${v.first_name} ${v.last_name}</span></div>
                <div class="row-item"><strong>Service Number</strong><span>${v.service_number}</span></div>
                <div class="row-item"><strong>Status</strong><span class="pill green">${v.verification_status || "Pending"}</span></div>
                <div class="row-item"><strong>Branch</strong><span>${v.service_branch}</span></div>
                <div class="row-item"><strong>Years Served</strong><span>${v.years_served}</span></div>
            `;
        }

    } catch (err) {
        profile.innerHTML = `<div class="note">Could not load profile. Check your connection.</div>`;
    }
}


// ===========================
// INIT
// ===========================

requireAuth();

updateNavigation();
setupHomeLink();
initNav();

registerHandlers();
loginHandlers();
dashboardHandlers();
populateProfile();