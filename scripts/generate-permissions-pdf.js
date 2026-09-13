const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildPdf() {
  console.log('=====================================================');
  console.log('📄 GENERATING GREETWELL CRM PERMISSIONS GUIDE PDF');
  console.log('=====================================================\n');

  const logoPath = path.resolve(__dirname, '../frontend/public/gfs-logo.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Greetwell Financial Services CRM - Roles & Permissions Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 13px;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    .telugu-text {
      font-family: 'Noto Sans Telugu', 'Nirmala UI', 'Gautami', sans-serif;
      line-height: 1.7;
    }

    /* Header & Footer */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2.5px solid #1d63ed;
      margin-bottom: 25px;
    }

    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }

    .doc-meta strong {
      color: #0f172a;
    }

    /* Title Block */
    .cover-title {
      background: linear-gradient(135deg, #0f2852 0%, #1d63ed 100%);
      color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 10px 15px -3px rgba(29, 99, 237, 0.2);
    }

    .cover-title h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .cover-title p {
      margin: 0;
      font-size: 14px;
      opacity: 0.92;
      font-weight: 400;
    }

    .subtitle-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Headings */
    h2 {
      color: #0f2852;
      font-size: 17px;
      font-weight: 700;
      margin-top: 28px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      page-break-after: avoid;
    }

    h3 {
      color: #1d63ed;
      font-size: 14px;
      font-weight: 600;
      margin-top: 18px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    /* Table of Contents */
    .toc-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #1d63ed;
      border-radius: 8px;
      padding: 18px 24px;
      margin-bottom: 30px;
    }

    .toc-title {
      font-weight: 700;
      font-size: 15px;
      color: #0f2852;
      margin-bottom: 12px;
    }

    .toc-list {
      columns: 2;
      column-gap: 20px;
      margin: 0;
      padding-left: 20px;
      font-size: 12.5px;
    }

    .toc-list li {
      margin-bottom: 6px;
      color: #334155;
    }

    /* Callout & Alert Boxes */
    .alert-box {
      padding: 14px 18px;
      border-radius: 8px;
      margin: 16px 0;
      font-size: 12.5px;
    }

    .alert-info {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    .alert-warning {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    .alert-success {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      color: #166534;
    }

    .alert-danger {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 12px;
    }

    th {
      background-color: #0f2852;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 9px 12px;
      border: 1px solid #0f2852;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Code & Badges */
    code {
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11.5px;
      border: 1px solid #e2e8f0;
    }

    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10.5px;
      font-weight: 700;
    }

    .badge-admin { background-color: #dbeafe; color: #1e40af; }
    .badge-agent { background-color: #e0e7ff; color: #3730a3; }
    .badge-customer { background-color: #f3e8ff; color: #6b21a8; }

    .page-break {
      page-break-before: always;
    }

    .section-divider {
      margin: 35px 0;
      border-top: 2px dashed #cbd5e1;
    }
  </style>
</head>
<body>

  <!-- Header Bar -->
  <div class="header-bar">
    <img src="${logoDataUri}" class="logo-img" alt="Greetwell Financial Services Logo" />
    <div class="doc-meta">
      <strong>Greetwell Financial Services</strong><br>
      Document Ref: GFS-CRM-PERM-2026-v1.0<br>
      Date: September 2026
    </div>
  </div>

  <!-- Cover Banner -->
  <div class="cover-title">
    <h1>CRM Roles & Permissions Guide</h1>
    <p>Comprehensive Administrator & Technical Reference for Menu & Method Access Control</p>
    <div class="subtitle-badge">Official Documentation &bull; Version 1.0</div>
  </div>

  <!-- Table of Contents -->
  <div class="toc-box">
    <div class="toc-title">Table of Contents (English Guide)</div>
    <ol class="toc-list">
      <li>Understanding Menu Permissions</li>
      <li>Understanding Method Permissions</li>
      <li>How Menu Visibility Works</li>
      <li>How Method Permissions Work</li>
      <li>How Role Permissions Are Assigned</li>
      <li>Superadmin Permissions</li>
      <li>Agent Permissions</li>
      <li>Customer Permissions</li>
      <li>Impact of Disabling Menu Permissions</li>
      <li>Impact of Disabling Method Permissions</li>
      <li>Safely Updating Permissions Procedure</li>
      <li>Common Mistakes and Solutions</li>
      <li>Post-Change Verification Checklist</li>
      <li>Practical CRM Examples</li>
    </ol>
  </div>

  <!-- SECTION 1 -->
  <h2>1. Understanding Menu Permissions</h2>
  <p>In Greetwell Financial Services CRM, <strong>Menu Permissions</strong> govern the structural visibility and navigation access of sidebar links, parent menus, submenus, and page routes within the application interface.</p>
  <p>Menu permissions dictate whether a user role can see a specific module (e.g. <code>Applications</code>, <code>Users Management</code>, <code>Documents</code>, <code>Reports</code>) in their navigation menu. When a menu permission is enabled for a role, the corresponding menu link appears cleanly in the user's sidebar.</p>

  <!-- SECTION 2 -->
  <h2>2. Understanding Method Permissions</h2>
  <p><strong>Method Permissions</strong> (also known as API Action Permissions) govern backend authorization for executing specific backend operations, HTTP endpoints, and business actions (e.g., HTTP GET, POST, PUT, DELETE, Upload, Assign, Approve, Export).</p>
  <p>While Menu Permissions control what the user <em>sees</em> in the UI, Method Permissions control what actions the user is <em>authorized to execute</em> when interacting with server APIs.</p>

  <!-- SECTION 3 -->
  <h2>3. How Menu Visibility Works</h2>
  <p>When a user logs into the CRM, the frontend requests permitted navigation items from <code>/api/menus/my-menus</code>. The backend evaluates the database model <code>Menu</code> and <code>RoleMenuPermission</code> as follows:</p>
  <ul>
    <li>Each menu item requires <code>isActive = true</code> in the <code>Menu</code> table.</li>
    <li>The backend inspects the <code>RoleMenuPermission</code> mapping for the user's assigned role.</li>
    <li>If <code>canView = true</code>, the menu item and its permitted sub-children are included in the response.</li>
    <li>If a parent menu contains children, at least one child menu must be permitted for the parent header to remain visible.</li>
    <li>Route guards check <code>checkMenuAccess</code> to block direct URL entry if <code>canView = false</code>.</li>
  </ul>

  <!-- SECTION 4 -->
  <h2>4. How Method Permissions Work</h2>
  <p>Every critical API request sent to the server passes through the backend middleware <code>enforceMethodPermission</code>:</p>
  <ul>
    <li>The request endpoint (e.g. <code>/api/applications/assign</code>) and HTTP method (e.g. <code>PUT</code>) are matched against definitions in <code>MethodPermissionDef</code>.</li>
    <li>The middleware verifies whether <code>isActive = true</code> for the method permission rule.</li>
    <li>The backend inspects <code>RoleMethodPermission</code> for the user's current role. If <code>isAllowed = true</code>, request execution proceeds.</li>
    <li>If <code>isAllowed = false</code>, the backend immediately halts processing and responds with <code>HTTP 403 Forbidden</code>: <em>"Access Denied: Your role is not permitted to perform operation..."</em>.</li>
  </ul>

  <!-- SECTION 5 -->
  <h2>5. How Role Permissions Are Assigned</h2>
  <p>The Greetwell CRM utilizes 5 core role codes defined in the <code>CustomRole</code> database schema:</p>
  <table>
    <thead>
      <tr>
        <th>Role Code</th>
        <th>Display Name</th>
        <th>Target User Group</th>
        <th>Scope of Work</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>SUPER_ADMIN</code></td>
        <td>Super Admin</td>
        <td>Executive Administrators</td>
        <td>Full global system oversight, user creation, permission management, audit logs.</td>
      </tr>
      <tr>
        <td><code>LOAN_AGENT</code></td>
        <td>Loan Agent</td>
        <td>Specialized Agents</td>
        <td>Processes borrower applications, verifies loan docs, updates loan statuses.</td>
      </tr>
      <tr>
        <td><code>INSURANCE_AGENT</code></td>
        <td>Insurance Agent</td>
        <td>Specialized Agents</td>
        <td>Underwrites policies, reviews claims, manages policy document verifications.</td>
      </tr>
      <tr>
        <td><code>INVESTMENT_AGENT</code></td>
        <td>Investment Agent</td>
        <td>Specialized Agents</td>
        <td>Oversees wealth management applications, portfolios, client investments.</td>
      </tr>
      <tr>
        <td><code>CUSTOMER</code></td>
        <td>Customer / Client</td>
        <td>Portal Clients</td>
        <td>Submits applications, uploads personal verification docs, tracks application status.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 6 -->
  <h2>6. Superadmin Permissions</h2>
  <p>The <span class="role-badge badge-admin">SUPER_ADMIN</span> role is designed to have complete, uninhibited administrative control across all CRM modules.</p>
  <div class="alert-box alert-success">
    <strong>Full Access Modules:</strong> Dashboard, All Applications (Loans, Insurance, Investment), Users Management, Manage & Invite Agents, Customers, Documents, Products & Services Catalog, System Management, Website Content & Media, Updates & Versions, Enquiries / Complaints, Reports, Audit Logs, Settings.
  </div>
  <p>All <code>RoleMenuPermission.canView</code> and <code>RoleMethodPermission.isAllowed</code> settings for <code>SUPER_ADMIN</code> must remain set to <code>true</code>.</p>

  <!-- SECTION 7 -->
  <h2>7. Agent Permissions</h2>
  <p>Agents (<span class="role-badge badge-agent">LOAN_AGENT</span>, <span class="role-badge badge-agent">INSURANCE_AGENT</span>, <span class="role-badge badge-agent">INVESTMENT_AGENT</span>) have targeted access limited strictly to their financial domain.</p>
  <ul>
    <li>Can view assigned customer applications in their specialization.</li>
    <li>Can verify applicant documents and request additional information.</li>
    <li>Cannot modify system roles, alter menu configurations, or delete portal users.</li>
  </ul>

  <!-- SECTION 8 -->
  <h2>8. Customer Permissions</h2>
  <p>Customers (<span class="role-badge badge-customer">CUSTOMER</span>) access a clean self-service portal.</p>
  <ul>
    <li>Can submit new loan, insurance, and investment applications.</li>
    <li>Can upload required identity and financial verification files.</li>
    <li>Can view status notifications and submit enquiries/complaints.</li>
    <li>Cannot view other customers' data or administrative system logs.</li>
  </ul>

  <div class="page-break"></div>

  <!-- SECTION 9 -->
  <h2>9. Impact of Disabling Menu Permissions</h2>
  <p>When a Menu Permission's <code>canView</code> flag is toggled to <code>false</code> for a role:</p>
  <div class="alert-box alert-warning">
    <strong>UI Result:</strong> The menu item immediately vanishes from the user's left navigation sidebar. If the user attempts to type the direct URL into their browser address bar, the route guard intercepts the attempt and displays an <em>"Access Denied: You do not have permission to view this menu."</em> message.
  </div>

  <!-- SECTION 10 -->
  <h2>10. Impact of Disabling Method Permissions</h2>
  <p>When a Method Permission's <code>isAllowed</code> flag is set to <code>false</code> for a role:</p>
  <div class="alert-box alert-danger">
    <strong>API Result:</strong> Even if a button or UI interface remains visible to the user, clicking the button triggers an API request that is immediately rejected by the backend server with <code>HTTP 403 Forbidden</code>. No database changes or backend actions occur.
  </div>

  <!-- SECTION 11 -->
  <h2>11. Safely Updating Permissions Procedure</h2>
  <ol>
    <li>Navigate to <strong>Roles & Permissions</strong> &rarr; <strong>Menu Items</strong> or <strong>Method Permissions</strong> in the Superadmin Portal.</li>
    <li>Select the target role before making toggle modifications.</li>
    <li>Verify that top-level parent menu visibility is enabled before enabling child menus.</li>
    <li>Always test modifications in a staging or development session prior to saving.</li>
    <li><strong>Note:</strong> Changes to permissions take effect immediately upon saving without requiring server restarts.</li>
  </ol>

  <!-- SECTION 12 -->
  <h2>12. Common Mistakes and Solutions</h2>
  <table>
    <thead>
      <tr>
        <th>Mistake</th>
        <th>Symptom / Result</th>
        <th>Corrective Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Disabling Parent Menu (e.g. <code>Applications</code>)</td>
        <td>All child menus (Loan, Insurance, Investment Apps) disappear from sidebar.</td>
        <td>Re-enable <code>canView = true</code> on the parent menu item.</td>
      </tr>
      <tr>
        <td>Disabling Method Perm while Menu is Visible</td>
        <td>User clicks button (e.g. Assign Agent) and receives HTTP 403 Error popup.</td>
        <td>Enable <code>isAllowed = true</code> on method permission <code>AssignApplicationAgent</code>.</td>
      </tr>
      <tr>
        <td>Disabling Superadmin Menu Permission</td>
        <td>Superadmin loses access to module in UI.</td>
        <td>Run the automated reset script <code>node scripts/reset-superadmin-permissions.js</code>.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 13 -->
  <h2>13. Post-Change Verification Checklist</h2>
  <ul style="list-style-type: square;">
    <li>[ ] Log in as <code>SUPER_ADMIN</code> and verify all 16+ main menu headers appear in sidebar.</li>
    <li>[ ] Open Applications list (Loan, Insurance, Investment) and verify records load cleanly.</li>
    <li>[ ] Click "Assign Agent" on an application to verify method permission execution.</li>
    <li>[ ] Log in as <code>LOAN_AGENT</code> and verify access is restricted only to loan modules.</li>
    <li>[ ] Log in as <code>CUSTOMER</code> and verify client portal access is isolated.</li>
  </ul>

  <!-- SECTION 14 -->
  <h2>14. Practical CRM Examples</h2>
  <div class="alert-box alert-info">
    <strong>Example 1: Menu Permission Disabled</strong><br>
    If <code>Applications</code> menu permission is set to <code>canView = false</code> for Loan Agent, the "Applications" menu item will not appear in the Loan Agent sidebar.
  </div>
  <div class="alert-box alert-info">
    <strong>Example 2: Method Permission Disabled</strong><br>
    If <code>GetLoanApplications</code> method permission is set to <code>isAllowed = false</code>, a Loan Agent opening <code>/agent/loan-applications</code> will see a blank table and a 403 API error notification.
  </div>
  <div class="alert-box alert-info">
    <strong>Example 3: Action Method Disabled</strong><br>
    If <code>AssignApplicationAgent</code> method permission is disabled for Superadmin, clicking "Assign Agent" on an application displays an error message.
  </div>
  <div class="alert-box alert-info">
    <strong>Example 4: User Management Method Disabled</strong><br>
    If <code>CreateUserAccount</code> method permission is disabled, submitting the Create User form fails with an authorization error.
  </div>

  <!-- SECTION DIVIDER -->
  <div class="section-divider"></div>

  <div class="page-break"></div>

  <!-- TELUGU SECTION HEADER -->
  <div class="cover-title telugu-text" style="background: linear-gradient(135deg, #092540 0%, #0d9488 100%);">
    <h1>తెలుగు మార్గదర్శి - Greetwell CRM అనుమతులు (Permissions Guide)</h1>
    <p>సూపర్‌అడ్మిన్, ఏజెంట్ మరియు కస్టమర్ అనుమతుల (Permissions) పూర్తి వివరణ</p>
    <div class="subtitle-badge">తెలుగు సెక్షన్ &bull; వర్షన్ 1.0</div>
  </div>

  <div class="toc-box telugu-text">
    <div class="toc-title">విషయ సూచిక (Telugu Section Index)</div>
    <ol class="toc-list">
      <li>మెనూ పర్మిషన్లు (Menu Permissions) అంటే ఏమిటి?</li>
      <li>మెథడ్ పర్మిషన్లు (Method Permissions) అంటే ఏమిటి?</li>
      <li>మెనూ పర్మిషన్ ఆఫ్ చేస్తే ఏమి జరుగుతుంది?</li>
      <li>మెథడ్ పర్మిషన్ ఆఫ్ చేస్తే ఏమి జరుగుతుంది?</li>
      <li>సూపర్‌అడ్మిన్ పర్మిషన్లు (Superadmin Permissions) ఎలా పనిచేస్తాయి?</li>
      <li>ఏజెంట్ పర్మిషన్లు (Agent Permissions) ఎలా పనిచేస్తాయి?</li>
      <li>కస్టమర్ పర్మిషన్లు (Customer Permissions) ఎలా పనిచేస్తాయి?</li>
      <li>పర్మిషన్లు మార్చినప్పుడు ఏమి చెక్ చేయాలి?</li>
      <li>అప్లికేషన్లు కనిపించకపోతే ఎలా ఫిక్స్ చేయాలి?</li>
    </ol>
  </div>

  <div class="telugu-text">
    <!-- TELUGU 1 -->
    <h2>1. మెనూ పర్మిషన్లు (Menu Permissions) అంటే ఏమిటి?</h2>
    <p>Greetwell CRM పోర్టల్‌లో <strong>మెనూ పర్మిషన్లు (Menu Permissions)</strong> అంటే యూజర్‌కి సైడ్‌బార్ నెవిగేషన్‌లో ఏయే మెనూలు (ఉదాహరణకి: <code>Dashboard</code>, <code>Applications</code>, <code>Users Management</code>, <code>Documents</code>, <code>Reports</code>) కనిపించాలో నిర్ణయించే అనుమతులు.</p>
    <p>మెనూ పర్మిషన్ <code>ON (canView = true)</code> లో ఉంటే ఆ మెనూ యూజర్ సైడ్‌బార్‌లో స్పష్టంగా కనిపిస్తుంది.</p>

    <!-- TELUGU 2 -->
    <h2>2. మెథడ్ పర్మిషన్లు (Method Permissions) అంటే ఏమిటి?</h2>
    <p><strong>మెథడ్ పర్మిషన్లు (Method Permissions)</strong> అంటే సర్వర్ లెవెల్‌లో సర్వర్ API ఆపరేషన్లు (ఉదాహరణకి: అప్లికేషన్ చూడటం, కొత్త యూజర్‌ని క్రియేట్ చేయడం, ఏజెంట్‌ని అసైన్ చేయడం, డాక్యుమెంట్ వెరిఫై చేయడం) చేయడానికి ఇచ్చే అనుమతులు.</p>

    <!-- TELUGU 3 -->
    <h2>3. మెనూ పర్మిషన్ ఆఫ్ చేస్తే ఏమి జరుగుతుంది?</h2>
    <div class="alert-box alert-warning">
      <strong>ఫలితం (Result):</strong> మెనూ పర్మిషన్ ఆఫ్ <code>(canView = false)</code> చేస్తే, యూజర్ సైడ్‌బార్ నుండి ఆ మెనూ లింక్ పూర్తిగా అదృశ్యమవుతుంది (Hide అవుతుంది). బ్రౌజర్‌లో డైరెక్ట్ URL టైప్ చేసినా Access Denied అని వస్తుంది.
    </div>

    <!-- TELUGU 4 -->
    <h2>4. మెథడ్ పర్మిషన్ ఆఫ్ చేస్తే ఏమి జరుగుతుంది?</h2>
    <div class="alert-box alert-danger">
      <strong>ఫలితం (Result):</strong> మెథడ్ పర్మిషన్ ఆఫ్ <code>(isAllowed = false)</code> చేస్తే, స్క్రీన్‌పై బటన్ కనిపించినప్పటికీ, ఆ బటన్ క్లిక్ చేసినప్పుడు సర్వర్ <code>HTTP 403 Forbidden Error</code> ఇస్తుంది. ఆ పని జరగదు.
    </div>

    <!-- TELUGU 5 -->
    <h2>5. సూపర్‌అడ్మిన్ పర్మిషన్లు (Superadmin Permissions) ఎలా పనిచేస్తాయి?</h2>
    <p><strong>సూపర్‌అడ్మిన్ (SUPER_ADMIN)</strong> కి CRM పోర్టల్‌లోని అన్ని మెనూలు మరియు సర్వర్ మెథడ్స్‌పై పూర్తి ఉచిత మరియు అపరిమిత నియంత్రణ (Full Access) ఉంటుంది.</p>
    <p>సూపర్‌అడ్మిన్ కి అన్ని మెనూ పర్మిషన్లు <code>canView = true</code> మరియు మెథడ్ పర్మిషన్లు <code>isAllowed = true</code> లోనే ఉండాలి.</p>

    <!-- TELUGU 6 -->
    <h2>6. ఏజెంట్ పర్మిషన్లు (Agent Permissions) ఎలా పనిచేస్తాయి?</h2>
    <p>ఏజెంట్లు (Loan Agent, Insurance Agent, Investment Agent) తమకు కేటాయించిన డిపార్ట్‌మెంట్‌కి సంబంధించిన అప్లికేషన్లు, డాక్యుమెంట్లు మాత్రమే చూడగలరు. సిస్టమ్ పర్మిషన్లు లేదా అడ్మిన్ సెటింగ్స్‌ని మార్చలేరు.</p>

    <!-- TELUGU 7 -->
    <h2>7. కస్టమర్ పర్మిషన్లు (Customer Permissions) ఎలా పనిచేస్తాయి?</h2>
    <p>కస్టమర్ (Customer) తన సొంత అప్లికేషన్లు సమర్పించడం, తన డాక్యుమెంట్లు అప్‌లోడ్ చేయడం మరియు స్టేటస్ చెక్ చేయడం మాత్రమే చేయగలరు.</p>

    <!-- TELUGU 8 -->
    <h2>8. పర్మిషన్లు మార్చినప్పుడు ఏమి చెక్ చేయాలి?</h2>
    <ol>
      <li>మెనూ పర్మిషన్ మార్చేముందు మెయిన్ పేరెంట్ మెనూ ON లో ఉందో లేదో చెక్ చేయాలి.</li>
      <li>మెనూ పర్మిషన్ ఇచ్చి మెథడ్ పర్మిషన్ ఇవ్వకపోతే బటన్ పనిచేయదు, కాబట్టి రెండూ సరిగ్గా ఉన్నాయో లేదో చూడాలి.</li>
      <li>సూపర్‌అడ్మిన్ పర్మిషన్లు ఎప్పుడూ OFF చేయకూడదు.</li>
    </ol>

    <!-- TELUGU 9 -->
    <h2>9. అప్లికేషన్లు కనిపించకపోతే ఎలా ఫిక్స్ చేయాలి?</h2>
    <div class="alert-box alert-success">
      <strong>ఫిక్సింగ్ స్టెప్స్ (Fixing Steps):</strong><br>
      1. సూపర్‌అడ్మిన్ పోర్టల్‌లో <strong>Roles & Permissions</strong> &rarr; <strong>Menu Items</strong> కి వెళ్ళండి.<br>
      2. <code>SUPER_ADMIN</code> రోల్ ఎంచుకుని <code>Applications</code> మెనూకి <code>canView</code> స్విచ్ ON చేయండి.<br>
      3. లేదా ప్రాజెక్ట్ రూట్ లో <code>node scripts/reset-superadmin-permissions.js</code> స్క్రిప్ట్ రన్ చేస్తే 1 సెకనులో పర్మిషన్లన్నీ పునరుద్ధరించబడతాయి.
    </div>

    <!-- TELUGU EXAMPLES -->
    <h3>ఉదాహరణలు (Practical Examples in Telugu):</h3>
    <ul>
      <li><strong>ఉదాహరణ 1:</strong> Applications మెనూ పర్మిషన్ ఆపితే, యూజర్‌కి Applications మెనూ కనిపించదు.</li>
      <li><strong>ఉదాహరణ 2:</strong> GetLoanApplications మెథడ్ పర్మిషన్ ఆపితే, మెనూ కనిపించినా అప్లికేషన్ల డేటా లోడ్ అవ్వదు.</li>
      <li><strong>ఉదాహరణ 3:</strong> AssignApplicationAgent మెథడ్ పర్మిషన్ ఆపితే, ఏజెంట్‌ని అసైన్ చేయడానికి వీలుపడదు.</li>
      <li><strong>ఉదాహరణ 4:</strong> CreateUserAccount మెథడ్ పర్మిషన్ ఆపితే, కొత్త యూజర్‌ని క్రియేట్ చేయలేరు.</li>
    </ul>
  </div>

  <div class="section-divider"></div>
  <p style="text-align: center; color: #64748b; font-size: 11px;">&copy; 2026 Greetwell Financial Services. All Rights Reserved. Confidential Internal CRM Technical Guide.</p>

</body>
</html>`;

  const scratchDir = path.resolve(__dirname, '../scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }
  const htmlPath = path.join(scratchDir, 'permissions_guide.html');
  const pdfPathWorkspace = path.resolve(__dirname, '../Greetwell_CRM_Permissions_Guide.pdf');
  const pdfPathArtifact = path.resolve(__dirname, '../Greetwell_CRM_Permissions_Guide.pdf'); // Root workspace

  fs.writeFileSync(htmlPath, htmlContent);
  console.log('✅ Temporary HTML generated at:', htmlPath);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`🚀 Converting HTML to PDF using browser: ${browserPath}`);

  try {
    execSync(`"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPathWorkspace}" "${htmlPath}"`);
    console.log('✅ PDF generated successfully in workspace at:', pdfPathWorkspace);

    // Also copy to artifact directory
    const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\bfba1e37-79d8-4280-b84f-21f00beeac44';
    const artifactPdfPath = path.join(artifactDir, 'Greetwell_CRM_Permissions_Guide.pdf');
    fs.copyFileSync(pdfPathWorkspace, artifactPdfPath);
    console.log('✅ PDF copied to artifact directory at:', artifactPdfPath);
  } catch (err) {
    console.error('❌ PDF generation failed:', err.message);
    process.exit(1);
  }

  console.log('\n=====================================================');
  console.log('🎉 PERMISSIONS GUIDE PDF CREATED SUCCESSFULLY');
  console.log('=====================================================\n');
}

buildPdf();
