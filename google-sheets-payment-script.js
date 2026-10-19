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
    "Phone Number",
    "Location",
    "Plates Count",
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
    "Phone Number",
    "Location",
    "Plates Count",
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

  // Delete default empty Sheet1 if both exist
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(err) {}
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss.getSheets().length < 2) {
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

    var nowIST = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    var timestamp = data.timestamp || nowIST;

    var donorName = (data.donorName || data.fullName || data.name || "").toString().trim();
    var phoneNumber = (data.phoneNumber || data.phone || data.contact || data.donor_mobile || "").toString().replace(/\D/g, "").slice(-10);
    var location = (data.location || data.address || data.city || "").toString().trim();
    var plates = data.plates ? String(data.plates) : "1";
    var platesNum = parseInt(plates, 10) || 1;
    var amount = data.amount ? String(data.amount) : String(platesNum * 51);
    var paymentId = (data.paymentId || data.razorpay_payment_id || "").toString().trim();
    var orderId = (data.orderId || data.razorpay_order_id || "").toString().trim();
    var receiptNo = (data.receiptNo || "").toString().trim();
    var sevaType = data.sevaType || "Annaprasadam Seva - Arunachalam";
    var status = (data.status || (paymentId ? "SUCCESS" : "PENDING")).toString().toUpperCase();

    // 1. If it's a payment
    if (paymentId || status === "SUCCESS") {
      var paySheet = ss.getSheetByName("Payments") || ss.getActiveSheet();
      paySheet.appendRow([
        timestamp,
        receiptNo || ("MK-" + Utilities.formatDate(new Date(), "Asia/Kolkata", "ddMM") + "-" + (paymentId.slice(-4) || "108")),
        donorName,
        phoneNumber,
        location,
        plates,
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
          phoneNumber,
          location,
          plates,
          amount,
          "PAID",
          paymentId,
          receiptNo,
          "Website Online Payment"
        ]);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ status: "success", message: "Payment recorded", receiptNo: receiptNo, paymentId: paymentId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. If it's a form entry (lead before payment)
    var regSheetDefault = ss.getSheetByName("Form_Registrations") || ss.getActiveSheet();
    regSheetDefault.appendRow([
      timestamp,
      donorName,
      phoneNumber,
      location,
      plates,
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
