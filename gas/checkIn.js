const CheckIn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Intake Form");

function checkIn(e) {
  let namedValues = e.namedValues;
  let items = namedValues["Returning Items"][0].split(", ");
  let retCategory = namedValues["Return Category"][0];
  let retMail = namedValues["Returner's Email"][0];
  let cbAssetTag = namedValues["Lakers ****"][0];
  let hsAssetTag = namedValues["Lakers ATT###"][0];
  let faulties = namedValues["Faulty Items"][0].split(", ");
  let explanation = namedValues["Explanation"][0];
  let cbParts = Prices.getRange(2, 1, Prices.getLastRow(), 5)
    .getValues()
    .filter((row) => row[findHeader("CB Part?", Prices) - 1])
    .map((row) => row[0]);

  if (items.includes("Charger")) {
    ACC.removeCharger(retMail);
  }

  if (items.includes("Hotspot")) {
    if (ACC.isBulkUser(retMail)) {
      // TODO: Bulk User Hotspot Check in
    } else {
      ACC.removeStuHotspot(hsAssetTag);
    }
  }

  if (cbAssetTag != "") {
    // Logger.log("starting legion process " + cbAssetTag)
    try {
      Logger.log(cbAssetTag);
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
      if (ACC.isBulkUser(retMail)) {
        // TODO Bulk User CB Check In
      } else {
        ACC.removeStuDevice(cbAssetTag);
      }
    } catch (e) {
      MAIL.error(e);
    }
  }

  MAIL.inbound(retMail, items, cbAssetTag)

  if (faulties != "") {
    let cost = priceItems(faulties, retMail, retCategory)

    ACC.charge(retMail, 'faulty', faulties, cost, retCategory)
  }

  latestFirst(CheckIn);
}
