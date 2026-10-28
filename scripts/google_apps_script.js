/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT FOR ANNAPRASADAM & MAHA MOUNA DHYANA KUMBH (v3)
 * ==============================================================================
 * 
 * Features:
 * 1. Automatically records form leads as "PENDING".
 * 2. As soon as Razorpay payment completes, it instantly updates the matching 
 *    pending row to "SUCCESS" and fills in the Payment ID & Receipt Number!
 * 3. Records "Beneficiary / In Honor Of" name if contributed for someone else.
 * 4. Never loses any payment record even if concurrent requests arrive (LockService).
 * 
 * Instructions:
 * 1. In your Google Sheet, click Extensions > Apps Script.
 * 2. Delete all existing code and paste this entire script.
 * 3. Click Save (Ctrl+S / Cmd+S).
 * 4. Click "Deploy" > "Manage deployments" (or "New deployment").
 * 5. Edit deployment or create new "Web app":
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (CRITICAL: Do not select 'Only myself')
 * 6. Click Deploy.
 * ==============================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Maha Mouna & Annaprasadam Seva API is live and active."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 💡 RUN THIS ONCE TO IMMEDIATELY SET UP HEADERS IN YOUR SHEET:
 * Select "setupSheetHeaders" in the function dropdown at the top of Apps Script and click "Run".
 */
function setupSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateMainSheet(ss);
  Logger.log("Headers successfully configured on sheet: " + sheet.getName());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for concurrent requests
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

    var data;
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter || {};
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateMainSheet(ss);

    var action = (data.action || "").toLowerCase();
    var isPaymentSuccess = (
      action === "annaprasadam_payment" || 
      action === "payment_success" || 
      data.status === "SUCCESS"
    );

    var cleanPhone = String(data.phoneNumber || "").replace(/\D/g, "").slice(-10);
    var donorName = (data.donorName || data.fullName || "").trim();
    var beneficiaryName = (data.beneficiaryName || "").trim();
    var contributionFor = (data.contributionFor || (beneficiaryName ? "Someone Else" : "Self"));
    var nowTimestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    var sevaCategory = data.category || (data.plates ? "guruprasadam" : "mahamouna");
    var categoryDisplay = (sevaCategory === "mahamouna") 
      ? "మహా మౌన ధ్యాన కుంభ్ (Maha Mouna)" 
      : "గురు ప్రసాదం (Guru Prasadam)";

    var amountVal = data.amount || (data.plates ? data.plates * 51 : 0);
    var platesVal = data.plates || "-";

    // =========================================================================
    // 1. PAYMENT COMPLETED (Update PENDING row -> SUCCESS)
    // =========================================================================
    if (isPaymentSuccess) {
      var updated = false;
      var lastRow = sheet.getLastRow();

      // Scan rows from bottom upwards to find matching PENDING row
      if (lastRow > 1) {
        var range = sheet.getRange(2, 1, lastRow - 1, 14);
        var values = range.getValues();

        for (var i = values.length - 1; i >= 0; i--) {
          var rowPhone = String(values[i][6] || "").replace(/\D/g, "").slice(-10); // Col 7 (Phone)
          var rowName = String(values[i][1] || "").trim();                       // Col 2 (Name)
          var rowStatus = String(values[i][9] || "").toUpperCase();              // Col 10 (Status)

          var phoneMatches = (cleanPhone && rowPhone && cleanPhone === rowPhone);
          var nameMatches = (donorName && rowName && donorName.toLowerCase() === rowName.toLowerCase());

          if ((phoneMatches || nameMatches) && rowStatus !== "SUCCESS") {
            var rowIndex = i + 2; // 1-based index in sheet

            // Update Status to SUCCESS
            sheet.getRange(rowIndex, 10).setValue("SUCCESS");
            sheet.getRange(rowIndex, 10).setFontColor("#047857").setFontWeight("bold");

            // Fill Payment ID (Col 11) & Receipt No (Col 12)
            if (data.paymentId) sheet.getRange(rowIndex, 11).setValue(data.paymentId);
            if (data.receiptNo) sheet.getRange(rowIndex, 12).setValue(data.receiptNo);

            // Beneficiary (Col 13) & Contribution For (Col 14)
            if (beneficiaryName) sheet.getRange(rowIndex, 13).setValue(beneficiaryName);
            if (contributionFor) sheet.getRange(rowIndex, 14).setValue(contributionFor);

            // Update timestamp
            sheet.getRange(rowIndex, 1).setValue(nowTimestamp);

            updated = true;
            break;
          }
        }
      }

      // If no matching pending row was found, append as a fresh SUCCESS row
      if (!updated) {
        sheet.appendRow([
          nowTimestamp,
          donorName,
          categoryDisplay,
          amountVal,
          platesVal,
          data.dob || "",
          cleanPhone ? "'" + cleanPhone : "",
          data.location || "",
          data.language || "te",
          "SUCCESS",
          data.paymentId || "",
          data.receiptNo || "",
          beneficiaryName || "-",
          contributionFor
        ]);

        var newLast = sheet.getLastRow();
        sheet.getRange(newLast, 10).setFontColor("#047857").setFontWeight("bold");
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        type: "payment_recorded",
        receiptNo: data.receiptNo || "",
        updatedExisting: updated
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 2. LEAD / FORM SUBMISSION (Initial entry as PENDING)
    // =========================================================================
    else {
      sheet.appendRow([
        nowTimestamp,
        donorName,
        categoryDisplay,
        amountVal,
        platesVal,
        data.dob || "",
        cleanPhone ? "'" + cleanPhone : "",
        data.location || "",
        data.language || "te",
        "PENDING",
        "",
        "",
        beneficiaryName || "-",
        contributionFor
      ]);

      var pendingRow = sheet.getLastRow();
      sheet.getRange(pendingRow, 10).setFontColor("#b45309").setFontWeight("bold");

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        type: "lead_recorded",
        row: pendingRow
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ensures the main sheet exists and has all 14 standard headers.
 */
function getOrCreateMainSheet(ss) {
  var sheet = ss.getSheetByName("Form_Registrations") || ss.getSheets()[0];
  var headers = [
    "Timestamp",
    "Donor Name",
    "Seva Category",
    "Amount (₹)",
    "Plates",
    "D.O.B",
    "Phone Number",
    "Location",
    "Language",
    "Status",
    "Payment ID",
    "Receipt No",
    "Beneficiary (In Honor Of)",
    "Contribution For"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#381609");
    headerRange.setFontColor("#ffca08");
    sheet.setFrozenRows(1);
  } else {
    // Check if extra headers (Payment ID, Receipt No, etc.) are missing and add them
    var currentHeaderCount = sheet.getLastColumn();
    if (currentHeaderCount < headers.length) {
      for (var col = currentHeaderCount + 1; col <= headers.length; col++) {
        var cell = sheet.getRange(1, col);
        cell.setValue(headers[col - 1]);
        cell.setFontWeight("bold");
        cell.setBackground("#381609");
        cell.setFontColor("#ffca08");
      }
    }
  }

  return sheet;
}
