const CheckIn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Intake Form");

function checkIn(e) {
  let namedValues = e.namedValues;
  let items = namedValues["Returning Items"][0].split(", ");
  let itemsArr = [];
  let retCategory = namedValues["Return Category"][0];
  let retMail = namedValues["Returner's Email"][0];
  let cbAssetTag = namedValues["Lakers ****"][0];
  let hsAssetTag = namedValues["Lakers ATT###"][0];
  let faulties = namedValues["Faulty Items"][0].split(", ");
  let explanation = namedValues["Explanation"][0];
  let timestamp = namedValues["Timestamp"][0];
  let cbParts = Prices.getRange(2, 1, Prices.getLastRow(), 5)
  .getValues()
  .filter((row) => row[findHeader("CB Part?", Prices) - 1])
  .map((row) => row[0]);
  
  if (items.includes("Charger")) {
    ACC.removeCharger(retMail);
    itemsArr.unshift("1 charger")
  }
  
  if (items.includes("Hotspot") && hsAssetTag !== "") {
    ACC.removeStuHotspot(hsAssetTag);
    ACC.removeBulkHotspot(hsAssetTag)
    itemsArr.unshift(hsAssetTag)
  }
  
  if (cbAssetTag != "") {
    // Logger.log("starting legion process " + cbAssetTag)
    MAIL.inbound(retMail, items, cbAssetTag)
    try {
      // Logger.log(cbAssetTag);
      if (cbParts.some((v) => faulties.includes(v))) {
        // Logger.log("faulty " + faulties)
        LGN.sickBay(cbAssetTag, faulties, explanation);
      } else {
        // Logger.log("healthy " + cbAssetTag)
        LGN.reserves(cbAssetTag, explanation);
      }
    } catch (e) {
      MAIL.error(e);
    }
    try {
      ACC.removeStuDevice(cbAssetTag);
      ACC.removeBulkDevice(cbAssetTag);
    } catch (e) {
      MAIL.error(e);
    }
    itemsArr.unshift(cbAssetTag)
  }

  let transaction = new Txn(retMail, "Healthy Check In", timestamp, itemsArr)
  
  if (faulties != "") {
    let cost = priceItems(faulties, retMail, retCategory)
    transaction.txnType = ("Faulty Check In");
    if (cost > 0) {
      transaction.invoiceSent = true
    }
    ACC.charge(retMail, 'faulty', faulties, cost, retCategory, itemsArr)
  }
  
  transaction.commit()
  
  latestFirst(CheckIn);
}
