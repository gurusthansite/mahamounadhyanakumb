/**
 * GOOGLE APPS SCRIPT FOR MMDK DATA REGISTER (/mmdk)
 * Setup with DOB: Name | Phone No. | Date of Birth | Aadhar card | Area | Timestamp
 */

// 1. ONE-CLICK SETUP FUNCTION (Run this once from Apps Script)
function setupMmdkSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("MMDK_Data") || 
              ss.getSheetByName("Form_Responses") || 
              ss.getActiveSheet();

  var standardHeaders = [
    "Name",
    "Phone No.",
    "Date of Birth",
    "Aadhar card",
    "Area",
    "Timestamp"
  ];

  // Clear old row 1 completely
  var lastCol = Math.max(sheet.getLastColumn(), 20);
  sheet.getRange(1, 1, 1, lastCol).clearContent().setBackground(null);

  // Set new headers
  sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  sheet.getRange(1, 1, 1, standardHeaders.length)
       .setFontWeight("bold")
       .setBackground("#c9daf8")
       .setFontColor("#000000");
  
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert("✅ Success! Sheet has been updated with DOB in tab: " + sheet.getName());
}

function normalizePhone(val) {
  return String(val || "").replace(/\D/g, "").slice(-10);
}

function normalizeAadhar(val) {
  var clean = String(val || "").replace(/\D/g, "");
  return clean ? "'" + clean : "";
}

function getMmdkSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("MMDK_Data") || 
         ss.getSheetByName("Form_Responses") || 
         ss.getSheetByName("Form Responses 1") || 
         ss.getActiveSheet();
}

function getColumnMapping(sheet) {
  var standardHeaders = [
    "Name", "Phone No.", "Date of Birth", "Aadhar card", "Area", "Timestamp"
  ];

  var firstCell = String(sheet.getRange(1, 1).getValue() || '').trim().toLowerCase();
  if (firstCell === "" || firstCell === "column 1") {
    sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
    sheet.getRange(1, 1, 1, standardHeaders.length).setFontWeight("bold").setBackground("#c9daf8");
    sheet.setFrozenRows(1);
  }

  var totalCols = Math.max(sheet.getLastColumn(), standardHeaders.length, 12);
  var headers = sheet.getRange(1, 1, 1, totalCols).getValues()[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) {
    var key = String(headers[h] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key) colMap[key] = h + 1;
  }

  var cAadhar = 0;
  for (var i = 0; i < headers.length; i++) {
    var hText = String(headers[i] || '').toLowerCase().replace(/[^a-z]/g, '');
    if (hText.indexOf('aadhar') >= 0 || hText.indexOf('adhar') >= 0) {
      cAadhar = i + 1;
      break;
    }
  }

  return {
    cName:        colMap['name'] || colMap['visitorname'] || colMap['fullname'] || 1,
    cPhone:       colMap['phoneno'] || colMap['phone'] || colMap['contact'] || colMap['mobile'] || 2,
    cDob:         colMap['dateofbirth'] || colMap['dob'] || colMap['dobmrd'] || 3,
    cAadhar:      cAadhar || colMap['aadharcard'] || colMap['aadhar'] || 4,
    cArea:        colMap['area'] || colMap['city'] || colMap['location'] || 5,
    cTime:        colMap['timestamp'] || colMap['date'] || 6,
    totalCols:    Math.max(sheet.getLastColumn(), 6)
  };
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "";
    var sheet = getMmdkSheet();
    var cols = getColumnMapping(sheet);

    if (action === "get_all") {
      var lastRow = sheet.getLastRow();
      var records = [];

      if (lastRow > 1) {
        var numCols = Math.max(sheet.getLastColumn(), cols.totalCols);
        var values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

        for (var i = 0; i < values.length; i++) {
          var row = values[i];
          var rawPhone = row[cols.cPhone - 1];
          var phone = normalizePhone(rawPhone);
          var rawName = String(row[cols.cName - 1] || '').trim();

          if (phone || rawName) {
            records.push({
              name: rawName,
              contact: phone || String(rawPhone || '').trim(),
              dob: String(row[cols.cDob - 1] || '').trim(),
              aadhar: String(row[cols.cAadhar - 1] || '').trim(),
              area: String(row[cols.cArea - 1] || '').trim(),
              timestamp: String(row[cols.cTime - 1] || '').trim()
            });
          }
        }
      }

      return ContentService
        .createTextOutput(JSON.stringify({ status: "ok", records: records }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", message: "MMDK Data Web App Active" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server busy, could not acquire lock"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var rawData = e.postData ? e.postData.contents : "";
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "No data payload received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(rawData);
    var sheet = getMmdkSheet();
    var cols = getColumnMapping(sheet);

    // 1. CHECK PHONE NUMBER EXISTENCE
    if (payload.action === "check") {
      var target = normalizePhone(payload.contact);
      var lastRow = sheet.getLastRow();

      if (lastRow > 1 && target) {
        var numCols = Math.max(sheet.getLastColumn(), cols.totalCols);
        var values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

        for (var i = 0; i < values.length; i++) {
          var row = values[i];
          var rowPhone = normalizePhone(row[cols.cPhone - 1]);

          if (rowPhone === target) {
            return ContentService.createTextOutput(JSON.stringify({
              status: "exists",
              data: {
                name: String(row[cols.cName - 1] || '').trim(),
                contact: rowPhone,
                dob: String(row[cols.cDob - 1] || '').trim(),
                aadhar: String(row[cols.cAadhar - 1] || '').trim(),
                area: String(row[cols.cArea - 1] || '').trim(),
                timestamp: String(row[cols.cTime - 1] || '').trim()
              }
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. SUBMIT / SAVE VISITOR ENTRY
    if (payload.action === "submit") {
      var timestamp = payload.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      var cleanPhone = normalizePhone(payload.contact);
      var cleanAadhar = normalizeAadhar(payload.aadhar);

      var numCols = Math.max(sheet.getLastColumn(), cols.totalCols, 6);
      var rowData = new Array(numCols).fill("");

      rowData[cols.cName - 1]     = (payload.name || "").trim();
      rowData[cols.cPhone - 1]    = cleanPhone ? "'" + cleanPhone : "";
      rowData[cols.cDob - 1]      = (payload.dob || "").trim();
      rowData[cols.cAadhar - 1]   = cleanAadhar;
      rowData[cols.cArea - 1]     = (payload.area || "").trim();
      rowData[cols.cTime - 1]     = timestamp;

      sheet.appendRow(rowData);
      var insertedRow = sheet.getLastRow();

      if (cleanPhone) {
        sheet.getRange(insertedRow, cols.cPhone).setValue("'" + cleanPhone);
      }
      if (cleanAadhar) {
        sheet.getRange(insertedRow, cols.cAadhar).setValue(cleanAadhar);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "saved",
        message: "Visitor entry recorded successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
