function checkOut(e) {
  let namedValues = e.namedValues;
  let asgnMail = namedValues["Lakers Email"][0];
  let cbAssetTag = namedValues["Lakers ****"][0];
  let hsAssetTag = namedValues["Lakers ATT###"][0];
  let devicesOut = namedValues["Outbound Items"][0].split(", ");
  let shortDue = namedValues["Due By"][0];
  let customDue = namedValues["Due Date"][0];
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
  Logger.log(`Final Due Date is ${finalDue}`);

  // TODO add devices to bulk account
  if (!ACC.isBulkUser(asgnMail)) {
    let account = ACC.getAccount(asgnMail);
    let accountRow = account.getRow();

    if (devicesOut.includes('Chromebook entirely') && cbAssetTag !== "") {
      ACC.removeStuDevice(cbAssetTag)
      let dev1Col = findHeader("First Device Out", SingleAccounts);
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

      Logger.log(devsRange.getValues())

      for (let i = 0; i < devsRange.getValues()[0].filter(function(e) {return e} ).length/2; i++) {
        splitDevs.push([devsRange.getValues()[0][2*i], devsRange.getValues()[0][2*i + 1]])
        Logger.log(splitDevs)
      }
      splitDevs.push([cbAssetTag, finalDue])
      splitDevs.sort(function (a, b) {
        return a[1] - b[1];
      });

      if (splitDevs.length > 3) {
        try {
          throw new Error("User has too many devices out!");
        } catch (e) {
          MAIL.error(e);
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
      Logger.log("hotspot = " + hsAssetTag)
      try {
        let hsCol = findHeader("Hotspot Out", SingleAccounts);
        let hsRange = SingleAccounts.getRange(accountRow, hsCol, 1, 2);
        Logger.log(hsRange.getValues())
        let hsVals = [hsAssetTag, finalDue]
        Logger.log(hsVals)
        if (hsRange.isBlank()) {
            Logger.log("hsRange was blank")
            hsRange.setValues([hsVals])
        } else {
            Logger.log("hsRange was NOT blank it was " + hsRange.getValues())
            throw new Error ('User already has a hotspot!')
        }
      } catch (e) {
        MAIL.error(e);
      }
    }

    if (devicesOut.includes("Charger")) {
        ACC.addCharger(asgnMail, finalDue)
    }
  }

  if (cbAssetTag !== "") {
    LGN.active(cbAssetTag, asgnMail, finalDue);
  }
}
