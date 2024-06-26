const CheckOut = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Outbound Form");
const MassCheckOut = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("The Draft");

function checkOut(e) {
  let namedValues = e.namedValues;
  let asgnMail = namedValues["Lakers Email"][0];
  let cbAssetTag = namedValues["Lakers ****"][0];
  let hsAssetTag = namedValues["Lakers ATT###"][0];
  let devicesOut = namedValues["Outbound Items"][0].split(", ");
  let itemsArr = [];
  let shortDue = namedValues["Due By"][0];
  let customDue = namedValues["Due Date"][0];
  let timestamp = namedValues["Timestamp"][0];
  let asgnUser = AdminDirectory.Users.get(asgnMail);
  let asgnOrgU = asgnUser.orgUnitPath;
  let today = new Date();
  let finalDue;
  switch (shortDue) {
    case "End of Year":
      if (asgnOrgU.includes(`${20}${getSY()}`)) {
        finalDue = DatesSheet.createTextFinder("Senior EOY")
        .findNext()
        .offset(0, 1)
        .getValue();
      } else {
        finalDue = DatesSheet.createTextFinder("End of Year")
        .findNext()
        .offset(0, 1)
        .getValue();
      }
      break;
    case "Tomorrow":
      let tomorrow = new Date().setDate(today.getDate() + 1);
      finalDue = checkHoliday(tomorrow);
      break;
    case "Today":
      finalDue = dateToTwos(today)
      break;
    case "OTHER":
      finalDue = checkHoliday(customDue);
      break;
    }
    finalDue = new Date(finalDue)
    finalDue.setHours(16)
    finalDue.setMinutes(0)
    finalDue.setSeconds(0)
    finalDue.setMilliseconds(0)
    finalDue = finalDue.toLocaleString()
            // Logger.log(`Final Due Date is ${finalDue}`);
            
  if (!ACC.isBulkUser(asgnMail)) {
    let account = ACC.getAccount(asgnMail);
    let accountRow = account.getRow();
    
    if (devicesOut.includes('Chromebook entirely') && cbAssetTag !== "") {
      itemsArr.push(cbAssetTag)
      ACC.removeStuDevice(cbAssetTag)
      ACC.removeBulkDevice(cbAssetTag)
      let dev1Col = findHeader("First Chromebook Out", SingleAccounts);
      let accLastDev = account.getCell(1, dev1Col)
      .getNextDataCell(SpreadsheetApp.Direction.NEXT)
      .getColumn();
      let devsRange = SingleAccounts.getRange(
        accountRow,
        dev1Col,
        1,
        accLastDev - dev1Col + 1
        );
        let splitDevs = [];
        
        // Logger.log(devsRange.getValues())
      
        for (let i = 0; i < devsRange.getValues()[0].filter(function(e) {return e} ).length/2; i++) {
          splitDevs.push([devsRange.getValues()[0][2*i], devsRange.getValues()[0][2*i + 1]])
          // Logger.log(splitDevs)
      }
      splitDevs.push([cbAssetTag, finalDue])
      splitDevs.sort(function (a, b) {
        return a[1] - b[1];
      });
    
      if (splitDevs.length > 3) {
        try {
          throw new Error(`${asgnMail} has too many devices out!`);
        } catch (e) {
          MAIL.userError(e);
        }
      } else {
        let newDevs = splitDevs.flat();
        SingleAccounts.getRange(
          accountRow,
          dev1Col,
          1,
          newDevs.length
        ).setValues([newDevs]);
      }
    }
      
    if (devicesOut.includes('Hotspot') && hsAssetTag !== "") {
        // Logger.log("hotspot = " + hsAssetTag)
      try {
        let hsCol = findHeader("Hotspot Out", SingleAccounts);
        let hsRange = SingleAccounts.getRange(accountRow, hsCol, 1, 2);
        // Logger.log(hsRange.getValues())
        let hsVals = [hsAssetTag, finalDue]
        // Logger.log(hsVals)
        if (hsRange.isBlank()) {
          // Logger.log("hsRange was blank")
          hsRange.setValues([hsVals])
        } else {
          // Logger.log("hsRange was NOT blank it was " + hsRange.getValues())
          throw new Error ('User already has a hotspot!')
        }
        
        itemsArr.push(hsAssetTag)
      } catch (e) {
        MAIL.userError(e);
        MAIL.scriptError(e);
        itemsArr.push(`${hsAssetTag}(fail)`)
      }
    }
    
    if (devicesOut.includes("Charger")) {
      itemsArr.push("1 charger")
      ACC.addCharger(asgnMail, finalDue)
    }

    SingleAccounts.getRange(accountRow, findHeader("Due (C)", SingleAccounts), 1, 1).setNumberFormat(["MM/DD/YY"])
    SingleAccounts.getRange(accountRow, findHeader("Due (H)", SingleAccounts), 1, 1).setNumberFormat(["MM/DD/YY"])
    SingleAccounts.getRange(accountRow, findHeader("Due (1)", SingleAccounts), 1, 1).setNumberFormat(["MM/DD/YY"])
    SingleAccounts.getRange(accountRow, findHeader("Due (2)", SingleAccounts), 1, 1).setNumberFormat(["MM/DD/YY"])
    SingleAccounts.getRange(accountRow, findHeader("Date Send Email", SingleAccounts), 1, 1).setNumberFormat(["MM/DD/YY"])

  } else {
    let account = ACC.getAccount(asgnMail);
    let accountRow = account.getRow();
    if (devicesOut.includes('Chromebook entirely') && cbAssetTag !== "") {
      itemsArr.push(cbAssetTag)
      ACC.removeBulkDevice(cbAssetTag)
      ACC.removeStuDevice(cbAssetTag)

      let splitDevs = []
      let cbCol = findHeader("Chromebooks", BulkAccounts)
      let cbCell = BulkAccounts.getRange(accountRow, cbCol, 1, 1);
      
      if (!cbCell.isBlank()) {
        cbCell.getValue().split(",").forEach((devPlusDate) => {
          let splitDev = devPlusDate.toString().replaceAll(")", "").trim().split("(")
          splitDevs.push(splitDev)
        })
      }
      
      splitDevs.push([cbAssetTag, finalDue])
      splitDevs.sort(function (a, b) {
        return a[1] - b[1];
      })
      
      let newDevs = splitDevs.map((splitDev) => {
        let unsplit = splitDev[0].trim() + " (" + dateToTwos(splitDev[1]) + ")"
        return unsplit
      })
      
      cbCell.setValue(newDevs.join(", "))
      
    }
    
    if (devicesOut.includes('Hotspot') && hsAssetTag !== "") {
      try {
        let hsCol = findHeader("Hotspots", BulkAccounts);
        let hsCell = BulkAccounts.getRange(accountRow, hsCol, 1, 1);
        // Logger.log(hsRange.getValues())
        // Logger.log(hsVals)
        if (hsCell.isBlank()) {
          // Logger.log("hsRange was blank")
          hsCell.setValue(hsAssetTag)
        } else {
          // Logger.log("hsRange was NOT blank it was " + hsRange.getValues())
          // Logger.log(hsAssetTag)
          let hspList = hsCell.getValue().split(",")
          hspList.push(hsAssetTag) // return value of arr.push is arr.length, not the new array  
          // Logger.log(hspList.join(", "))
          hsCell.setValue(hspList.join(", "))
        }
        
        itemsArr.push(hsAssetTag)
      } catch (e) {
        MAIL.scriptError(e);
        itemsArr.push(`${hsAssetTag}(fail)`)
      }
    }

    if (devicesOut.includes('Charger')) {
      itemsArr.push("1 charger")
      ACC.addCharger(asgnMail, finalDue)
    }
  }
  
  let realDevice = new RegExp(/Lakers \w\d{3}/)
  if (cbAssetTag !== "") {
    if (cbAssetTag.match(realDevice)) {
      LGN.active(cbAssetTag, asgnMail, finalDue);
    }

  }
  if (cbAssetTag !== "" && !cbAssetTag.match(realDevice)) {
    Logger.log('dummy chromie')
  } else {
    MAIL.outbound(asgnMail, devicesOut, finalDue)
  }
  
  
  let transaction = new Txn(asgnMail, "Check Out", timestamp, itemsArr)
  transaction.commit()
  latestFirst(CheckOut)
}

function massCheckOut() {
  let checkOutForm = FormApp.openByUrl(CheckOut.getFormUrl())
  let drafted = MassCheckOut.getDataRange()
  let draftedVals = drafted.getValues()
  
  let items = checkOutForm.getItems();
  
  let titles = [];
  items.forEach((item) => titles.push(item.getTitle()));
  let mailItem = items[titles.indexOf("Lakers Email")].asTextItem()
  let cbItem = items[titles.indexOf("Lakers ****")].asTextItem()
  let itemsOut = items[titles.indexOf("Outbound Items")].asCheckboxItem()
  let dueDateItem = items[titles.indexOf("Due By")].asMultipleChoiceItem()
  
  
  
  for (let i = draftedVals.length; i > 1; i--) {
    let txn = checkOutForm.createResponse()
    
    let userMail = draftedVals[i - 1][findHeader("User Email", MassCheckOut) - 1]
    let newDevice = draftedVals[i - 1][findHeader("Assigned Chromebook", MassCheckOut) - 1]
    let itemsOutList = ["Chromebook entirely", "Charger"];
    let dueDate = "End of Year"

    let mailResponse = mailItem.createResponse(userMail)
    let devResponse = cbItem.createResponse(newDevice)
    let itemsOutResponse = itemsOut.createResponse(itemsOutList)
    let dueResponse = dueDateItem.createResponse(dueDate)

    txn.withItemResponse(mailResponse).withItemResponse(devResponse).withItemResponse(itemsOutResponse).withItemResponse(dueResponse).submit()

    MassCheckOut.deleteRow(i)
  }
}