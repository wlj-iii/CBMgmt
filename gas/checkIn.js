function checkIn(e) {
    let namedValues = e.namedValues
    let items = namedValues["Returning Items"][0].split(", ");
    let retCategory = namedValues["Return Category"][0];
    let retMail = namedValues["Returner's Email"][0];
    let cbAssetTag = namedValues["Lakers ####"][0];
    Logger.log(cbAssetTag);
    let hsAssetTag = namedValues["Lakers ATT###"][0];
    let faulties = namedValues["Faulty Items"][0].split(", ");
    let explanation = namedValues['Explanation'][0];
    Logger.log(explanation);
    let goodCharger = namedValues["Charger Works"][0].toString().toLowerCase();
    let cbParts = Prices.getRange(2, 1, Prices.getLastRow(), 5).getValues().filter(row => row[3])

    if (items.includes("Charger")) {
        ACC.removeCharger(retMail)
    }

    if (items.includes("Hotspot")) {
        ACC.removeHotspot(hsAssetTag)
    }
    
    if (cbAssetTag != "") {
        try {
          Logger.log(cbAssetTag)
          if (cbParts.some(v => faulties.includes(v))) {
            LGN.sickBay(cbAssetTag, explanation)
          } else {
            LGN.reserves(cbAssetTag, explanation)
          }
        } catch (e) {
          MAIL.error(e)
        }
        try {
          ACC.removeStuDevice(cbAssetTag)
        } catch (e) {
          MAIL.error(e)
        }
      }

    latestFirst(CheckIn)

}