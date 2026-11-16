/**
 * GOOGLE APPS SCRIPT FOR ANNAPRASADAM & MAHA MOUNA CASH PORTAL (v4 - Fixed Column Collision)
 * Includes: One-Click Sheet Setup, Auto Column Mapping, Receipt No & Aadhar Support
 */

// 1. ONE-CLICK SETUP FUNCTION (Run this once from Apps Script)
function setupCashSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Cash_Payments") || 
              ss.getSheetByName("Form_Responses") || 
              ss.getActiveSheet();

  var standardHeaders = [
    "Timestamp",
    "Receipt No",
    "Donor Name",
    "Amount",
    "Plates",
    "Payment Mode",
    "Payment ID",
    "Phone Number",
    "Location",
    "Date of Birth",
    "Aadhar Card",
    "Seva Category",
    "Contribution For",
    "Beneficiary Name",
    "Volunteer",
    "Language",
    "Status"
  ];

  sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  sheet.getRange(1, 1, 1, standardHeaders.length)
       .setFontWeight("bold")
       .setBackground("#ffd966")
       .setFontColor("#000000");
  
  sheet.setFrozenRows(1);
  Logger.log("Cash Sheet headers updated successfully in tab: " + sheet.getName());
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Annaprasadam Cash Payments API is live and active."
  })).setMimeType(ContentService.MimeType.JSON);
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

    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Cash_Payments") || 
                ss.getSheetByName("Form_Responses") || 
                ss.getActiveSheet();

    // Read up to 30 columns in Row 1 to find headers
    var totalCols = Math.max(sheet.getLastColumn(), 25);
    var headers = sheet.getRange(1, 1, 1, totalCols).getValues()[0];
    var colMap = {};
    for (var h = 0; h < headers.length; h++) {
      var key = String(headers[h] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key) colMap[key] = h + 1;
    }

    // Dynamic Column Mapping from your actual headers
    var cTime        = colMap['timestamp'] || 1;
    var cReceipt     = colMap['receiptno'] || colMap['receipt'] || colMap['receiptnumber'] || 2;
    var cName        = colMap['donorname'] || colMap['fullname'] || colMap['name'] || 3;
    var cAmt         = colMap['amount'] || 4;
    var cPlates      = colMap['plates'] || colMap['platescount'] || 5;
    var cPayMode     = colMap['paymentmode'] || colMap['mode'] || 6;
    var cPayId       = colMap['paymentid'] || 7;
    var cPhone       = colMap['phonenumber'] || colMap['phone'] || colMap['mobile'] || 8;
    var cLoc         = colMap['location'] || colMap['city'] || 9;
    var cDob         = colMap['dob'] || colMap['dateofbirth'] || 10;
    var cCat         = colMap['sevacategory'] || colMap['category'] || colMap['sevatype'] || 12;
    var cContrib     = colMap['contributionfor'] || 13;
    var cBeneficiary = colMap['beneficiaryname'] || colMap['beneficiary'] || 14;
    var cVolunteer   = colMap['volunteer'] || colMap['counter'] || 15;
    var cLang        = colMap['language'] || 16;
    var cStatus      = colMap['status'] || 17;

    // Search Row 1 specifically for Aadhar Card column
    var cAadhar = 0;
    for (var i = 0; i < headers.length; i++) {
      var hText = String(headers[i] || '').toLowerCase().replace(/[^a-z]/g, '');
      if (hText.indexOf('aadhar') >= 0 || hText.indexOf('adhar') >= 0) {
        cAadhar = i + 1;
        break;
      }
    }

    // If Aadhar column doesn't exist in sheet, add it at the next empty column
    if (!cAadhar) {
      cAadhar = Math.max(sheet.getLastColumn() + 1, 11);
      sheet.getRange(1, cAadhar).setValue("Aadhar Card").setFontWeight("bold").setBackground("#ffd966");
    }

    var cleanPhone = String(data.phoneNumber || "").replace(/\D/g, "").slice(-10);
    var cleanAadhar = String(data.aadhar || data.aadharNumber || data.aadharCard || "").replace(/\D/g, "");
    var aadharText = cleanAadhar ? "'" + cleanAadhar : "";
    var nowTimestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Build row data
    var numCols = Math.max(sheet.getLastColumn(), cAadhar, 17);
    var rowData = new Array(numCols).fill("");

    rowData[cTime - 1]        = nowTimestamp;
    rowData[cReceipt - 1]     = data.receiptNo || "";
    rowData[cName - 1]        = (data.donorName || data.fullName || "").trim();
    rowData[cAmt - 1]         = data.amount || "";
    rowData[cPlates - 1]      = data.plates || "-";
    rowData[cPayMode - 1]     = data.paymentMode || "CASH";
    rowData[cPayId - 1]       = data.paymentId || "";
    rowData[cPhone - 1]       = cleanPhone ? "'" + cleanPhone : "";
    rowData[cLoc - 1]         = data.location || "";
    rowData[cDob - 1]         = data.dob || "";
    rowData[cCat - 1]         = data.sevaType || data.category || "Guru Prasadam Annaprasadam";
    rowData[cContrib - 1]     = data.contributionFor || "Self";
    rowData[cBeneficiary - 1] = data.beneficiaryName || "-";
    rowData[cVolunteer - 1]   = data.volunteer || "Counter Cash Desk";
    rowData[cLang - 1]        = data.language || "te";
    rowData[cStatus - 1]      = data.status || "CASH_COLLECTED";

    // Place Aadhar in rowData
    if (cAadhar > 0) {
      rowData[cAadhar - 1] = aadharText;
    }

    // Append the row to Google Sheet
    sheet.appendRow(rowData);

    // Style the status cell
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, cStatus).setFontColor("#047857").setFontWeight("bold");

    // DIRECT CELL WRITE: Guaranteed to place Aadhar number into the exact Aadhar column
    if (cleanAadhar && cAadhar > 0) {
      sheet.getRange(lastRow, cAadhar).setValue(aadharText);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      receiptNo: data.receiptNo || "",
      message: "Cash entry recorded successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
