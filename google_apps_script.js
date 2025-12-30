// CONFIGURATION
const SHEET_TVS = "TVs";
const SHEET_ORDERS = "Orders";
const SHEET_RATES = "Rates";
const SHEET_ADMINS = "Admins";
const SHEET_AGENDA = "Agenda";

// INITIAL SETUP
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create TVs Sheet
  if (!ss.getSheetByName(SHEET_TVS)) {
    const s = ss.insertSheet(SHEET_TVS);
    s.appendRow(["tvNumber", "location", "state", "remainingDuration", "balance", "last_updated", "deleted"]);
    s.appendRow(["1001", "Lobby", "off", 0, 0, new Date(), false]);
    s.appendRow(["1002", "Room 101", "on", 120, 0, new Date(), false]);
  }

  // Create Orders Sheet
  if (!ss.getSheetByName(SHEET_ORDERS)) {
    const s = ss.insertSheet(SHEET_ORDERS);
    s.appendRow(["id", "tvNumber", "location", "timeBought", "totalCost", "orderDate", "otp", "status", "customerEmail"]);
  }

  // Create Rates Sheet
  if (!ss.getSheetByName(SHEET_RATES)) {
    const s = ss.insertSheet(SHEET_RATES);
    s.appendRow(["days", "price"]);
    s.appendRow([1, 5]);
    s.appendRow([3, 12]);
    s.appendRow([7, 25]);
    s.appendRow([30, 80]);
  }

  // Create Admins Sheet
  if (!ss.getSheetByName(SHEET_ADMINS)) {
    const s = ss.insertSheet(SHEET_ADMINS);
    s.appendRow(["adminId", "email", "password", "fullName", "isAdmin"]);
    s.appendRow(["1", "admin@tvtime.com", "admin123", "Super Admin", true]);
  }

  // Create Agenda Sheet
  if (!ss.getSheetByName(SHEET_AGENDA)) {
    const s = ss.insertSheet(SHEET_AGENDA);
    s.appendRow(["id", "title", "date", "type", "description"]);
    s.appendRow(["evt_1", "System Maintenance", new Date().toISOString().split('T')[0], "maintenance", "Check server logs"]);
  }
}

// HTTP ENTRY POINTS
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const params = e.parameter;
    const route = params.route;
    const method = e.postData ? "POST" : "GET";
    let data = {};
    
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = {};
      }
    }

    let result = {};

    // ROUTING
    if (route === '/public/tv-status') {
      result = getTvStatus(params.tvNumber || data.tvNumber);
    } else if (route === '/public/create-checkout-session') {
      result = createCheckoutSession(data);
    } else if (route === '/public/change-room') {
      result = changeRoom(data);
    } else if (route === '/admin/auth/login') {
      result = adminLogin(data);
    } else if (route === '/admin/all-orders') {
      result = getAllOrders();
    } else if (route === '/admin/all-tvs') {
      result = getAllTVs();
    } else if (route === '/admin/toggle-tv') {
      result = toggleTV(data);
    } else if (route === '/admin/add-tv') {
      result = addTV(data);
    } else if (route === '/admin/update-tv') {
      result = updateTVLocation(data);
    } else if (route === '/admin/agenda/all') {
      result = getAgendaEvents();
    } else if (route === '/admin/agenda/add') {
      result = addAgendaEvent(data);
    } else if (route === '/admin/agenda/delete') {
      result = deleteAgendaEvent(data);
    } else {
      throw new Error("Route not found: " + route);
    }

    return responseJSON(result);
    
  } catch (error) {
    return responseJSON({ error: error.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

// --- CONTROLLERS ---

function getTvStatus(tvNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TVS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(tvNumber) && !rows[i][6]) { 
      return { 
        connected: true, 
        location: rows[i][1],
        state: rows[i][2]
      };
    }
  }
  return { connected: false, location: null };
}

function createCheckoutSession(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ORDERS);
  const orderId = 'ORD-' + Math.floor(Math.random() * 100000);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const cost = 10; 
  
  sheet.appendRow([
    orderId,
    data.tvNumber,
    data.location,
    data.timeBought,
    cost,
    new Date(),
    otp,
    'paid', 
    data.customerEmail || ''
  ]);

  updateTvDuration(data.tvNumber, data.timeBought);
  return { checkoutUrl: 'https://checkout.stripe.com/c/pay/demo_session_success' };
}

function changeRoom(data) {
  return { success: true, message: "Room changed successfully" };
}

function adminLogin(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ADMINS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === data.email && rows[i][2] === data.password) {
      return {
        user: {
          adminId: rows[i][0],
          email: rows[i][1],
          fullName: rows[i][3],
          isAdmin: rows[i][4]
        },
        token: "gs_session_" + Math.random().toString(36).substring(7)
      };
    }
  }
  throw new Error("Invalid Credentials");
}

function getAllTVs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TVS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const tvs = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === true) continue;
    let tv = {};
    for (let j = 0; j < headers.length; j++) {
      tv[headers[j]] = data[i][j];
    }
    tvs.push(tv);
  }
  return { tvs: tvs };
}

function toggleTV(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TVS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.tvNumber)) {
      sheet.getRange(i + 1, 3).setValue(data.newState);
      return { success: true };
    }
  }
  throw new Error("TV Not Found");
}

function addTV(data) {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TVS);
   sheet.appendRow([data.tvNumber, data.location, "off", 0, 0, new Date(), false]);
   return { success: true };
}

function updateTVLocation(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TVS);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.tvNumber)) {
      // Update location column (index 1)
      sheet.getRange(i + 1, 2).setValue(data.location);
      return { success: true };
    }
  }
  throw new Error("TV Not Found");
}

// --- AGENDA FUNCTIONS ---

function getAgendaEvents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_AGENDA);
  const data = sheet.getDataRange().getValues();
  const events = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    events.push({
      id: data[i][0],
      title: data[i][1],
      date: data[i][2], // Expecting YYYY-MM-DD or parseable date
      type: data[i][3],
      description: data[i][4]
    });
  }
  return { events: events };
}

function addAgendaEvent(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_AGENDA);
  const id = 'evt_' + Math.floor(Math.random() * 1000000);
  // Ensure date is string YYYY-MM-DD
  let dateStr = data.date; 
  if (data.date instanceof Date) {
      dateStr = data.date.toISOString().split('T')[0];
  }

  sheet.appendRow([id, data.title, dateStr, data.type, data.description || '']);
  return { success: true, event: { id, ...data, date: dateStr } };
}

function deleteAgendaEvent(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_AGENDA);
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(data.id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("Event Not Found");
}


// --- HELPER FUNCTIONS ---

function updateTvDuration(tvNumber, days) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TVS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(tvNumber)) {
      const currentDuration = Number(rows[i][3]) || 0;
      const addedMinutes = days * 24 * 60;
      sheet.getRange(i + 1, 4).setValue(currentDuration + addedMinutes);
      sheet.getRange(i + 1, 3).setValue("on");
      break;
    }
  }
}

function responseJSON(content, status) {
  return ContentService.createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}