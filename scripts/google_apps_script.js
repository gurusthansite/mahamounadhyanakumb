/**
 * GOOGLE APPS SCRIPT FOR ANNAPRASADAM & MAHA MOUNA DHYANA KUMBH
 * 
 * Instructions:
 * 1. Open your target Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this script.
 * 4. Click Save (Ctrl+S / Cmd+S).
 * 5. Click "Deploy" > "New deployment".
 * 6. Select type: "Web app".
 * 7. Set:
 *    - Description: "Annaprasadam & Maha Mouna Payments Webhook v2"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (IMPORTANT: do not choose 'Only myself')
 * 8. Click "Deploy" and Authorize access when prompted.
 * 9. Copy the generated "Web App URL".
 * 10. Update ANNAPRASADAM_PAYMENTS_SHEET_URL in src/config/sheets.ts if you created a new deployment.
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Annaprasadam & Maha Mouna Payments API is active."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent requests
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

    var data;
    try {
      data = JSON.parse(rawData);
    } catch (parseErr) {
      data = e.parameter || {};
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (data.action || "").toLowerCase();

    // -------------------------------------------------------------
    // 1. ACTION: SUCCESSFUL PAYMENT (annaprasadam_payment)
    // -------------------------------------------------------------
    if (action === "annaprasadam_payment" || data.status === "SUCCESS") {
      var paySheet = getOrCreateSheet(ss, "Successful_Payments", [
        "Timestamp",
        "Receipt No",
        "Donor Name",
        "Seva Category",
        "Amount (₹)",
        "Plates",
        "D.O.B",
        "Phone Number",
        "Location",
        "Payment ID",
        "Order ID",
        "Status",
        "Seva Description"
      ]);

      var sevaCategory = data.category || (data.plates ? "guruprasadam" : "mahamouna");
      var categoryDisplay = (sevaCategory === "mahamouna") 
        ? "మహా మౌన ధ్యాన కుంభ్ (Maha Mouna)" 
        : "గురు ప్రసాదం (Guru Prasadam)";

      paySheet.appendRow([
        data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        data.receiptNo || "",
        data.donorName || data.fullName || "",
        categoryDisplay,
        data.amount || (data.plates ? data.plates * 51 : 0),
        data.plates || "-",
        data.dob || "",
        data.phoneNumber ? "'" + data.phoneNumber : "",
        data.location || "",
        data.paymentId || "",
        data.orderId || "",
        "SUCCESS",
        data.sevaType || ""
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        type: "payment_recorded",
        receiptNo: data.receiptNo || ""
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------
    // 2. ACTION: FORM FILL / LEAD SYNC (form_fill)
    // -------------------------------------------------------------
    else {
      var leadSheet = getOrCreateSheet(ss, "Form_Registrations", [
        "Timestamp",
        "Donor Name",
        "Seva Category",
        "Amount (₹)",
        "Plates",
        "D.O.B",
        "Phone Number",
        "Location",
        "Language",
        "Status"
      ]);

      var leadCategory = data.category || (data.plates ? "guruprasadam" : "mahamouna");
      var leadCategoryDisplay = (leadCategory === "mahamouna") 
        ? "మహా మౌన ధ్యాన కుంభ్ (Maha Mouna)" 
        : "గురు ప్రసాదం (Guru Prasadam)";

      leadSheet.appendRow([
        data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        data.donorName || data.fullName || "",
        leadCategoryDisplay,
        data.amount || (data.plates ? data.plates * 51 : 0),
        data.plates || "-",
        data.dob || "",
        data.phoneNumber ? "'" + data.phoneNumber : "",
        data.location || "",
        data.language || "te",
        data.status || "PENDING"
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        type: "lead_recorded"
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
 * Helper: Find sheet by name or create it with headers if missing.
 */
function getOrCreateSheet(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    // Format header row: bold, dark maroon background, amber text
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#381609");
    headerRange.setFontColor("#ffca08");
    sheet.setFrozenRows(1);
  }
  return sheet;
}
