/**
 * Google Apps Script for Annaprasadam Cash Payments Sheet
 * 
 * Columns:
 * Timestamp | Receipt No | Donor Name | Amount (₹) | Plates | Payment Mode | Payment ID | Phone Number | Location / City | D.O.B | Seva Category | Contribution For | Beneficiary Name | Volunteer / Counter | Language | Status
 *
 * Setup:
 * 1. Create a NEW Google Sheet (e.g., "Annaprasadam_Cash_Payments_2026")
 * 2. Extensions > Apps Script
 * 3. Replace all code with this script and Save
 * 4. Deploy > New deployment:
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy Web App URL and paste into ANNAPRASADAM_CASH_PAYMENTS_SHEET_URL in src/config/sheets.ts
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
  }
  return sheet;
}

function normalizePhone(val) {
  return String(val || "").replace(/\D/g, "").slice(-10);
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
    
    sheet.appendRow([
      timestamp,
      payload.receiptNo || "",
      payload.donorName || "",
      payload.amount || "",
      payload.plates || "",
      payload.paymentMode || "CASH",
      payload.paymentId || "",
      normalizePhone(payload.phoneNumber),
      payload.location || "",
      payload.dob || "",
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
