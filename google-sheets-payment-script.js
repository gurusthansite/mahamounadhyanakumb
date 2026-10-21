function setupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup Payments Sheet
  var paySheet = ss.getSheetByName("Payments");
  if (!paySheet) {
    paySheet = ss.insertSheet("Payments", 0);
  }
  var payHeaders = [
    "Timestamp (IST)",
    "Receipt No",
    "Donor Name",
    "Date of Birth",
    "Phone Number",
    "Location",
    "Plates Count",
    "Assigned Plate No",
    "Amount (INR)",
    "Razorpay Payment ID",
    "Razorpay Order ID",
    "Payment Status",
    "Seva Type"
  ];
  if (paySheet.getLastRow() === 0) {
    paySheet.appendRow(payHeaders);
  }
  var payHeaderRange = paySheet.getRange(1, 1, 1, payHeaders.length);
  payHeaderRange.setBackground("#381609");
  payHeaderRange.setFontColor("#ffca08");
  payHeaderRange.setFontWeight("bold");
  paySheet.setFrozenRows(1);

  // 2. Setup Form Registrations Sheet
  var regSheet = ss.getSheetByName("Form_Registrations");
  if (!regSheet) {
    regSheet = ss.insertSheet("Form_Registrations", 1);
  }
  var regHeaders = [
    "Timestamp (IST)",
    "Donor Name",
    "Date of Birth",
    "Phone Number",
    "Location",
    "Plates Count",
    "Assigned Plate No",
    "Estimated Amount (INR)",
    "Payment Status",
    "Payment ID / Reference",
    "Receipt No",
    "Source"
  ];
  if (regSheet.getLastRow() === 0) {
    regSheet.appendRow(regHeaders);
  }
  var regHeaderRange = regSheet.getRange(1, 1, 1, regHeaders.length);
  regHeaderRange.setBackground("#1e293b");
  regHeaderRange.setFontColor("#38bdf8");
  regHeaderRange.setFontWeight("bold");
  regSheet.setFrozenRows(1);

  // 3. Setup Plate Locks Database Sheet (For permanent locking & duplicate prevention)
  var lockSheet = ss.getSheetByName("Plate_Locks");
  if (!lockSheet) {
    lockSheet = ss.insertSheet("Plate_Locks", 2);
  }
  var lockHeaders = [
    "Plate Number",
    "Lock Status",
    "Donor Name",
    "Date of Birth",
    "Phone Number",
    "Plates Count",
    "Amount (INR)",
    "Payment ID",
    "Lock Token",
    "Locked Timestamp (IST)",
    "Expires At (IST)"
  ];
  if (lockSheet.getLastRow() === 0) {
    lockSheet.appendRow(lockHeaders);
  }
  var lockHeaderRange = lockSheet.getRange(1, 1, 1, lockHeaders.length);
  lockHeaderRange.setBackground("#064e3b");
  lockHeaderRange.setFontColor("#34d399");
  lockHeaderRange.setFontWeight("bold");
  lockSheet.setFrozenRows(1);

  // Delete default empty Sheet1 if exists
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(err) {}
  }
}

function doPost(e) {
  var scriptLock = LockService.getScriptLock();
  try {
    // Acquire lock for thread-safe ACID plate assignment
    scriptLock.waitLock(20000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss.getSheets().length < 3) {
      setupAllSheets();
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var now = new Date();
    var nowIST = Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    var timestamp = data.timestamp || nowIST;

    var action = (data.action || "").toString().trim().toLowerCase();
    var donorName = (data.donorName || data.fullName || data.name || "").toString().trim();
    var dob = (data.dob || data.dateOfBirth || "").toString().trim();
    var phoneNumber = (data.phoneNumber || data.phone || data.contact || data.donor_mobile || "").toString().replace(/\D/g, "").slice(-10);
    var location = (data.location || data.address || data.city || "").toString().trim();
    var plates = data.plates ? String(data.plates) : "1";
    var platesNum = parseInt(plates, 10) || 1;
    var plateNumber = (data.plateNumber || data.assignedPlateNumber || "").toString().trim().toUpperCase();
    var amount = data.amount ? String(data.amount) : String(platesNum * 1);
    var paymentId = (data.paymentId || data.razorpay_payment_id || "").toString().trim();
    var orderId = (data.orderId || data.razorpay_order_id || "").toString().trim();
    var receiptNo = (data.receiptNo || "").toString().trim();
    var lockToken = (data.lockToken || "").toString().trim();
    var sevaType = data.sevaType || "Annaprasadam Seva - Arunachalam";
    var status = (data.status || (paymentId ? "SUCCESS" : "PENDING")).toString().toUpperCase();

    var lockSheet = ss.getSheetByName("Plate_Locks");

    // Handle explicit plate lock check/reservation
    if (action === "lock_plate" && plateNumber) {
      var lockRows = lockSheet.getDataRange().getValues();
      for (var r = 1; r < lockRows.length; r++) {
        var existingPlate = String(lockRows[r][0]).toUpperCase();
        var existingStatus = String(lockRows[r][1]).toUpperCase();
        var existingExpires = new Date(lockRows[r][10]);

        if (existingPlate === plateNumber) {
          if (existingStatus === "LOCKED") {
            return ContentService.createTextOutput(JSON.stringify({
              success: false,
              error: "Plate number " + plateNumber + " is already permanently locked."
            })).setMimeType(ContentService.MimeType.JSON);
          } else if (existingStatus === "PENDING" && existingExpires > now && lockRows[r][8] !== lockToken) {
            return ContentService.createTextOutput(JSON.stringify({
              success: false,
              error: "Plate number " + plateNumber + " is currently reserved by another pending transaction."
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      // Add pending lock (15 minutes)
      var expiresAtDate = new Date(now.getTime() + 15 * 60 * 1000);
      var expiresAtStr = Utilities.formatDate(expiresAtDate, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
      lockSheet.appendRow([
        plateNumber,
        "PENDING",
        donorName,
        dob,
        phoneNumber,
        plates,
        amount,
        "",
        lockToken,
        nowIST,
        expiresAtStr
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        plateNumber: plateNumber,
        status: "PENDING",
        expiresAt: expiresAtStr
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. If it's a payment (Verified Success)
    if (paymentId || status === "SUCCESS") {
      // Permanently lock plate in Plate_Locks sheet
      if (plateNumber && lockSheet) {
        var lockRows = lockSheet.getDataRange().getValues();
        var updated = false;
        for (var r = 1; r < lockRows.length; r++) {
          if (String(lockRows[r][0]).toUpperCase() === plateNumber) {
            lockSheet.getRange(r + 1, 2).setValue("LOCKED");
            lockSheet.getRange(r + 1, 8).setValue(paymentId);
            lockSheet.getRange(r + 1, 10).setValue(nowIST);
            updated = true;
            break;
          }
        }
        if (!updated) {
          lockSheet.appendRow([
            plateNumber,
            "LOCKED",
            donorName,
            dob,
            phoneNumber,
            plates,
            amount,
            paymentId,
            lockToken,
            nowIST,
            "PERMANENT"
          ]);
        }
      }

      var paySheet = ss.getSheetByName("Payments") || ss.getActiveSheet();
      paySheet.appendRow([
        timestamp,
        receiptNo || ("MK-" + Utilities.formatDate(now, "Asia/Kolkata", "ddMM") + "-" + (paymentId.slice(-4) || "108")),
        donorName,
        dob,
        phoneNumber,
        location,
        plates,
        plateNumber || "—",
        amount,
        paymentId,
        orderId,
        "SUCCESS",
        sevaType
      ]);

      var regSheet = ss.getSheetByName("Form_Registrations");
      if (regSheet) {
        regSheet.appendRow([
          timestamp,
          donorName,
          dob,
          phoneNumber,
          location,
          plates,
          plateNumber || "—",
          amount,
          "PAID",
          paymentId,
          receiptNo,
          "Website Online Payment"
        ]);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "success", 
          message: "Payment and plate lock permanently recorded", 
          receiptNo: receiptNo, 
          paymentId: paymentId,
          plateNumber: plateNumber,
          isPlateLocked: true
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. If it's a form entry (lead before payment)
    var regSheetDefault = ss.getSheetByName("Form_Registrations") || ss.getActiveSheet();
    regSheetDefault.appendRow([
      timestamp,
      donorName,
      dob,
      phoneNumber,
      location,
      plates,
      plateNumber || "—",
      amount,
      status || "PENDING",
      paymentId || "Not Paid Yet",
      receiptNo || "—",
      "Website Form Fill"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Form entry recorded" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      scriptLock.releaseLock();
    } catch (e) {}
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "active",
      service: "Annaprasadam Seva Form & Payments API",
      timestamp: Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss")
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
