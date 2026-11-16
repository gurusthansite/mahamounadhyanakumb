/**
 * GOOGLE APPS SCRIPT FOR MMDK DATA REGISTER (/mmdk)
 * Supports: Visitor Entries, Live Phone Check, Visitors List Retrieval, Auto Column Mapping
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
    "Aadhar card",
    "Area",
    "No.of persons",
    "DOB/MRD",
    "Roomno.",
    "Check in",
    "Check out",
    "Checkout status",
    "Timestamp"
  ];

  sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  sheet.getRange(1, 1, 1, standardHeaders.length)
       .setFontWeight("bold")
       .setBackground("#c9daf8")
       .setFontColor("#000000");
  
  sheet.setFrozenRows(1);
  Logger.log("MMDK Sheet headers created successfully in tab: " + sheet.getName());
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
    "Name", "Phone No.", "Aadhar card", "Area", "No.of persons",
    "DOB/MRD", "Roomno.", "Check in", "Check out", "Checkout status", "Timestamp"
  ];

  // If Row 1 is empty or has default "Column 1", write proper headers automatically
  var firstCell = String(sheet.getRange(1, 1).getValue() || '').trim().toLowerCase();
  if (firstCell === "" || firstCell === "column 1") {
    sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
    sheet.getRange(1, 1, 1, standardHeaders.length).setFontWeight("bold").setBackground("#c9daf8");
    sheet.setFrozenRows(1);
  }

  var totalCols = Math.max(sheet.getLastColumn(), standardHeaders.length, 15);
  var headers = sheet.getRange(1, 1, 1, totalCols).getValues()[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) {
    var key = String(headers[h] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (key) colMap[key] = h + 1;
  }

  // Find Aadhar specifically
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
    cAadhar:      cAadhar || colMap['aadharcard'] || colMap['aadhar'] || 3,
    cArea:        colMap['area'] || colMap['city'] || colMap['location'] || 4,
    cPersons:     colMap['noofpersons'] || colMap['persons'] || colMap['members'] || 5,
    cDobMrd:      colMap['dobmrd'] || colMap['dob'] || colMap['mrd'] || 6,
    cRoom:        colMap['roomno'] || colMap['room'] || 7,
    cCheckIn:     colMap['checkin'] || colMap['checkindate'] || 8,
    cCheckOut:    colMap['checkout'] || colMap['checkoutdate'] || 9,
    cStatus:      colMap['checkoutstatus'] || colMap['status'] || 10,
    cTime:        colMap['timestamp'] || colMap['date'] || 11,
    totalCols:    Math.max(sheet.getLastColumn(), 11)
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
              aadhar: String(row[cols.cAadhar - 1] || '').trim(),
              area: String(row[cols.cArea - 1] || '').trim(),
              noOfPersons: String(row[cols.cPersons - 1] || '1').trim(),
              dobMrd: String(row[cols.cDobMrd - 1] || '').trim(),
              roomNo: String(row[cols.cRoom - 1] || '').trim(),
              checkIn: String(row[cols.cCheckIn - 1] || '').trim(),
              checkOut: String(row[cols.cCheckOut - 1] || '').trim(),
              checkoutStatus: String(row[cols.cStatus - 1] || 'Checked In').trim(),
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
                aadhar: String(row[cols.cAadhar - 1] || '').trim(),
                area: String(row[cols.cArea - 1] || '').trim(),
                noOfPersons: String(row[cols.cPersons - 1] || '1').trim(),
                dobMrd: String(row[cols.cDobMrd - 1] || '').trim(),
                roomNo: String(row[cols.cRoom - 1] || '').trim(),
                checkIn: String(row[cols.cCheckIn - 1] || '').trim(),
                checkOut: String(row[cols.cCheckOut - 1] || '').trim(),
                checkoutStatus: String(row[cols.cStatus - 1] || 'Checked In').trim(),
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

      var numCols = Math.max(sheet.getLastColumn(), cols.totalCols, 11);
      var rowData = new Array(numCols).fill("");

      rowData[cols.cName - 1]     = (payload.name || "").trim();
      rowData[cols.cPhone - 1]    = cleanPhone ? "'" + cleanPhone : "";
      rowData[cols.cAadhar - 1]   = cleanAadhar;
      rowData[cols.cArea - 1]     = (payload.area || "").trim();
      rowData[cols.cPersons - 1]  = (payload.noOfPersons || "1").toString().trim();
      rowData[cols.cDobMrd - 1]   = (payload.dobMrd || "").trim();
      rowData[cols.cRoom - 1]     = (payload.roomNo || "").trim();
      rowData[cols.cCheckIn - 1]  = (payload.checkIn || "").trim();
      rowData[cols.cCheckOut - 1] = (payload.checkOut || "").trim();
      rowData[cols.cStatus - 1]   = (payload.checkoutStatus || "Checked In").trim();
      rowData[cols.cTime - 1]     = timestamp;

      sheet.appendRow(rowData);
      var insertedRow = sheet.getLastRow();

      // Explicit direct cell write to guarantee Phone and Aadhar are never lost
      if (cleanPhone) {
        sheet.getRange(insertedRow, cols.cPhone).setValue("'" + cleanPhone);
      }
      if (cleanAadhar) {
        sheet.getRange(insertedRow, cols.cAadhar).setValue(cleanAadhar);
      }
      sheet.getRange(insertedRow, cols.cStatus).setFontWeight("bold");

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
