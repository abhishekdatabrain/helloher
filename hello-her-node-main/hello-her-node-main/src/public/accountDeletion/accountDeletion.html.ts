export type DeletionAppType = "user" | "listener" | "all";

export function renderAccountDeletionHtml(selectedApp: DeletionAppType = "all"): string {
  const isUserDefault = selectedApp === "user" || selectedApp === "all";
  const isListenerDefault = selectedApp === "listener";

  const initialApp = isListenerDefault ? "listener" : "user";
  const appTitle =
    selectedApp === "user"
      ? "User App"
      : selectedApp === "listener"
      ? "Listener App"
      : "User & Listener Apps";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account & Data Deletion | Hello Her (${appTitle})</title>
  <style>
    :root {
      --primary: #FF2D55;
      --primary-dark: #D81B43;
      --secondary: #7B2CBF;
      --accent: #FF5E7E;
      --bg: #F8F9FD;
      --surface: #FFFFFF;
      --text: #1E293B;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --danger: #EF4444;
      --success: #10B981;
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      position: relative;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 15px;
      opacity: 0.92;
      max-width: 600px;
      margin: 0 auto;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.22);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .container {
      max-width: 720px;
      margin: -25px auto 40px auto;
      padding: 0 16px;
      width: 100%;
      flex: 1;
    }
    .card {
      background: var(--surface);
      border-radius: 16px;
      padding: 30px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      margin-bottom: 24px;
    }
    .app-toggle {
      display: flex;
      background: #F1F5F9;
      padding: 4px;
      border-radius: 12px;
      margin-bottom: 24px;
      gap: 4px;
    }
    .app-btn {
      flex: 1;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
    }
    .app-btn.active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
    }
    .input-wrapper {
      display: flex;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .input-wrapper:focus-within {
      border-color: var(--primary);
    }
    .prefix {
      background: #F8FAFC;
      padding: 12px 14px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-muted);
      border-right: 1px solid var(--border);
      user-select: none;
    }
    input[type="tel"],
    input[type="text"],
    select,
    textarea {
      width: 100%;
      padding: 12px 14px;
      font-size: 15px;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      outline: none;
      background: var(--surface);
      color: var(--text);
      transition: border-color 0.2s;
    }
    .input-wrapper input {
      border: none;
      border-radius: 0;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--primary);
    }
    .btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover {
      background: var(--primary-dark);
    }
    .btn-danger {
      background: var(--danger);
      color: white;
    }
    .btn-danger:hover {
      background: #DC2626;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 20px;
      display: none;
    }
    .alert-error {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }
    .alert-success {
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #6EE7B7;
    }
    .alert-info {
      background: #EFF6FF;
      color: #1E40AF;
      border: 1px solid #BFDBFE;
    }
    .step {
      display: none;
    }
    .step.active {
      display: block;
    }
    .checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 18px 0;
      font-size: 13px;
      color: var(--text-muted);
    }
    .checkbox-group input[type="checkbox"] {
      margin-top: 3px;
      accent-color: var(--primary);
    }
    .info-section {
      margin-top: 10px;
    }
    .info-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-list {
      list-style: none;
      margin-bottom: 16px;
    }
    .info-list li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
    }
    .info-list li::before {
      content: "•";
      position: absolute;
      left: 8px;
      color: var(--primary);
      font-weight: bold;
      font-size: 18px;
      line-height: 1;
    }
    .accordion {
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-top: 12px;
      overflow: hidden;
    }
    .accordion-header {
      padding: 14px 16px;
      background: #F8FAFC;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }
    .accordion-body {
      padding: 16px;
      font-size: 13.5px;
      color: #475569;
      border-top: 1px solid var(--border);
      background: white;
      display: none;
    }
    .accordion-body.open {
      display: block;
    }
    .footer {
      text-align: center;
      padding: 24px 16px;
      font-size: 13px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      margin-top: auto;
      background: white;
    }
    .footer a {
      color: var(--primary);
      text-decoration: none;
    }
    .success-box {
      text-align: center;
      padding: 20px 0;
    }
    .success-icon {
      width: 64px;
      height: 64px;
      background: #D1FAE5;
      color: var(--success);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 16px;
    }
    .reference-badge {
      display: inline-block;
      background: #F1F5F9;
      padding: 6px 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      margin: 12px 0;
    }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <header class="header">
    <div class="badge">Official Account Service</div>
    <h1>Hello Her – Account Deletion</h1>
    <p>Submit an account deletion request for the Hello Her mobile applications in accordance with Google Play & App Store guidelines.</p>
  </header>

  <main class="container">
    <div class="card">
      <!-- App Type Selector -->
      <div class="app-toggle" id="appToggle">
        <a href="javascript:void(0)" class="app-btn ${initialApp === "user" ? "active" : ""}" id="tabUser" onclick="switchApp('user', event)">
          <span>👤</span> User App
        </a>
        <a href="javascript:void(0)" class="app-btn ${initialApp === "listener" ? "active" : ""}" id="tabListener" onclick="switchApp('listener', event)">
          <span>🎧</span> Listener App
        </a>
      </div>

      <!-- Messages -->
      <div id="errorAlert" class="alert alert-error"></div>
      <div id="infoAlert" class="alert alert-info"></div>

      <!-- Step 1: Phone Input -->
      <div id="stepPhone" class="step active">
        <div class="form-group">
          <label for="phoneNumber">Registered Mobile Number</label>
          <div class="input-wrapper">
            <span class="prefix">+91</span>
            <input type="tel" id="phoneNumber" placeholder="10-digit mobile number" maxlength="10" autocomplete="tel">
          </div>
          <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
            Enter the phone number linked with your <span id="appLabelName">${initialApp === "user" ? "User" : "Listener"}</span> account.
          </small>
        </div>

        <button type="button" class="btn btn-primary" id="btnSendOtp" onclick="handleSendOtp()">
          <span id="btnSendOtpText">Send Verification Code</span>
        </button>
      </div>

      <!-- Step 2: OTP & Confirmation -->
      <div id="stepVerify" class="step">
        <div class="form-group">
          <label for="otpCode">Verification Code (OTP)</label>
          <input type="text" id="otpCode" placeholder="Enter 6-digit OTP" maxlength="6" autocomplete="one-time-code">
          <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
            A 6-digit code has been sent to +91 <span id="targetPhoneDisplay"></span>.
          </small>
        </div>

        <div class="form-group">
          <label for="deleteReason">Reason for Deleting Account (Optional)</label>
          <select id="deleteReason">
            <option value="">Select a reason</option>
            <option value="privacy">Privacy concerns</option>
            <option value="no_longer_using">No longer using the service</option>
            <option value="created_new_account">Switching to a different number</option>
            <option value="temporary_break">Taking a break</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="checkbox-group">
          <input type="checkbox" id="confirmCheckbox">
          <label for="confirmCheckbox" style="font-weight: normal; margin: 0; cursor: pointer;">
            I confirm that I want to permanently delete my account and delete all associated data. I understand this action cannot be reversed.
          </label>
        </div>

        <button type="button" class="btn btn-danger" id="btnConfirmDelete" onclick="handleConfirmDelete()">
          <span id="btnConfirmDeleteText">Permanently Delete Account</span>
        </button>

        <button type="button" class="btn" style="margin-top: 10px; background: #F1F5F9; color: var(--text);" onclick="resetToStep1()">
          Change Phone Number
        </button>
      </div>

      <!-- Step 3: Success Confirmation -->
      <div id="stepSuccess" class="step">
        <div class="success-box">
          <div class="success-icon">✓</div>
          <h2 style="font-size: 22px; color: var(--text); margin-bottom: 8px;">Account Deleted Successfully</h2>
          <p style="color: var(--text-muted); font-size: 14px; max-width: 500px; margin: 0 auto;">
            Your <span id="successAppType">${initialApp === "user" ? "User" : "Listener"}</span> account has been permanently deactivated. All associated personal data will be purged within 30 days according to our retention policy.
          </p>
          <div class="reference-badge" id="refIdBadge">Reference ID: REQ-000000</div>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 12px;">
            If you have questions regarding this deletion, contact our support team at <a href="mailto:support@helloher.in">support@helloher.in</a>.
          </p>
        </div>
      </div>
    </div>

    <!-- Data Safety & Policy Disclosures (Google Play Compliant) -->
    <div class="card info-section">
      <div class="info-title">
        <span>🔒</span> Data Deletion & Privacy Disclosures
      </div>
      <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">
        In compliance with Google Play Store & Apple App Store user data safety policies, here is how your data is handled upon deletion:
      </p>

      <div class="accordion">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          <span>What data is deleted immediately?</span>
          <span>▾</span>
        </div>
        <div class="accordion-body open">
          <ul class="info-list">
            <li><strong>Profile Information:</strong> Name, phone number, bio, avatar, and photos.</li>
            <li><strong>Audio Data:</strong> Voice notes and introductory audio samples.</li>
            <li><strong>Activity & Messages:</strong> In-app chat messages, ratings, and call session logs.</li>
            <li><strong>Access Credentials:</strong> Active authentication tokens and push notification IDs.</li>
          </ul>
        </div>
      </div>

      <div class="accordion">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          <span>What data is retained and why?</span>
          <span>▾</span>
        </div>
        <div class="accordion-body">
          <p style="font-size: 13.5px; margin-bottom: 8px;">
            Certain transactional and billing records (such as recharge invoices, transaction IDs, and payout logs) are retained for statutory compliance with Indian taxation and anti-fraud regulations for a limited retention period.
          </p>
          <p style="font-size: 13.5px;">
            Retained financial data is strictly archived, inaccessible for general app operations, and permanently purged once the legal retention period expires.
          </p>
        </div>
      </div>

      <div class="accordion">
        <div class="accordion-header" onclick="toggleAccordion(this)">
          <span>How to delete account directly within the app?</span>
          <span>▾</span>
        </div>
        <div class="accordion-body">
          <ol style="margin-left: 20px; font-size: 13.5px; line-height: 1.8;">
            <li>Open the <strong>Hello Her</strong> (or <strong>Hello Her Listener</strong>) app on your device.</li>
            <li>Tap on your <strong>Profile</strong> tab in the bottom navigation bar.</li>
            <li>Select <strong>Settings</strong> ➔ <strong>Account</strong>.</li>
            <li>Tap <strong>Delete Account</strong> and follow the on-screen confirmation prompts.</li>
          </ol>
        </div>
      </div>
    </div>
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} Hello Her. All rights reserved.</p>
    <p style="margin-top: 4px;">
      For assistance, contact <a href="mailto:support@helloher.in">support@helloher.in</a>
    </p>
  </footer>

  <script>
    let currentApp = "${initialApp}";

    function switchApp(app, event) {
      if (event) event.preventDefault();
      currentApp = app;
      document.getElementById("tabUser").classList.toggle("active", app === "user");
      document.getElementById("tabListener").classList.toggle("active", app === "listener");
      document.getElementById("appLabelName").textContent = app === "user" ? "User" : "Listener";
      hideAlerts();
      // Update browser URL without reload if history API available
      if (window.history && window.history.pushState) {
        const isApiPath = window.location.pathname.includes("/api/");
        const isAccountDeletion = window.location.pathname.includes("account-deletion");
        const folder = isAccountDeletion ? "account-deletion" : "delete-account";
        const basePrefix = (isApiPath ? "/api/" : "/") + folder + "/";
        window.history.pushState({}, "", basePrefix + app);
      }
    }

    function toggleAccordion(el) {
      const body = el.nextElementSibling;
      const isOpen = body.classList.contains("open");
      body.classList.toggle("open", !isOpen);
      el.querySelector("span:last-child").textContent = isOpen ? "▸" : "▾";
    }

    function showError(msg) {
      const el = document.getElementById("errorAlert");
      el.textContent = msg;
      el.style.display = "block";
      document.getElementById("infoAlert").style.display = "none";
    }

    function showInfo(msg) {
      const el = document.getElementById("infoAlert");
      el.textContent = msg;
      el.style.display = "block";
      document.getElementById("errorAlert").style.display = "none";
    }

    function hideAlerts() {
      document.getElementById("errorAlert").style.display = "none";
      document.getElementById("infoAlert").style.display = "none";
    }

    function resetToStep1() {
      hideAlerts();
      document.getElementById("stepVerify").classList.remove("active");
      document.getElementById("stepPhone").classList.add("active");
      document.getElementById("otpCode").value = "";
    }

    async function handleSendOtp() {
      hideAlerts();
      const phoneInput = document.getElementById("phoneNumber");
      const phone = phoneInput.value.trim();

      if (!phone || phone.length !== 10 || !/^\\d{10}$/.test(phone)) {
        showError("Please enter a valid 10-digit mobile number.");
        phoneInput.focus();
        return;
      }

      const btn = document.getElementById("btnSendOtp");
      const btnText = document.getElementById("btnSendOtpText");
      btn.disabled = true;
      btnText.innerHTML = '<span class="spinner"></span> Sending OTP...';

      try {
        const res = await fetch("/api/account-deletion/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone, appType: currentApp })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          document.getElementById("targetPhoneDisplay").textContent = phone;
          document.getElementById("stepPhone").classList.remove("active");
          document.getElementById("stepVerify").classList.add("active");
          showInfo(data.message || "Verification code sent successfully.");
          document.getElementById("otpCode").focus();
        } else {
          showError(data.message || "Could not send verification code. Please check your number.");
        }
      } catch (err) {
        showError("Network error. Please try again later.");
      } finally {
        btn.disabled = false;
        btnText.textContent = "Send Verification Code";
      }
    }

    async function handleConfirmDelete() {
      hideAlerts();
      const phone = document.getElementById("phoneNumber").value.trim();
      const otp = document.getElementById("otpCode").value.trim();
      const reason = document.getElementById("deleteReason").value;
      const confirmed = document.getElementById("confirmCheckbox").checked;

      if (!otp || otp.length < 4) {
        showError("Please enter the 6-digit verification code.");
        document.getElementById("otpCode").focus();
        return;
      }
      if (!confirmed) {
        showError("Please check the confirmation box to proceed.");
        return;
      }

      const btn = document.getElementById("btnConfirmDelete");
      const btnText = document.getElementById("btnConfirmDeleteText");
      btn.disabled = true;
      btnText.innerHTML = '<span class="spinner"></span> Deleting Account...';

      try {
        const res = await fetch("/api/account-deletion/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: phone,
            otp: otp,
            appType: currentApp,
            reason: reason
          })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          document.getElementById("stepVerify").classList.remove("active");
          document.getElementById("stepSuccess").classList.add("active");
          document.getElementById("successAppType").textContent = currentApp === "user" ? "User" : "Listener";
          if (data.data && data.data.requestId) {
            document.getElementById("refIdBadge").textContent = "Reference ID: " + data.data.requestId;
          }
        } else {
          showError(data.message || "Failed to verify or delete account. Please try again.");
        }
      } catch (err) {
        showError("Network error. Please try again later.");
      } finally {
        btn.disabled = false;
        btnText.textContent = "Permanently Delete Account";
      }
    }
  </script>
</body>
</html>`;
}
