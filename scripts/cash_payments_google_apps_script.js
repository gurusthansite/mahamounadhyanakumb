/**
 * Google Apps Script for Annaprasadam Cash Payments Sheet
 * 
 * Columns:
 * Timestamp | Receipt No | Donor Name | Amount (₹) | Plates | Payment Mode | Payment ID | Phone Number | Location / City | D.O.B | Aadhar Card | Seva Category | Contribution For | Beneficiary Name | Volunteer / Counter | Language | Status
 *
 * Setup / Update:
 * 1. Open your Cash Google Sheet -> Extensions -> Apps Script
 * 2. Replace code with this script and Save
 * 3. Deploy > Manage deployments > Edit > Version: "New version" > Deploy
 */

const SHEET_NAME = "Cash_Payments";

const HEADERS = [
  "Timestamp",
  "Receipt No",
  "Donor Name",
  "Amount (₹)",
  "Plates",
  "Payment Mode",
  "Payment ID",
  "Phone Number",
  "Location / City",
  "D.O.B",
  "Aadhar Card",
  "Seva Category",
  "Contribution For",
  "Beneficiary Name",
  "Volunteer / Counter",
  "Language",
  "Status"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#ffd966");
    sheet.setFrozenRows(1);
  } else {
    // Check if new headers (like Aadhar Card) need to be added
    const currentCols = sheet.getLastColumn();
    if (currentCols < HEADERS.length) {
      for (let col = currentCols + 1; col <= HEADERS.length; col++) {
        const cell = sheet.getRange(1, col);
        cell.setValue(HEADERS[col - 1]);
        cell.setFontWeight("bold").setBackground("#ffd966");
      }
    }
  }
  return sheet;
}

function normalizePhone(val) {
  return String(val || "").replace(/\D/g, "").slice(-10);
}

function normalizeAadhar(val) {
  const clean = String(val || "").replace(/\D/g, "");
  return clean ? "'" + clean : "";
}

function setupSheetHeaders() {
  const sheet = getOrCreateSheet();
  Logger.log("Cash Sheet and headers ready: " + sheet.getName());
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Annaprasadam Cash Payments Web App Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const sheet = getOrCreateSheet();

    const timestamp = payload.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const cleanPhone = normalizePhone(payload.phoneNumber);
    const cleanAadhar = normalizeAadhar(payload.aadhar);

    sheet.appendRow([
      timestamp,
      payload.receiptNo || "",
      payload.donorName || "",
      payload.amount || "",
      payload.plates || "",
      payload.paymentMode || "CASH",
      payload.paymentId || "",
      cleanPhone ? "'" + cleanPhone : "",
      payload.location || "",
      payload.dob || "",
      cleanAadhar,
      payload.sevaType || payload.category || "",
      payload.contributionFor || "",
      payload.beneficiaryName || "",
      payload.volunteer || "",
      payload.language || "te",
      payload.status || "SUCCESS"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", receiptNo: payload.receiptNo }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
