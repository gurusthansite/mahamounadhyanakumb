/**
 * GOOGLE APPS SCRIPT FOR ANNAPRASADAM & MAHA MOUNA DHYANA KUMBH (v6 - Foolproof Aadhar & Column Mapping)
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Maha Mouna & Annaprasadam Seva API is live and active."
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
    var sheet = ss.getSheetByName("Form_Responses") || 
                ss.getSheetByName("Payments") || 
                ss.getSheetByName("Form_Registrations") || 
                ss.getActiveSheet();

    // Read up to 30 columns in Row 1 to find headers
    var totalCols = Math.max(sheet.getLastColumn(), 25);
    var headers = sheet.getRange(1, 1, 1, totalCols).getValues()[0];
    var colMap = {};
    for (var h = 0; h < headers.length; h++) {
      var val = String(headers[h] || '').trim();
      var key = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key) {
        colMap[key] = h + 1; // 1-based column index
      }
    }

    var cTime        = colMap['timestamp'] || 1;
    var cName        = colMap['donorname'] || colMap['fullname'] || colMap['name'] || 2;
    var cCat         = colMap['sevacategory'] || colMap['category'] || 3;
    var cAmt         = colMap['amount'] || 4;
    var cPlates      = colMap['plates'] || colMap['platescount'] || 5;
    var cDob         = colMap['dob'] || colMap['dateofbirth'] || 6;
    var cPhone       = colMap['phonenumber'] || colMap['phone'] || colMap['mobile'] || 7;
    var cLoc         = colMap['location'] || 8;
    var cLang        = colMap['language'] || 9;
    var cStatus      = colMap['status'] || colMap['paymentstatus'] || 10;
    var cPayId       = colMap['paymentid'] || 11;
    var cReceipt     = colMap['receiptno'] || colMap['receipt'] || 12;
    var cBeneficiary = colMap['beneficiary'] || colMap['beneficiaryinhonorof'] || colMap['beneficiaryname'] || 13;
    var cContrib     = colMap['contributionfor'] || 14;

    // Robust search for Aadhar column (matches 'Aadhar Card', 'Aadhaar', 'Adhar', etc.)
    var cAadhar = 0;
    for (var h = 0; h < headers.length; h++) {
      var hText = String(headers[h] || '').toLowerCase().replace(/[^a-z]/g, '');
      if (hText.indexOf('aadhar') >= 0 || hText.indexOf('adhar') >= 0) {
        cAadhar = h + 1;
        break;
      }
    }
    // If not found in headers, default to column after last known column or 16 (Column P)
    if (!cAadhar) {
      cAadhar = Math.max(sheet.getLastColumn() + 1, 16);
      sheet.getRange(1, cAadhar).setValue("Aadhar Card").setFontWeight("bold");
    }

    var cleanPhone = String(data.phoneNumber || "").replace(/\D/g, "").slice(-10);
    var cleanAadhar = String(data.aadhar || data.aadharNumber || data.aadharCard || "").replace(/\D/g, "");
    var aadharText = cleanAadhar ? "'" + cleanAadhar : "";
    var donorName = (data.donorName || data.fullName || "").trim();
    var beneficiaryName = (data.beneficiaryName || "").trim();
    var contributionFor = (data.contributionFor || (beneficiaryName ? "Someone Else" : "Self"));
    var nowTimestamp = data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    var isPaymentSuccess = (
      (data.action || "").toLowerCase() === "annaprasadam_payment" || 
      (data.action || "").toLowerCase() === "payment_success" || 
      data.status === "SUCCESS" ||
      data.isPaid === true
    );

    var sevaCategory = data.category || (data.plates ? "guruprasadam" : "mahamouna");
    var categoryDisplay = (sevaCategory === "mahamouna") 
      ? "మహా మౌన ధ్యాన కుంభ్ (Maha Mouna)" 
      : "గురు ప్రసాదం (Guru Prasadam)";

    var amountVal = data.amount || (data.plates ? data.plates * 51 : 0);
    var platesVal = data.plates || "-";

    var lastRow = sheet.getLastRow();

    // 1. PAYMENT COMPLETED -> Find matching PENDING row and update to SUCCESS
    if (isPaymentSuccess) {
      var updated = false;

      if (lastRow > 1) {
        var values = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), cAadhar)).getValues();

        for (var i = values.length - 1; i >= 0; i--) {
          var rowPhone = String(values[i][cPhone - 1] || "").replace(/\D/g, "").slice(-10);
          var rowName = String(values[i][cName - 1] || "").trim().toLowerCase();
          var rowStatus = String(values[i][cStatus - 1] || "").trim().toUpperCase();

          var phoneMatches = (cleanPhone && rowPhone && cleanPhone === rowPhone);
          var nameMatches = (donorName && rowName && donorName.toLowerCase().indexOf(rowName) >= 0);

          if ((phoneMatches || nameMatches) && rowStatus !== "SUCCESS") {
            var rowIndex = i + 2;

            sheet.getRange(rowIndex, cStatus).setValue("SUCCESS").setFontColor("#047857").setFontWeight("bold");
            if (data.paymentId) sheet.getRange(rowIndex, cPayId).setValue(data.paymentId);
            if (data.receiptNo) sheet.getRange(rowIndex, cReceipt).setValue(data.receiptNo);
            if (donorName) sheet.getRange(rowIndex, cName).setValue(donorName);
            if (beneficiaryName) sheet.getRange(rowIndex, cBeneficiary).setValue(beneficiaryName);
            if (contributionFor) sheet.getRange(rowIndex, cContrib).setValue(contributionFor);
            if (cleanAadhar) sheet.getRange(rowIndex, cAadhar).setValue(aadharText);
            sheet.getRange(rowIndex, cTime).setValue(nowTimestamp);

            updated = true;
            break;
          }
        }
      }

      // If no pending row was found, insert as a new SUCCESS row
      if (!updated) {
        var numCols = Math.max(sheet.getLastColumn(), cAadhar);
        var rowData = new Array(numCols).fill("");
        rowData[cTime - 1] = nowTimestamp;
        rowData[cName - 1] = donorName;
        rowData[cCat - 1] = categoryDisplay;
        rowData[cAmt - 1] = amountVal;
        rowData[cPlates - 1] = platesVal;
        rowData[cDob - 1] = data.dob || "";
        rowData[cPhone - 1] = cleanPhone ? "'" + cleanPhone : "";
        rowData[cLoc - 1] = data.location || "";
        rowData[cLang - 1] = data.language || "te";
        rowData[cStatus - 1] = "SUCCESS";
        rowData[cPayId - 1] = data.paymentId || "";
        rowData[cReceipt - 1] = data.receiptNo || "";
        rowData[cBeneficiary - 1] = beneficiaryName || "-";
        rowData[cContrib - 1] = contributionFor;
        if (cleanAadhar) rowData[cAadhar - 1] = aadharText;

        sheet.appendRow(rowData);
        var newRow = sheet.getLastRow();
        sheet.getRange(newRow, cStatus).setFontColor("#047857").setFontWeight("bold");
        // Explicitly guarantee Aadhar is written to its specific column
        if (cleanAadhar) {
          sheet.getRange(newRow, cAadhar).setValue(aadharText);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "payment_recorded" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. FORM LEAD -> Record initial PENDING row (skip if already paid)
    else {
      var alreadyPaid = false;
      if (lastRow > 1 && cleanPhone) {
        var vals = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), cAadhar)).getValues();
        for (var k = vals.length - 1; k >= 0; k--) {
          var p = String(vals[k][cPhone - 1] || "").replace(/\D/g, "").slice(-10);
          var st = String(vals[k][cStatus - 1] || "").toUpperCase();
          if (p === cleanPhone && st === "SUCCESS") {
            alreadyPaid = true;
            break;
          }
        }
      }

      if (!alreadyPaid) {
        var numCols = Math.max(sheet.getLastColumn(), cAadhar);
        var pendingRow = new Array(numCols).fill("");
        pendingRow[cTime - 1] = nowTimestamp;
        pendingRow[cName - 1] = donorName;
        pendingRow[cCat - 1] = categoryDisplay;
        pendingRow[cAmt - 1] = amountVal;
        pendingRow[cPlates - 1] = platesVal;
        pendingRow[cDob - 1] = data.dob || "";
        pendingRow[cPhone - 1] = cleanPhone ? "'" + cleanPhone : "";
        pendingRow[cLoc - 1] = data.location || "";
        pendingRow[cLang - 1] = data.language || "te";
        pendingRow[cStatus - 1] = "PENDING";
        pendingRow[cPayId - 1] = "";
        pendingRow[cReceipt - 1] = "";
        pendingRow[cBeneficiary - 1] = beneficiaryName || "-";
        pendingRow[cContrib - 1] = contributionFor;
        if (cleanAadhar) pendingRow[cAadhar - 1] = aadharText;

        sheet.appendRow(pendingRow);
        var insertedRow = sheet.getLastRow();
        sheet.getRange(insertedRow, cStatus).setFontColor("#b45309").setFontWeight("bold");
        // Explicitly guarantee Aadhar is written to its specific column
        if (cleanAadhar) {
          sheet.getRange(insertedRow, cAadhar).setValue(aadharText);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "lead_recorded" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
