/* =====================================================
   MURAD BARI SOCIAL WELFARE FUND
   FRONTEND v2.1
   LOGIN + CRUD + FUND CUSTODY
===================================================== */

const API_URL =
"https://script.google.com/macros/s/AKfycbxSsKNzeV_7aSdoaH7FLOTSQE6nzp4tFw32KrTlDHmU82U8aITR-1BY8ZfJJt_LLCEs/exec";


let lang = "bn";
let currentUser = null;
let sessionToken = "";

/* Browser session helpers */
function saveSession(user, token) {

  sessionToken = String(token || "");
  currentUser = user || null;

  if (sessionToken) {
    localStorage.setItem(
      "MBF_SESSION_TOKEN",
      sessionToken
    );
  } else {
    localStorage.removeItem(
      "MBF_SESSION_TOKEN"
    );
  }

  if (currentUser) {
    localStorage.setItem(
      "MBF_CURRENT_USER",
      JSON.stringify(currentUser)
    );
  } else {
    localStorage.removeItem(
      "MBF_CURRENT_USER"
    );
  }
}


function clearSession() {

  sessionToken = "";
  currentUser = null;

  try {
    localStorage.removeItem(
      "MBF_SESSION_TOKEN"
    );

    localStorage.removeItem(
      "MBF_CURRENT_USER"
    );
  } catch(error) {
    console.warn(
      "Could not clear local session:",
      error
    );
  }
}


function showLoginMessage(message) {

  const loginPage =
    document.getElementById("loginPage");

  const app =
    document.getElementById("app");

  const msg =
    document.getElementById("msg");

  if (loginPage) {
    loginPage.hidden = false;
  }

  if (app) {
    app.hidden = true;
  }

  if (msg) {
    msg.textContent =
      message || "";
  }
}

let data = {
  activities: [],
  donors: [],
  collections: [],
  expenses: [],
  custody: [],
  transfers: [],
  users: [],
  auditLog: [],
  settings: []
};


/* =====================================================
   TRANSLATION
===================================================== */

const T = {

  bn: {
    title:"মুরাদবাড়ি সামাজিক কল্যাণ ফান্ড",
    subtitle:"সামাজিক কল্যাণ ও আর্থিক সহায়তা ব্যবস্থাপনা",

    login:"লগইন",
    dashboard:"ড্যাশবোর্ড",
    activities:"কার্যক্রম",
    donorsMenu:"দাতা",
    collections:"দাতা ও সংগ্রহ",
    expenses:"খরচ ও সহায়তা",
    custody:"ফান্ড কোথায়",
    reports:"রিপোর্ট",
    security:"নিরাপত্তা",
    users:"ব্যবহারকারী",
    audit:"অডিট লগ",
    settings:"সেটিংস",

    totalCollection:"মোট সংগ্রহ",
    totalExpense:"মোট খরচ",
    currentFund:"বর্তমান ফান্ড",
    donors:"দাতা",
    yearSummary:"বছরভিত্তিক কার্যক্রম",

    add:"যোগ করুন",
    edit:"এডিট",
    delete:"ডিলিট",
    save:"সংরক্ষণ",
    cancel:"বাতিল",
    action:"কার্যক্রম"
  },

  en: {
    title:"Murad Bari Social Welfare Fund",
    subtitle:"Social Welfare & Fund Management System",

    login:"Login",
    dashboard:"Dashboard",
    activities:"Activities",
    donorsMenu:"Donors",
    collections:"Donors & Collection",
    expenses:"Expenses & Assistance",
    custody:"Fund Custody",
    reports:"Reports",
    security:"Security",
    users:"Users",
    audit:"Audit Log",
    settings:"Settings",

    totalCollection:"Total Collection",
    totalExpense:"Total Expense",
    currentFund:"Current Fund",
    donors:"Donors",
    yearSummary:"Year-wise Activities",

    add:"Add",
    edit:"Edit",
    delete:"Delete",
    save:"Save",
    cancel:"Cancel",
    action:"Action"
  }
};


/* =====================================================
   API
===================================================== */

async function api(action,payload={}) {

  try {

    const requestPayload =
      Object.assign({}, payload || {});

    /*
     * IMPORTANT:
     * Backend v2.2 requires p.token for every protected action.
     * Login does not need a token.
     * Automatically attach the saved session token so that
     * getData/add/update/delete/etc. do not lose the session.
     */
    if (action !== "login" && action !== "logout") {

      const token =
        sessionToken ||
        localStorage.getItem("MBF_SESSION_TOKEN") ||
        "";

      if (token) {
        requestPayload.token = token;
      }
    }

    if (action === "logout") {

      const token =
        sessionToken ||
        localStorage.getItem("MBF_SESSION_TOKEN") ||
        "";

      if (token) {
        requestPayload.token = token;
      }
    }

    const response =
      await fetch(API_URL,{
        method:"POST",

        headers:{
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:JSON.stringify({
          action:action,
          payload:requestPayload
        })
      });


    if (!response.ok) {

      throw new Error(
        "HTTP Error: " +
        response.status
      );
    }


    const result =
      await response.json();

    /*
     * Backend throws "Session expired..." when the
     * CacheService session is gone. Clear the browser
     * session as well, so the user can login cleanly.
     */
    if (
      action !== "login" &&
      result &&
      (
        String(result.message || "")
          .toLowerCase()
          .includes("session expired") ||
        String(result.message || "")
          .toLowerCase()
          .includes("login again")
      )
    ) {

      clearSession();

      showLoginMessage(
        "⏳ Session expired. Please login again."
      );
    }

    return result;

  } catch(error) {

    console.error(
      "API ERROR:",
      error
    );


    return {
      ok:false,
      success:false,
      message:
        error && error.message
          ? error.message
          : "API connection failed. Google Apps Script deployment/check করুন।"
    };
  }
}


/* =====================================================
   INITIAL LOGIN STATE
===================================================== */

function initializeLoginState() {

  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const app =
    document.getElementById(
      "app"
    );


  /*
   * Restore the last browser session.
   * The backend still remains the authority: load()
   * will verify the token and force login if expired.
   */
  let savedUser = null;
  let savedToken = "";

  try {

    savedToken =
      localStorage.getItem(
        "MBF_SESSION_TOKEN"
      ) || "";

    const savedUserRaw =
      localStorage.getItem(
        "MBF_CURRENT_USER"
      );

    if (savedUserRaw) {
      savedUser =
        JSON.parse(savedUserRaw);
    }

  } catch(error) {

    console.warn(
      "Could not restore saved session:",
      error
    );

    clearSession();
  }


  sessionToken = savedToken;
  currentUser = savedUser;


  if (
    currentUser &&
    sessionToken
  ) {

    if (loginPage) {
      loginPage.hidden = true;
    }

    if (app) {
      app.hidden = false;
    }

    const userEl =
      document.getElementById("user");

    if (userEl) {
      userEl.textContent =
        currentUser.name +
        " (" +
        currentUser.role +
        ")";
    }

    setupAdminMenu();

    /*
     * Verify the server-side session.
     * If CacheService has expired, api()/load() will
     * clear it and return the login screen.
     */
    load();

    return;
  }


  clearSession();

  if (loginPage) {
    loginPage.hidden = false;
  }

  if (app) {
    app.hidden = true;
  }
}


document.addEventListener(
  "DOMContentLoaded",
  initializeLoginState
);


/* =====================================================
   LOGIN
===================================================== */

async function doLogin() {

  const idEl =
    document.getElementById(
      "loginId"
    );

  const passwordEl =
    document.getElementById(
      "loginPass"
    );

  const msg =
    document.getElementById(
      "msg"
    );


  if (!idEl || !passwordEl) {

    alert(
      "Login form পাওয়া যাচ্ছে না।"
    );

    return;
  }


  const id =
    idEl.value.trim();

  const password =
    passwordEl.value;


  if (!id || !password) {

    if (msg) {

      msg.textContent =
        "Login ID এবং Password দিন।";
    }

    return;
  }


  if (msg) {

    msg.textContent =
      "⏳ Login হচ্ছে...";
  }


  const result =
    await api(
      "login",
      {
        id:id,
        password:password
      }
    );


  if (
    !result ||
    result.ok !== true ||
    result.success !== true
  ) {

    if (msg) {

      msg.textContent =
        result.message ||
        "Login failed";
    }

    return;
  }


  if (!result.user || !result.token) {

    if (msg) {
      msg.textContent =
        "Login response-এ user/token পাওয়া যায়নি।";
    }

    console.error(
      "Invalid login response:",
      result
    );

    return;
  }


  saveSession(
    result.user,
    result.token
  );


  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const app =
    document.getElementById(
      "app"
    );


  if (loginPage) {

    loginPage.hidden = true;
  }


  if (app) {

    app.hidden = false;
  }


  const userEl =
    document.getElementById(
      "user"
    );


  if (
    userEl &&
    currentUser
  ) {

    userEl.textContent =
      currentUser.name +
      " (" +
      currentUser.role +
      ")";
  }


  setupAdminMenu();


  if (msg) {

    msg.textContent =
      "";
  }


  await load();
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

  const token =
    sessionToken ||
    localStorage.getItem(
      "MBF_SESSION_TOKEN"
    ) ||
    "";

  try {

    if (token) {
      await api("logout", {
        token:token
      });
    }

  } catch(error) {

    console.warn(
      "Logout API failed:",
      error
    );

  } finally {

    clearSession();
    location.reload();
  }
}


/* =====================================================
   AUTH CHECK
===================================================== */

function requireLogin() {

  if (!currentUser || !sessionToken) {

    showLoginMessage(
      "অনুগ্রহ করে প্রথমে Login করুন।"
    );

    return false;
  }

  return true;
}


/* =====================================================
   LOAD DATA
===================================================== */

async function load() {

  if (!requireLogin())
    return;


  const result =
    await api(
      "getData"
    );


  if (
    !result ||
    result.ok !== true ||
    result.success !== true
  ) {

    const message =
      result && result.message
        ? result.message
        : "Data loading failed";

    if (
      message.toLowerCase().includes("session expired") ||
      message.toLowerCase().includes("login again")
    ) {

      clearSession();
      showLoginMessage(
        "⏳ Session expired. Please login again."
      );

      return;
    }

    alert(message);
    return;
  }


  const d = result.data || result;
  data = {
    activities: d.activities || [],
    donors: d.donors || [],
    collections: d.collections || [],
    expenses: d.expenses || [],
    custody: d.custody || [],
    transfers: d.transfers || [],
    users: d.users || [],
    auditLog: d.audit || d.auditLog || [],
    settings: d.settings || []
  };


  render();
}


/* =====================================================
   RENDER
===================================================== */

function render() {

  if (!currentUser)
    return;


  const collectionTotal =
    data.collections.reduce(
      (sum,item) =>
        sum +
        Number(item.amount || 0),
      0
    );


  const expenseTotal =
    data.expenses.reduce(
      (sum,item) =>
        sum +
        Number(item.amount || 0),
      0
    );


  const balance =
    collectionTotal -
    expenseTotal;


  setText(
    "totalCollection",
    money(collectionTotal)
  );


  setText(
    "totalExpense",
    money(expenseTotal)
  );


  setText(
    "balance",
    money(balance)
  );


  setText(
    "donorCount",
    data.donors.length
  );


  renderTable(
    "activitiesTable",
    data.activities,
    [
      "year",
      "name",
      "purpose",
      "openingBalance",
      "status"
    ],
    "Activities"
  );


  renderTable(
    "donorsTable",
    data.donors,
    [
      "name",
      "country",
      "area",
      "phone",
      "note"
    ],
    "Donors"
  );


  renderTable(
    "collectionsTable",
    data.collections,
    [
      "date",
      "donorId",
      "amount",
      "method",
      "note"
    ],
    "Collections"
  );


  renderTable(
    "expensesTable",
    data.expenses,
    [
      "date",
      "recipient",
      "category",
      "amount",
      "method",
      "voucherNo",
      "note"
    ],
    "Expenses"
  );


  renderTable(
    "custodyTable",
    data.custody,
    [
      "locationType",
      "custodianName",
      "amount",
      "date",
      "reason",
      "terms",
      "witnesses",
      "expectedReturnDate",
      "status",
      "note"
    ],
    "FundCustody"
  );


  renderYearSummary();
  renderUsers();
  renderAudit();
  loadSettingsToForm();
}


/* =====================================================
   TABLE WITH ACTION BUTTONS
===================================================== */

function renderTable(
  elementId,
  rows,
  columns,
  sheetName
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element)
    return;


  let html =
    "<div class='table-wrap'>" +
    "<table>" +
    "<thead><tr>";


  columns.forEach(
    function(column) {

      html +=
        "<th>" +
        escapeHtml(
          translateColumn(column)
        ) +
        "</th>";
    }
  );


  html +=
    "<th>" +
    escapeHtml(
      T[lang].action
    ) +
    "</th>";


  html +=
    "</tr></thead><tbody>";


  if (!rows.length) {

    html +=
      "<tr>" +
      "<td colspan='" +
      (columns.length + 1) +
      "'>" +
      "কোনো তথ্য পাওয়া যায়নি।" +
      "</td>" +
      "</tr>";

  } else {

    rows.forEach(
      function(row) {

        html += "<tr>";


        columns.forEach(
          function(column) {

            let value =
              row[column];


            if (
              column === "amount" ||
              column === "openingBalance"
            ) {

              value =
                money(value);
            }


            html +=
              "<td>" +
              escapeHtml(
                value ?? ""
              ) +
              "</td>";
          }
        );


        const id =
          row.id;


        html +=
          "<td class='actions'>" +

          "<button type='button' " +
          "class='btn-edit' " +
          "onclick='editRecord(\"" +
          escapeJs(sheetName) +
          "\",\"" +
          escapeJs(id) +
          "\")'>" +
          "✏️ " +
          escapeHtml(T[lang].edit) +
          "</button>" +

          "<button type='button' " +
          "class='btn-delete' " +
          "onclick='deleteRecord(\"" +
          escapeJs(sheetName) +
          "\",\"" +
          escapeJs(id) +
          "\")'>" +
          "🗑️ " +
          escapeHtml(T[lang].delete) +
          "</button>" +

          "</td>";


        html += "</tr>";
      }
    );
  }


  html +=
    "</tbody></table></div>";


  element.innerHTML =
    html;


  addCrudButton(
    elementId,
    sheetName
  );
}


/* =====================================================
   ADD BUTTON
===================================================== */

function addCrudButton(
  elementId,
  sheetName
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element)
    return;


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "crud-toolbar";


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "btn-add";


  button.textContent =
    "➕ " +
    T[lang].add;


  button.onclick =
    function() {

      addRecordForm(
        sheetName
      );
    };


  element.prepend(
    wrapper
  );


  wrapper.appendChild(
    button
  );
}


/* =====================================================
   ADD FORM
===================================================== */

async function addRecordForm(
  sheetName
) {

  if (!requireLogin())
    return;


  const object =
    getFormData(
      sheetName
    );


  if (!object)
    return;


  const result =
    await api(
      "addRecord",
      {
        sheetName:sheetName,
        object:object,
        userId:currentUser.id
      }
    );


  if (
    !result.ok &&
    !result.success
  ) {

    alert(
      result.message ||
      "Save failed"
    );

    return;
  }


  alert(
    result.message ||
    "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
  );


  await load();
}


/* =====================================================
   FORM DATA
===================================================== */

function getFormData(
  sheetName,
  oldRecord = null
) {

  let object = {};


  if (
    sheetName ===
    "Activities"
  ) {

    const year =
      prompt(
        "Year:",
        oldRecord?.year || ""
      );

    if (year === null)
      return null;


    const name =
      prompt(
        "Activity Name:",
        oldRecord?.name || ""
      );

    if (name === null)
      return null;


    const purpose =
      prompt(
        "Purpose:",
        oldRecord?.purpose || ""
      );

    if (purpose === null)
      return null;


    const openingBalance =
      prompt(
        "Opening Balance:",
        oldRecord?.openingBalance || "0"
      );

    if (openingBalance === null)
      return null;


    const status =
      prompt(
        "Status:",
        oldRecord?.status || ""
      );

    if (status === null)
      return null;


    object = {
      year:year,
      name:name,
      purpose:purpose,
      openingBalance:openingBalance,
      status:status
    };
  }


  else if (
    sheetName ===
    "Donors"
  ) {

    const name =
      prompt(
        "Donor Name:",
        oldRecord?.name || ""
      );

    if (name === null)
      return null;


    const country =
      prompt(
        "Country:",
        oldRecord?.country || ""
      );

    if (country === null)
      return null;


    const area =
      prompt(
        "Area:",
        oldRecord?.area || ""
      );

    if (area === null)
      return null;


    const phone =
      prompt(
        "Phone:",
        oldRecord?.phone || ""
      );

    if (phone === null)
      return null;


    const note =
      prompt(
        "Note:",
        oldRecord?.note || ""
      );

    if (note === null)
      return null;


    object = {
      name:name,
      country:country,
      area:area,
      phone:phone,
      note:note
    };
  }


  else if (
    sheetName ===
    "Collections"
  ) {

    const activityId =
      prompt(
        "Activity ID:",
        oldRecord?.activityId || ""
      );

    if (activityId === null)
      return null;


    const donorId =
      prompt(
        "Donor ID:",
        oldRecord?.donorId || ""
      );

    if (donorId === null)
      return null;


    const amount =
      prompt(
        "Amount:",
        oldRecord?.amount || ""
      );

    if (amount === null)
      return null;


    const method =
      prompt(
        "Method:",
        oldRecord?.method || ""
      );

    if (method === null)
      return null;


    const date =
      prompt(
        "Date (YYYY-MM-DD):",
        oldRecord?.date ||
        today()
      );

    if (date === null)
      return null;


    const note =
      prompt(
        "Note:",
        oldRecord?.note || ""
      );

    if (note === null)
      return null;


    object = {
      activityId:activityId,
      donorId:donorId,
      amount:amount,
      method:method,
      date:date,
      note:note
    };
  }


  else if (
    sheetName ===
    "Expenses"
  ) {

    const activityId =
      prompt(
        "Activity ID:",
        oldRecord?.activityId || ""
      );

    if (activityId === null)
      return null;


    const date =
      prompt(
        "Date (YYYY-MM-DD):",
        oldRecord?.date ||
        today()
      );

    if (date === null)
      return null;


    const recipient =
      prompt(
        "Recipient:",
        oldRecord?.recipient || ""
      );

    if (recipient === null)
      return null;


    const category =
      prompt(
        "Category:",
        oldRecord?.category || ""
      );

    if (category === null)
      return null;


    const amount =
      prompt(
        "Amount:",
        oldRecord?.amount || ""
      );

    if (amount === null)
      return null;


    const method =
      prompt(
        "Method:",
        oldRecord?.method || ""
      );

    if (method === null)
      return null;


    const voucherNo =
      prompt(
        "Voucher No:",
        oldRecord?.voucherNo || ""
      );

    if (voucherNo === null)
      return null;


    const note =
      prompt(
        "Note:",
        oldRecord?.note || ""
      );

    if (note === null)
      return null;


    object = {
      activityId:activityId,
      date:date,
      recipient:recipient,
      category:category,
      amount:amount,
      method:method,
      voucherNo:voucherNo,
      note:note
    };
  }


  else if (
    sheetName ===
    "FundCustody"
  ) {

    const locationType =
      prompt(
        "Location Type (নিজে/ব্যাংক/ব্যক্তি):",
        oldRecord?.locationType || ""
      );

    if (locationType === null)
      return null;


    const custodianName =
      prompt(
        "Custodian Name:",
        oldRecord?.custodianName || ""
      );

    if (custodianName === null)
      return null;


    const amount =
      prompt(
        "Amount:",
        oldRecord?.amount || ""
      );

    if (amount === null)
      return null;


    const date =
      prompt(
        "Date (YYYY-MM-DD):",
        oldRecord?.date ||
        today()
      );

    if (date === null)
      return null;


    const reason =
      prompt(
        "Reason:",
        oldRecord?.reason || ""
      );

    if (reason === null)
      return null;


    const terms =
      prompt(
        "Terms:",
        oldRecord?.terms || ""
      );

    if (terms === null)
      return null;


    const witnesses =
      prompt(
        "Witnesses:",
        oldRecord?.witnesses || ""
      );

    if (witnesses === null)
      return null;


    const expectedReturnDate =
      prompt(
        "Expected Return Date:",
        oldRecord?.expectedReturnDate || ""
      );

    if (expectedReturnDate === null)
      return null;


    const status =
      prompt(
        "Status:",
        oldRecord?.status || ""
      );

    if (status === null)
      return null;


    const note =
      prompt(
        "Note:",
        oldRecord?.note || ""
      );

    if (note === null)
      return null;


    object = {
      locationType:locationType,
      custodianName:custodianName,
      amount:amount,
      date:date,
      reason:reason,
      terms:terms,
      witnesses:witnesses,
      expectedReturnDate:expectedReturnDate,
      status:status,
      note:note
    };
  }


  else {

    alert(
      "এই অংশের Add Form এখনো তৈরি হয়নি।"
    );

    return null;
  }


  return object;
}


/* =====================================================
   EDIT
===================================================== */

async function editRecord(
  sheetName,
  id
) {

  if (!requireLogin())
    return;


  const rows =
    getRowsForSheet(
      sheetName
    );


  const oldRecord =
    rows.find(
      r =>
        String(r.id) ===
        String(id)
    );


  if (!oldRecord) {

    alert(
      "রেকর্ড পাওয়া যায়নি।"
    );

    return;
  }


  const object =
    getFormData(
      sheetName,
      oldRecord
    );


  if (!object)
    return;


  const result =
    await api(
      "updateRecord",
      {
        sheetName:sheetName,
        id:id,
        object:object,
        userId:currentUser.id
      }
    );


  if (
    !result.ok &&
    !result.success
  ) {

    alert(
      result.message ||
      "Update failed"
    );

    return;
  }


  alert(
    result.message ||
    "তথ্য সফলভাবে আপডেট হয়েছে।"
  );


  await load();
}


/* =====================================================
   DELETE
===================================================== */

async function deleteRecord(
  sheetName,
  id
) {

  if (!requireLogin())
    return;


  const ok =
    confirm(
      "আপনি কি নিশ্চিত যে এই রেকর্ডটি Delete করতে চান?\n\nএই কাজটি পরে Undo করা যাবে না।"
    );


  if (!ok)
    return;


  const result =
    await api(
      "deleteRecord",
      {
        sheetName:sheetName,
        id:id,
        userId:currentUser.id
      }
    );


  if (
    !result.ok &&
    !result.success
  ) {

    alert(
      result.message ||
      "Delete failed"
    );

    return;
  }


  alert(
    result.message ||
    "রেকর্ড Delete হয়েছে।"
  );


  await load();
}


/* =====================================================
   DATA MAP
===================================================== */

function getRowsForSheet(
  sheetName
) {

  switch(sheetName) {

    case "Activities":
      return data.activities;

    case "Donors":
      return data.donors;

    case "Collections":
      return data.collections;

    case "Expenses":
      return data.expenses;

    case "FundCustody":
      return data.custody;

    default:
      return [];
  }
}


/* =====================================================
   YEAR SUMMARY
===================================================== */

function renderYearSummary() {

  const el =
    document.getElementById(
      "yearSummary"
    );


  if (!el)
    return;


  const summary = {};


  data.activities.forEach(
    function(item) {

      const year =
        item.year ||
        "Unknown";


      summary[year] =
        (summary[year] || 0) +
        1;
    }
  );


  const years =
    Object.keys(summary)
      .sort()
      .reverse();


  if (!years.length) {

    el.innerHTML =
      "<p>কোনো কার্যক্রম নেই।</p>";

    return;
  }


  let html =
    "<ul>";


  years.forEach(
    function(year) {

      html +=
        "<li>" +
        escapeHtml(year) +
        " : " +
        summary[year] +
        " টি কার্যক্রম" +
        "</li>";
    }
  );


  html += "</ul>";


  el.innerHTML =
    html;
}


/* =====================================================
   ADMIN MENU
===================================================== */

function setupAdminMenu() {

  const isAdmin =
    currentUser &&
    String(currentUser.role)
      .toLowerCase() ===
      "admin";


  [
    "usersNav",
    "auditNav",
    "settingsNav"
  ].forEach(
    function(id) {

      const el =
        document.getElementById(id);


      if (el) {

        el.hidden =
          !isAdmin;
      }
    }
  );
}


/* =====================================================
   USERS
===================================================== */

function renderUsers() {

  const el =
    document.getElementById(
      "usersTable"
    );


  if (!el)
    return;


  if (
    !currentUser ||
    String(currentUser.role)
      .toLowerCase() !==
      "admin"
  ) {

    el.innerHTML =
      "<p>Admin access required.</p>";

    return;
  }


  if (!data.users.length) {

    el.innerHTML =
      "<p>বর্তমানে User API থেকে পাওয়া যাচ্ছে না।</p>";

    return;
  }


  let html =
    "<div class='table-wrap'>" +
    "<table>" +
    "<thead><tr>" +
    "<th>User ID</th>" +
    "<th>Name</th>" +
    "<th>Role</th>" +
    "<th>Status</th>" +
    "</tr></thead><tbody>";


  data.users.forEach(
    function(user) {

      const active =
        user.active === true ||
        String(user.active)
          .toLowerCase() ===
          "true";


      html +=
        "<tr>" +
        "<td>" +
        escapeHtml(user.id) +
        "</td>" +
        "<td>" +
        escapeHtml(user.name) +
        "</td>" +
        "<td>" +
        escapeHtml(user.role) +
        "</td>" +
        "<td>" +
        (
          active
          ? "✅ Active"
          : "❌ Inactive"
        ) +
        "</td>" +
        "</tr>";
    }
  );


  html +=
    "</tbody></table></div>";


  el.innerHTML =
    html;
}


/* =====================================================
   AUDIT
===================================================== */

function renderAudit() {

  const el =
    document.getElementById(
      "auditTable"
    );


  if (!el)
    return;


  if (!data.auditLog.length) {

    el.innerHTML =
      "<p>কোনো Audit Log নেই।</p>";

    return;
  }


  let html =
    "<div class='table-wrap'>" +
    "<table>" +
    "<thead><tr>" +
    "<th>Date</th>" +
    "<th>User</th>" +
    "<th>Action</th>" +
    "<th>Entity</th>" +
    "<th>Details</th>" +
    "</tr></thead><tbody>";


  data.auditLog
    .slice()
    .reverse()
    .forEach(
      function(log) {

        html +=
          "<tr>" +

          "<td>" +
          escapeHtml(
            log.timestamp ?? log.createdAt ?? ""
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            log.userId ?? ""
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            log.action ?? ""
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            log.sheetName ?? log.entity ?? ""
          ) +
          "</td>" +

          "<td>" +
          escapeHtml(
            log.details ?? ""
          ) +
          "</td>" +

          "</tr>";
      }
    );


  html +=
    "</tbody></table></div>";


  el.innerHTML =
    html;
}


/* =====================================================
   SETTINGS
===================================================== */

function loadSettingsToForm() {

  const settings =
    getSettingsObject();


  const nameInput =
    document.getElementById(
      "systemName"
    );


  const languageInput =
    document.getElementById(
      "systemLanguage"
    );


  if (
    nameInput &&
    settings.systemName
  ) {

    nameInput.value =
      settings.systemName;
  }


  if (
    languageInput &&
    settings.language
  ) {

    languageInput.value =
      settings.language;
  }
}


/* =====================================================
   LANGUAGE
===================================================== */

function toggleLang() {

  lang =
    lang === "bn"
      ? "en"
      : "bn";


  document
    .querySelectorAll(
      "[data-t]"
    )
    .forEach(
      function(el) {

        const key =
          el.dataset.t;


        if (
          T[lang] &&
          T[lang][key]
        ) {

          el.textContent =
            T[lang][key];
        }
      }
    );


  render();
}


/* =====================================================
   NAVIGATION
===================================================== */

function show(id) {

  if (!requireLogin())
    return;


  const target =
    document.getElementById(id);


  if (!target)
    return;


  if (
    [
      "users",
      "audit",
      "settings"
    ].includes(id)
  ) {

    if (
      !currentUser ||
      String(currentUser.role)
        .toLowerCase() !==
        "admin"
    ) {

      alert(
        "শুধুমাত্র Admin এই অংশ দেখতে পারবেন।"
      );

      return;
    }
  }


  document
    .querySelectorAll(
      "main > section"
    )
    .forEach(
      function(section) {

        section.hidden =
          true;
      }
    );


  target.hidden =
    false;
}


/* =====================================================
   HELPERS
===================================================== */

function getSettingsObject() {

  const obj = {};


  data.settings.forEach(
    function(item) {

      obj[item.key] =
        item.value;
    }
  );


  return obj;
}


function money(value) {

  return (
    "৳" +
    Number(value || 0)
      .toLocaleString("bn-BD")
  );
}


function today() {

  return new Date()
    .toISOString()
    .slice(0,10);
}


function setText(
  id,
  value
) {

  const el =
    document.getElementById(id);


  if (el) {

    el.textContent =
      value;
  }
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeJs(value) {

  return String(value ?? "")
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /"/g,
      '\\"'
    );
}


function translateColumn(
  column
) {

  const map = {

    year:"Year",
    name:"Name",
    purpose:"Purpose",
    openingBalance:"Opening Balance",
    status:"Status",

    country:"Country",
    area:"Area",
    phone:"Phone",
    note:"Note",

    activityId:"Activity",
    donorId:"Donor",
    amount:"Amount",
    method:"Method",
    date:"Date",

    recipient:"Recipient",
    category:"Category",
    voucherNo:"Voucher No",

    locationType:"Location",
    custodianName:"Custodian",
    reason:"Reason",
    terms:"Terms",
    witnesses:"Witnesses",
    expectedReturnDate:
      "Expected Return Date"
  };


  return (
    map[column] ||
    column
  );
}


/* =====================================================
   ENTER KEY
===================================================== */

document.addEventListener(
  "keydown",
  function(event) {

    if (
      event.key !== "Enter"
    )
      return;


    const loginPage =
      document.getElementById(
        "loginPage"
      );


    if (
      loginPage &&
      loginPage.hidden === false
    ) {

      doLogin();
    }
  }
);
