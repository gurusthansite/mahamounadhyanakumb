/**
 * Google Apps Script for MMDK Data Register Sheet
 * Columns:
 * Name | Phone No. | Aadhar card | Area | No.of persons | DOB/MRD | Roomno. | Check in | Check out | Checkout status | Timestamp
 *
 * Deployment:
 * 1. Open your MMDK Google Sheet -> Extensions -> Apps Script
 * 2. Paste this code and Save
 * 3. Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into MMDK_DATA_SCRIPT_URL in src/config/sheets.ts
 */

const SHEET_NAME = "MMDK_Data";

const HEADERS = [
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

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function normalizePhone(val) {
  return String(val || "").replace(/\D/g, "").slice(-10);
}

function rowToRecord(row) {
  return {
    name: row[0] || "",
    contact: normalizePhone(row[1]),
    aadhar: row[2] || "",
    area: row[3] || "",
    noOfPersons: row[4] || "",
    dobMrd: row[5] || "",
    roomNo: row[6] || "",
    checkIn: row[7] || "",
    checkOut: row[8] || "",
    checkoutStatus: row[9] || "",
    timestamp: row[10] || ""
  };
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";
  if (action === "get_all") {
    const sheet = getOrCreateSheet();
    const values = sheet.getDataRange().getValues();
    const records = [];
    for (let i = 1; i < values.length; i++) {
      const rec = rowToRecord(values[i]);
      if (rec.contact) records.push(rec);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", records: records }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "MMDK Data Web App Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const sheet = getOrCreateSheet();

    if (payload.action === "check") {
      const target = normalizePhone(payload.contact);
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (normalizePhone(values[i][1]) === target) {
          return ContentService
            .createTextOutput(JSON.stringify({ status: "exists", data: rowToRecord(values[i]) }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: "not_found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === "submit") {
      const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      sheet.appendRow([
        payload.name || "",
        normalizePhone(payload.contact),
        payload.aadhar || "",
        payload.area || "",
        payload.noOfPersons || "",
        payload.dobMrd || "",
        payload.roomNo || "",
        payload.checkIn || "",
        payload.checkOut || "",
        payload.checkoutStatus || "",
        timestamp
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ status: "saved" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
