const CheckIn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Intake Form");
const MassCheckIn = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("V-Day");

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
    // Logger.log("Is Charger")
    ACC.removeCharger(retMail);
    itemsArr.unshift("1 charger")
    
    let feesFromMIA = Charges.createTextFinder(ACC.fullName(retMail))
    .matchEntireCell(true)
    .findAll();
    let timesRan = 0
    
    for (let i = feesFromMIA.length-1; i >= 0; i--) { // starts with last (oldest) charge first
      // Logger.log(`Fee #${i+1}`)
      let foundFee = feesFromMIA[i]
      let feeRow = foundFee.getRow();
      // Logger.log(`Fee #${i+1} in row ${feeRow}`)
      let feeType = Charges.getRange(feeRow, findHeader("Reason", Charges), 1, 1).getValue().toString();
      
      if (timesRan != 0 || !feeType.includes("Charger") || !feeType.includes("missing")) {
        // Logger.log(`Fee #${i+1} was not a missing charger`)
      } else {
        // Logger.log(`Fee #${i+1} was a missing charger`)
        let feeFormRange = Charges.getRange(feeRow, findHeader("Remaining Charge", Charges))
        let feeAmount = new Number(feeFormRange.getFormula().toString().match(/\d+\)$/)[0].match(/\d+/)[0]);
        let standardChgrAmount = priceItems("Charger")
        
        if (feeAmount >= standardChgrAmount || Math.abs(feeAmount-standardChgrAmount) < 5) { // the $5 wiggle room hopefully accounts for changes in pricing
          feeFormRange.setFormula(feeFormRange.getFormula().toString().replace(/\d+\)$/, `${feeAmount-standardChgrAmount})`))
          if (feeAmount-standardChgrAmount == 0) {
            Charges.getRange(feeRow, findHeader("Resolved", Charges), 1, 1).setValue("TRUE")
          }
          let fakeEdit = {};
          fakeEdit.range = Charges.getRange(feeRow, findHeader("Remaining Charge", Charges), 1, 1)
          fakeEdit.value = fakeEdit.range.getValue()
          fakeEdit.oldValue = feeAmount
          updateSecretaryCharges(fakeEdit)
          // Logger.log(`Fee #${i+1} was adjusted by ${feeAmount-standardChgrAmount}`)
        }
        timesRan++
        
      }
      // Logger.log(`Fee #${i+1} completed`)
    }
  }
  
  // Logger.log("Charger Done")
  if (items.includes("Hotspot") && hsAssetTag !== "") {
    // Logger.log("Is Hotspot")
    ACC.removeStuHotspot(hsAssetTag);
    ACC.removeBulkHotspot(hsAssetTag)
    itemsArr.unshift(hsAssetTag)
  }
  // Logger.log("Hotspot Done")
  
  if (cbAssetTag != "") { // Order here is specific: removes from account, then reports newly cleared account in thx email, then moves in GAdmin
    // Logger.log("Is Chromebook")
    // Logger.log("starting legion process " + cbAssetTag)
    try {
      ACC.removeStuDevice(cbAssetTag);
      ACC.removeBulkDevice(cbAssetTag);
    } catch (e) {
      MAIL.error(e);
    }
    
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
      MAIL.scriptError(e);
    }
    itemsArr.unshift(cbAssetTag)
  }
  // Logger.log("Chromebook Done")
  
  let transaction = new Txn(retMail, "Healthy Check In", timestamp, itemsArr)
  // Logger.log("Txn Began")
  
  if (faulties != "") {
    let cost = priceItems(faulties, retMail, retCategory)
    transaction.txnType = ("Faulty Check In");
    if (cost > 0) {
      transaction.invoiceSent = true
    }
    ACC.charge(retMail, 'faulty', faulties, cost, retCategory, itemsArr)
  }
  
  transaction.commit()
  // Logger.log("Txn Done")
  
  let report = ACC.report(retMail)
  // Logger.log("Testing Acc")
  if (Number(ACC.outstandingFines(retMail))) {
    // Logger.log("Not trying Acc Close")
  } else {
    // Logger.log(`Trying Acc Close because ${Number(ACC.outstandingFines(retMail))}`)
    ACC.attemptClose(retMail, report)
  }
  
  latestFirst(CheckIn);
  // Logger.log("CheckIn sorted")
}

function massCheckIn() {
  return
  let ui = SpreadsheetApp.getUi();

  var response = SpreadsheetApp.getUi().prompt('Enter email of returning Tech Dept member:')
  if (response.getSelectedButton() !== ui.Button.OK)
      {
      const selectedDate = response.getResponseText();
      }


  let checkInForm = FormApp.openByUrl(CheckIn.getFormUrl())
  let heroes = MassCheckIn.getDataRange()
  let heroVals = heroes.getValues()
  
  let items = checkInForm.getItems();
  
  let titles = [];
  items.forEach((item) => titles.push(item.getTitle()));
  let mailItem = items[titles.indexOf("Returner's Email")].asTextItem()
  let itemsIn = items[titles.indexOf("Returning Items")].asCheckboxItem()
  let retCatItem = items[titles.indexOf("Return Category")].asMultipleChoiceItem()
  
  
  
  for (let i = draftedVals.length; i > 1; i--) {
    let txn = checkInForm.createResponse()
    
    let userMail = draftedVals[i - 1][findHeader("User Email", MassCheckOut) - 1]
    let newDevice = draftedVals[i - 1][findHeader("Assigned Chromebook", MassCheckOut) - 1]
    let itemsOutList = ["Chromebook entirely", "Charger"];
    let dueDate = "End of Year"

    userMail = SpreadsheetApp.getUi

    let mailResponse = mailItem.createResponse(userMail)
    let devResponse = cbItem.createResponse(newDevice)
    let itemsOutResponse = itemsOut.createResponse(itemsOutList)
    let dueResponse = dueDateItem.createResponse(dueDate)

    txn.withItemResponse(mailResponse).withItemResponse(devResponse).withItemResponse(itemsOutResponse).withItemResponse(dueResponse).submit()

    MassCheckOut.deleteRow(i)
  }
}