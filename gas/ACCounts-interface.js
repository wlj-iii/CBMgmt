const ACC = new (function () {
  this.fullName = (email) => {
    return AdminDirectory.Users.get(email).name.fullName;
  };

  this.isBulkUser = (email) => {
    let singleOuRow = HouseRules.getRange(1, 1, HouseRules.getLastRow(), 1)
      .createTextFinder("Single-Device OU's")
      .findNext()
      .getRow();
    let singleOUs = HouseRules.getRange(
      singleOuRow,
      2,
      1,
      HouseRules.getLastColumn()
    )
      .getValues()[0]
      .filter(function (e) {
        return e;
      });
    let bulkOuRow = HouseRules.getRange(1, 1, HouseRules.getLastRow(), 1)
      .createTextFinder("Bulk-Checkout OU's")
      .findNext()
      .getRow();
    let bulkOUs = HouseRules.getRange(
      bulkOuRow,
      2,
      1,
      HouseRules.getLastColumn()
    )
      .getValues()[0]
      .filter(function (e) {
        return e;
      });

    let userOu = AdminDirectory.Users.get(email).orgUnitPath.toLowerCase();

    // This is currently built to consider anyone a bulk user unless they have the single-device tag in their OU path
    // To flip this functionality (default to single-), switch the 'if(singleOUs.some(' to read 'if (bulkOUs.some(' AND swap the false and true values around

    if (singleOUs.some((v) => userOu.includes(v))) {
      return false;
    } else {
      return true;
    }
  };

  this.isPayingUser = (email) => {
    let payingOuRow = HouseRules.getRange(1, 1, HouseRules.getLastRow(), 1)
      .createTextFinder("Paying OU's")
      .findNext()
      .getRow();
    let payingOUs = HouseRules.getRange(
      payingOuRow,
      2,
      1,
      HouseRules.getLastColumn()
    )
      .getValues()[0]
      .filter(function (e) {
        return e;
      });

    let userOu = AdminDirectory.Users.get(email).orgUnitPath.toLowerCase();

    if (payingOUs.some((v) => userOu.includes(v))) {
      return true;
    } else {
      return false;
    }
  };

  this.createSingleAcc = (email) => {
    let rowContents = [];

    rowContents[findHeader("Student Email", SingleAccounts)-1] = email
    rowContents[findHeader("Student Name", SingleAccounts)-1] = this.fullName(email)
    rowContents[findHeader("Balance", SingleAccounts)-1] = ""
    rowContents[findHeader("YTD Points", SingleAccounts)-1] = "0"
    rowContents[findHeader("ECF", SingleAccounts)-1] = "FALSE"
    rowContents[findHeader("Chargers Out", SingleAccounts)-1] = "0"
    SingleAccounts.appendRow(rowContents);
    
    let transaction = new Txn(email, "Account Created", Date(), `${this.fullName(email)} (Student)`);
    transaction.commit()

    return SingleAccounts.getRange(
      SingleAccounts.getLastRow(),
      1,
      1,
      SingleAccounts.getLastColumn()
    );
  };

  this.createBulkAcc = (email) => {
    let rowContents = [];
    rowContents.push(email);
    rowContents.push(this.fullName(email));
    rowContents.push("0");
    BulkAccounts.appendRow(rowContents);
    
    let transaction = new Txn(email, "Account Created", Date(), `${this.fullName(email)} (Bulk User)`);
    transaction.commit()
    
    return BulkAccounts.getRange(
      BulkAccounts.getLastRow(),
      1,
      1,
      BulkAccounts.getLastColumn()
    );
  };

  this.getAccount = (email) => {
    let accountRange;
    let accountRow;
    if (this.isBulkUser(email)) {
      try {
        accountRow = BulkAccounts.getRange(2, 1, BulkAccounts.getLastRow(), 1)
          .createTextFinder(email)
          .findNext()
          .getRow();
      } catch (e) {
        accountRow = this.createBulkAcc(email).getRow();
      }
      accountRange = BulkAccounts.getRange(
        accountRow,
        1,
        1,
        BulkAccounts.getLastColumn()
      );
      // Logger.log(accountRange);
    } else {
      try {
        accountRow = SingleAccounts.getRange(
          2,
          1,
          SingleAccounts.getLastRow(),
          1
        )
          .createTextFinder(email)
          .findNext()
          .getRow();
      } catch (e) {
        Logger.log("Creating account for " + AdminDirectory.Users.get(email).name.fullName)
        accountRow = this.createSingleAcc(email).getRow();
      }
      accountRange = SingleAccounts.getRange(
        accountRow,
        1,
        1,
        SingleAccounts.getLastColumn()
      );
    }
    return accountRange;
  };

  this.removeCharger = (email) => {
    let account = this.getAccount(email);
    let chgsOutCol = account // this is done the long way to be sheet-agnostic
      .getSheet()
      .getRange(1, 1, 1, account.getSheet().getLastColumn())
      .createTextFinder("Chargers Out")
      .findNext()
      .getColumn();

    let currChgsOut = account
      .getSheet()
      .getRange(account.getRow(), chgsOutCol, 1, 1);
    let newNum = currChgsOut.getValue() - 1;
    currChgsOut.setValue(Math.max(newNum, 0));

    if (!this.isBulkUser(email)) {
      let chgsDueCol = findHeader("Due (C)", SingleAccounts);

      let datesList = SingleAccounts.getRange(
        account.getRow(),
        chgsDueCol,
        1,
        1
      );
      let currentDates = datesList
        .getValue()
        .toString()
        .trim()
        .split(",")
        .map((el) => {
          let date = new Date(el?.toString().trim().slice(0, 6) + "20" + el.toString().slice(6)).getTime()
          return date // array does not sort properly unless dates recieve full year and are converted to epoch
          })
        .sort()
        .reverse();
      currentDates.splice(currentDates.indexOf(Math.min(currentDates)), 1);
      datesList
        .setValue(
          currentDates
            .map((currentDate) => dateToTwos(currentDate))
            .join(",")
            .toString()
            .trim()
        )
        .setNumberFormat(["MM/DD/YY"]);
    } else {
      // let chgsCol = findHeader("Chargers Out", BulkAccounts);
      // let chgsOutCell = BulkAccounts.getRange(account.getRow(), chgsCol, 1, 1);
      // chgsOutCell.setValue(Math.min(0, new Number(chgsOutCell.getValue()) - 1))
    }
  };

  this.addCharger = (email, dueDate) => {
    // Logger.log(dueDate)
    let account = this.getAccount(email);
    let accountRow = account.getRow()
    // Logger.log("accVals = " + account.getValues())
    let chgsOutCol = findHeader("Chargers Out", account.getSheet());
    
    let currChgsOut = account.getSheet().getRange(accountRow, chgsOutCol, 1, 1);
    let newNum = currChgsOut.getValue() + 1;
    // Logger.log("new Number = " + newNum)
    currChgsOut.setValue(newNum);

    if (!this.isBulkUser(email)) {
      let chgsDueCol = findHeader("Due (C)", SingleAccounts);


      let datesList = SingleAccounts.getRange(accountRow, chgsDueCol, 1, 1);
      // Logger.log("dListCell = " + datesList.getA1Notation())
      // Logger.log("dList = " + datesList.getValue().toString())
      let currentDates = datesList
      .getValue()
      .toString()
      .trim()
      .split(",")
      .map((el) => {
        let date = new Date(el
            /*
            */
            ?.toString()
            .trim()
            .slice(0, 6)
          + "20"
          + el
            .toString()
            .trim()
            .slice(6)
        ).getTime()
        return date // array does not sort properly unless dates recieve full year and are converted to epoch
      })
      .sort()
      
      currentDates.push(new Date(dueDate).getTime());
      
      datesList.setValue(
        currentDates
        .filter(function(el) { return el; })
        .sort()
        .map((currentDate) => dateToTwos(currentDate))
        .join(", ")
        .toString()
        .trim())
        .setNumberFormat(["MM/DD/YY"]);
        /*
        */
      Logger.log("current dates:" + `\n` + currentDates)
      return
    } else {
      // let chgsCol = findHeader("Chargers Out", BulkAccounts);
      // let chgsOutCell = BulkAccounts.getRange(accountRow, chgsCol, 1, 1);
      // chgsOutCell.setValue(new Number(chgsOutCell.getValue()))
    }
  };

  this.removeStuHotspot = (assetTag) => {
    // labelled singular account for most commmon case, however works on any accountS found
    let currentAccount = SingleAccounts.createTextFinder(assetTag)
      .matchEntireCell(true)
      .findAll();
    for (let i = 0; i < currentAccount.length; i++) {
      let foundUsr = currentAccount[i].getRow();
      let foundDev = currentAccount[i].getColumn();

      let nowDev = SingleAccounts.getRange(foundUsr, foundDev, 1, 2);
      nowDev.setValues([["", ""]]);
    }

    let feesFromMIA = Charges.createTextFinder(assetTag)
      .matchEntireCell(false)
      .findAll();
    for (let i = 0; i < feesFromMIA.length; i++) {
      let foundFee = feesFromMIA[i]
      let feeRow = foundFee.getRow();
      let feeType = Charges.getRange(feeRow, findHeader("Reason", Charges), 1, 1).getValue().toString();
      if (!feeType.includes("Hotspot") || !feeType.includes("missing")) {
        return
      } else {
        let feeFormRange = Charges.getRange(feeRow, findHeader("Remaining Charge", Charges))
        let feeAmount = new Number(feeFormRange.getFormula().toString().match(/\d+\)$/)[0].match(/\d+/)[0]);
        let standardHspAmount = priceItems("Hotspot")

        if (feeAmount >= standardHspAmount) {
          feeFormRange.setFormula(feeFormRange.getFormula().toString().replace(/\d+\)$/, `${feeAmount-standardHspAmount})`))
        }
        
      }
    }
  };

  this.removeBulkHotspot = (assetTag) => {
    let hspDueRegEx = new RegExp(`${assetTag}`)
    let currentAccount = BulkAccounts.createTextFinder(assetTag)
      .findAll();

    for (let i = 0; i < currentAccount.length; i++) {
      let devCol = currentAccount[i].getColumn();
      let foundUsr = currentAccount[i].getRow();

      let hspRange = BulkAccounts.getRange(foundUsr, devCol, 1, 1);
      let hspList = hspRange.getValue().split(",").filter((hsp) => hsp.toString().search(hspDueRegEx) == -1).join(", ")

      hspRange.setValue(hspList)
    }
  };

  this.findAccount = (firstSpaceLast) => {
    let email;
    try {
      email = SingleAccounts.createTextFinder(firstSpaceLast)
        .findNext()
        .offset(0, -1)
        .getValue();
    } catch (e) {
      email = BulkAccounts.createTextFinder(firstSpaceLast)
        .findNext()
        .offset(0, -1)
        .getValue();
    }
    return email;
  };

  this.outstandingFines = (userMail) => {
    let userRow = this.getAccount(userMail);
    let outstanding =
      userRow.getValues()[0][findHeader("Balance", SingleAccounts) - 1];
    return outstanding;
  };

  this.report = (userMail) => {
    let userRow = this.getAccount(userMail).getValues()[0];
    let reportArray = [];
    if (this.isBulkUser(userMail)) {
      let chromiesOut = userRow[findHeader("Chromebooks", BulkAccounts) - 1];
      if (!chromiesOut) {
        reportArray.push("No Chromebooks");
      } else {
        reportArray.push(
          chromiesOut
            .toString()
            .replaceAll("(", "(Due ")
            .split(", ")
            .join("\r\n")
        );
      }
      let hotspotsOut = userRow[findHeader("Hotspots", BulkAccounts) - 1];
      if (!hotspotsOut) {
        Logger.log("No Hotspots for Bulk User")
      } else {
        reportArray.push(hotspotsOut.toString().split(", ").join("\r\n"));
      }
      let chargersOut =
        "and " +
        Number(userRow[findHeader("Chargers Out", BulkAccounts) - 1]) +
        " charger(s)";
      reportArray.push(chargersOut);

      return reportArray.join("\r\n\r\n");
    } else {
      let userRow = this.getAccount(userMail).getValues()[0];
      var accountDevices = [];
      var report;
      let devsReport = [];
      let cbksReport;

      for (let i = 0; i < 3; i++) {
        let deviceCol =
          2 * i + Number(findHeader("First Chromebook Out", SingleAccounts));
        let deviceName = userRow[deviceCol - 1];

        let deviceDue = new Date(userRow[deviceCol - 1 + 1]) //.toDateString();
        if (deviceDue.toDateString() == "Invalid Date") {
          deviceDue = "end of year";
        }
        if (deviceName) {
          // accountDevices.push(deviceName + " (due " + deviceDue + ")");
          accountDevices.push([deviceName, deviceDue]);
        } else break;
      }

      if (accountDevices.length === 0) {
        cbksReport = "No Chromebooks";
      } else if (accountDevices.length === 1) {
        cbksReport = accountDevices[0][0] + " (due " + accountDevices[0][1].toDateString() + ")"
      } else {
        cbksReport = accountDevices
          .sort((a,b) => a[1] - b[1])
          .map(devAndDate => devAndDate[0] + " (due " + devAndDate[1].toDateString() + ")")
          .join("\r\n\t");
      }
      devsReport.push(cbksReport)
      
      let hotspotReport;
      let hotspotCol = Number(findHeader("Hotspot Out", SingleAccounts));
      let hotspotName = userRow[hotspotCol - 1];
      let hotspotDue = new Date(userRow[hotspotCol - 1 + 1]).toDateString();
      
      if (!hotspotName) {
        hotspotReport = "";
      } else {
        hotspotReport = hotspotName + " (due " + hotspotDue + ")";
        devsReport.push(hotspotReport)
      }

      let chgsDates = userRow[findHeader("Due (C)", SingleAccounts) - 1];

      if (!chgsDates) {
        numChgsOut = 0;
      } else if (typeof chgsDates !== "string") {
        chgsDates = new Date(chgsDates).toDateString();
        numChgsOut = chgsDates.toString().split(",").length;
      } else {
        numChgsOut = chgsDates.toString().split(",").length;
      }

      if (numChgsOut !== 0) {
        chgsReport =
          `and ${numChgsOut} charger(s) out (due ` +
          engMultiples(chgsDates) +
          ").";
      } else {
        chgsReport = `and no chargers currently checked out.`;
      }
      devsReport.push(chgsReport)

      if (cbksReport == "No Chromebooks" && hotspotReport == "" && chgsReport.includes("no chargers")) {
        report = "\t" + cbksReport + ", " + chgsReport;
        this.attemptClose(userMail)
      } else if (cbksReport == "No Chromebooks" && hotspotReport == "") {
        report = "\t" + cbksReport + ", " + chgsReport;
      } else {
        report = "\t" + devsReport.join("\r\n\t");
      }

      return report;
    }
  };

  this.spanReport = (userMail) => {
    let userRow = this.getAccount(userMail).getValues()[0];
    let reportArray = [];
    if (this.isBulkUser(userMail)) {
      // do bulk user report
      let chromiesOut = userRow[findHeader("Chromebooks", BulkAccounts) - 1];
      if (!chromiesOut) {
        reportArray.push("Sin Chromebooks");
      } else {
        reportArray.push(
          chromiesOut
            .toString()
            .replaceAll("(", "(Vence el ")
            .split(", ")
            .join("\r\n")
        );
      }
      let hotspotsOut = userRow[findHeader("Hotspots", BulkAccounts) - 1];
      if (!hotspotsOut) {
        Logger.log("No Hotspots for Bulk User")
      } else {
        reportArray.push(hotspotsOut.toString().split(", ").join("\r\n"));
      }
      let chargersOut =
        "y " +
        Number(userRow[findHeader("Chargers Out", BulkAccounts) - 1]) +
        " cargador(es) prestado(s)";
      reportArray.push(chargersOut);

      return reportArray.join("\r\n\r\n");
    } else {
      let userRow = this.getAccount(userMail).getValues()[0];
      var accountDevices = [];
      var report;
      let devsReport = [];
      let cbksReport;

      for (let i = 0; i < 3; i++) {
        let deviceCol =
          2 * i + Number(findHeader("First Chromebook Out", SingleAccounts));
        let deviceName = userRow[deviceCol - 1];

        let deviceDue = new Date(userRow[deviceCol - 1 + 1])
        if (deviceDue == "Invalid Date") {
          deviceDue = "a fin de año";
        }
        if (deviceName) {
          // accountDevices.push(deviceName + " (vence al " + deviceDue + ")");
          accountDevices.push([deviceName, deviceDue]);
        } else break;
      }

      if (accountDevices.length === 0) {
        cbksReport = "Sin Chromebooks";
      } else if (accountDevices.length === 1) {
        cbksReport = accountDevices[0][0] + " (vence al " + accountDevices[0][1].toLocaleDateString("es-MX") + ")";
      } else {
        cbksReport = accountDevices
          .sort((a,b) => a[1] - b[1])
          .map(devAndDate => devAndDate[0] + " (vence al " + devAndDate[1].toLocaleDateString("es-MX") + ")")
          .join("\r\n\t");
      }
      devsReport.push(cbksReport)

      let hotspotReport;
      let hotspotCol = Number(findHeader("Hotspot Out", SingleAccounts));
      let hotspotName = userRow[hotspotCol - 1];
      let hotspotDue = new Date(userRow[hotspotCol - 1 + 1]).toLocaleDateString(
        "es-MX"
      );

      if (!hotspotName) {
        hotspotReport = "";
      } else {
        hotspotReport = hotspotName + " (vence al " + hotspotDue + ")";
        devsReport.push(hotspotReport)
      }

      let chgsDates = userRow[findHeader("Due (C)", SingleAccounts) - 1];

      if (!chgsDates) {
        numChgsOut = 0;
      } else if (typeof chgsDates !== "string") {
        chgsDates = new Date(chgsDates).toLocaleDateString("es-MX");
        numChgsOut = chgsDates.toString().split(",").length;
      } else {
        numChgsOut = chgsDates.toString().split(",").length;
      }

      if (numChgsOut !== 0) {
        chgsReport =
          `y ${numChgsOut} cargador(es) prestado(s) (vence al ` +
          spaMultiples(chgsDates) +
          ").";
      } else {
        chgsReport = `y sin cargadores prestados`;
      }
      devsReport.push(chgsReport)

      if (
        cbksReport == "Sin Chromebooks" &&
        hotspotReport == ""
      ) {
        report = "\t" + cbksReport + " " + chgsReport;
      } else {
        report =
          "\t" + devsReport.join("\r\n\t");
      }

      return report;
    }
  };

  this.charge = (userMail, faultOrMiss, items, cost, category, tags) => {
    let localCharge = [];
    let secretaryCharge = [];
    let problem = engProb(faultOrMiss, items);


    if (cost !== 0) {
      let locChargeFormula = `=if(indirect(address(row(), match(\"Resolved\", \$1:\$1, 0), 1)), 0, ${cost})`;
      let secretaryYear =
        (Number(getSY()) - 1).toString() + "-" + Number(getSY()).toString();
      let secretaryDescription = `Tech - ${problem} ${secretaryYear} SY`;

      Charges.activate();
      let userFull = this.fullName(userMail);
      // Logger.log(userFull);
      localCharge[findHeader("Student Full") - 1] = userFull;
      // Logger.log(localCharge[findHeader("Student Full") - 1]);
      localCharge[findHeader("Reason") - 1] = problem;
      localCharge[findHeader("Item(s)") - 1] = engMultiples(tags);
      localCharge[findHeader("Remaining Charge") - 1] = "";
      localCharge[findHeader("Resolved") - 1] = "FALSE";
      localCharge[findHeader("Date") - 1] = new Date();
      Charges.appendRow(localCharge)
        .sort(findHeader("Date"), false)
        .getRange(2, findHeader("Remaining Charge"))
        .setFormula(locChargeFormula);
      Charges.getRange(2, 1, 1, Charges.getLastColumn()).setNumberFormats(
        Charges.getRange(3, 1, 1, Charges.getLastColumn()).getNumberFormats()
      );

      Secretaries.activate();
      secretaryCharge[findHeader("Date Assessed", Secretaries) - 1] = new Date();
      secretaryCharge[findHeader("Last", Secretaries) - 1] =
        AdminDirectory.Users.get(userMail).name.familyName;
      secretaryCharge[findHeader("First", Secretaries) - 1] =
        AdminDirectory.Users.get(userMail).name.givenName;
      secretaryCharge[findHeader("Total", Secretaries) - 1] = cost;
      secretaryCharge[findHeader("✔Paid", Secretaries) - 1] = "FALSE";
      secretaryCharge[findHeader("CK#/CASH", Secretaries) - 1] = "";
      secretaryCharge[findHeader("Description", Secretaries) - 1] =
        secretaryDescription;
      Secretaries.appendRow(secretaryCharge).sort(
        findHeader("Date Assessed", Secretaries),
        false
      );
      Secretaries.getRange(2, 1, 1, Secretaries.getLastColumn()).setNumberFormats(
        Secretaries.getRange(
          3,
          1,
          1,
          Secretaries.getLastColumn()
        ).getNumberFormats()
      );

    }

    MAIL.charge(userMail, faultOrMiss, items, cost, category);
  };

  this.countPoints = (userMail, retCategory) => {
    if (this.isPayingUser(userMail) != true) {
      return 0;
    } else {
      switch (retCategory) {
        case "Faulty/Returning Tech":
          return 0;
        case "Unforeseeable Accident":
          return 1;
        case "Overdue":
          return 2;
        case "Preventable Causes":
          return 2;
      }
    }
  };

  this.totalPoints = (userMail, retCategory) => {
    if (!this.isPayingUser(userMail)) {
      return 0;
    }
    let currentPtCell = this.getAccount(userMail).getCell(
      1,
      findHeader("YTD Points", SingleAccounts)
    );
    let currentPoints = currentPtCell.getValue();
    let newPoints = this.countPoints(userMail, retCategory);
    let newTotalPts = currentPoints + newPoints;
    currentPtCell.setValue(newTotalPts);
    return newTotalPts;
  };

  this.removeStuDevice = (deviceTag) => {
    // current account labelled singular for most commmon case, however works on any accountS found
    let currentAccount = SingleAccounts.createTextFinder(deviceTag)
      .matchEntireCell(true)
      .findAll();
    for (let i = 0; i < currentAccount.length; i++) {
      let foundUsr = currentAccount[i].getRow();
      let foundDev = currentAccount[i].getColumn();

      let nowDev = SingleAccounts.getRange(foundUsr, foundDev, 1, 2);
      let nextDev = SingleAccounts.getRange(
        foundUsr,
        foundDev + 2,
        1,
        SingleAccounts.getLastColumn() - foundDev + 1
      );
      if (nextDev.isBlank()) {
        nowDev.setValues([["", ""]]);
      } else {
        nextDev.moveTo(nowDev);
      }
    }

    // When a device is removed from all other accounts, its location is known: this means any charge for it missing can be resolved
    let feesFromMIA = Charges.createTextFinder(deviceTag)
      .matchEntireCell(false)
      .findAll();
    for (let i = 0; i < feesFromMIA.length; i++) {
      let foundFee = feesFromMIA[i]
      let feeRow = foundFee.getRow();
      let feeType = Charges.getRange(feeRow, findHeader("Reason", Charges), 1, 1).getValue().toString();
      if (!feeType.includes("Chromebook entirely") || !feeType.includes("missing")) {
        return
      } else {
        let feeFormRange = Charges.getRange(feeRow, findHeader("Remaining Charge", Charges))
        let feeAmount = new Number(feeFormRange.getFormula().toString().match(/\d+\)$/)[0].match(/\d+/)[0]);
        let standardDevAmount = priceItems("Chromebook entirely")

        if (feeAmount >= standardDevAmount) {
          feeFormRange.setFormula(feeFormRange.getFormula().toString().replace(/\d+\)$/, `${feeAmount-standardDevAmount})`))
        }
        
      }
    }
  };
  

  this.removeBulkDevice = (deviceTag) => {
    let devDueRegEx = new RegExp(`${deviceTag}.{11}`)
    let currentAccount = BulkAccounts.createTextFinder(deviceTag)
      .matchEntireCell(false)
      .findAll()
    for (let i = 0; i < currentAccount.length; i++) {
      let devCol = currentAccount[i].getColumn();
      let foundUsr = currentAccount[i].getRow();
      
      let chromieRange = BulkAccounts.getRange(foundUsr, devCol, 1, 1);
      let chromiesList = chromieRange.getValue().split(",").filter((dev) => dev.toString().search(devDueRegEx) == -1).join(", ")

      chromieRange.setValue(chromiesList)
    }
  };

  this.attemptClose = (userMail) => {
    let currYear = '20' + getSY();
    let syRegex = new RegExp(/(20\d{2})/, "gi")
    let userOU = AdminDirectory.Users.get(userMail).orgUnitPath
    let userYear = userOU.match(syRegex)
    Logger.log(`Current Year is ${currYear}`)
    Logger.log(`User Year is ${userYear}`)
    let probablyFinal

    if(userOU.includes(currYear)) {

      let numDaysBeforeEOY = 7
      
      let userEOY = new Date(DatesSheet.createTextFinder("Senior EOY").findNext().offset(0, 1).getValue());
      // Logger.log(userEOY)
      let msBeforeEOY = numDaysBeforeEOY * 24 * 60 * 60 * 1000
      // Logger.log(msBeforeEOY/(24*3600*1000))

      // Logger.log(`Difference is ${Math.abs(userEOY - new Date())/(24*3600*1000)}`)
      if (Math.abs(userEOY - new Date()) < msBeforeEOY) {
        probablyFinal = true;
      } else {
        probablyFinal = false;
      }
    } else {
      probablyFinal = false;
    }

    let report = ACC.report(userMail)

    if (!report.includes("No Chromebooks") || !report.includes("no chargers") || report.includes("Lakers ATT")) {
      return
    }
    

    if (userYear && currYear > userYear) {
      Logger.log("Graduated student account is being closed")
      this._closeAccount(userMail)
    } else if (probablyFinal && currYear == userYear) {
      Logger.log("Senior account is being closed: close enough to EOY")
      this._closeAccount(userMail)
    } else if (!userYear) {
      Logger.log("Non-student account is being closed")
      this._closeAccount(userMail)
    }
  };

  this._closeAccount = (userMail) => {
    // return
    let account = this.getAccount(userMail).getRow()
    SingleAccounts.deleteRow(account)
    
    let transaction = new Txn(email, "Account Closed", Date(), `${this.fullName(userMail)}`);
    transaction.commit()
  };
})();

/* function hasUnsentOverdue(accountRange) {
  let dueNotSent = richTextify(HouseRules.getRange("B9"))[1];
  let accountRuns = richTextify(accountRange, true);
  if (accountRuns.some((runObj) => compareRichTexts(runObj, dueNotSent))) {
    return true;
  } else return false;
}

function hasSentOverdue(accountRange) {
  let dueAndSent = richTextify(HouseRules.getRange("B10"))[1];
  let accountRuns = richTextify(accountRange, true);
  if (accountRuns.some((runObj) => compareRichTexts(runObj, dueAndSent))) {
    return true;
  } else return false;
} */

const _priceItem = (item, totalPoints, currPoints) => {
  let pricedItem;
  let itemBasis = Prices.createTextFinder(item)
    .findNext()
    .offset(0, 1)
    .getValue();
  let itemPrice = Prices.createTextFinder(item)
    .findNext()
    .offset(0, 2)
    .getValue();
  switch (itemBasis) {
    case "points":
      if (totalPoints <= 1 || currPoints == 0) {
        // Logger.log("Not enough points to charge for " + item)
        pricedItem = 0;
      } else {
        pricedItem = itemPrice;
        // Logger.log("Enough points to charge for " + item)
      }
      break;
    case "never":
      // Logger.log("Cannot charge for " + item)
      pricedItem = 0;
      break;
    case "always":
      // Logger.log("Will always charge for " + item)
      pricedItem = itemPrice;
      break;
  }
  return Number(pricedItem);
};

function priceItems(items, userMail, retCategory) {
  let totalPoints
  let currPoints
  if (userMail && retCategory) {
    totalPoints = ACC.totalPoints(userMail, retCategory)
    currPoints = ACC.countPoints(userMail, retCategory)
  }
  let totalPrice = items
    .toString()
    .split(",")
    .map((item) => _priceItem(item, totalPoints, currPoints))
    .reduce((a, b) => a + b);
  return totalPrice;
}


function dailyCheckDue() {
  var today = new Date()
  var tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  var oneWeek = new Date(today)
  oneWeek.setDate(oneWeek.getDate() + 7)
  today = toDueString(today);
  tomorrow = toDueString(tomorrow);
  oneWeek = toDueString(oneWeek);

  // Logger.log(today)
  // Logger.log(tomorrow)
  // Logger.log(oneWeek)

  let pastDue = dueTodaysList(today); // Bc remember, we aren't sending emails in the morning if a device is due that day, so the list of devices due today will go out only after they are past due
  let dueTomorrow = daysAccsList(tomorrow);
  let dueOneWeek = daysAccsList(oneWeek);
  dueTomorrow.forEach((account) => MAIL.dueSoon(account))
  dueOneWeek.forEach((account) => MAIL.dueSoon(account))
  
  pastDue.forEach((account) => { // pastDue is a 2D array of accounts, structured as below
    // accounts are returned with structure ['ascad@ls.org', '1 charger(s)', 'Lakers ATT001', 'Lakers 0327']
    let hsRegEx = new RegExp(/(Lakers ATT\d{3})/, "gi")
    let cbRegEx = new RegExp(/(Lakers \w{4})/, "gi")
    let cost;
    let userMail = account.shift()
    let chargerPos = account.toString().indexOf('charger')
    let numChgsOut = 0;
    if (chargerPos !== -1) {
      // Logger.log(account.toString())
      // Logger.log(account.toString().substring(chargerPos - 3, chargerPos - 1))
      numChgsOut = Number(account.toString().substring(chargerPos - 3, chargerPos - 1).replaceAll(',', ""))
      // Logger.log("#chgs = " + numChgsOut)
      // Logger.log("account = " + account)
      account.shift()
      // Logger.log("account = " + account)
      for (let i = 0; i < numChgsOut; i++) {
        account.unshift('Charger')
        // Logger.log("account = " + account)
      }
    }
    let devs = account.filter((item) => item.toString().search(cbRegEx) > -1)
    // devs.forEach(
      // (foundCB) => {LGN.missing(foundCB.toString())} // is there a reason this is not on?
      // (foundCB) => {Logger.log(foundCB.toString())}
      // )
    let hs = account.filter((item) => item.toString().search(hsRegEx) > -1)
    hs.forEach(
      (h) => {devs.unshift(h)}
    )
    items = account.toString().replace(hsRegEx, 'Hotspot').replace(cbRegEx, 'Chromebook entirely')
    // Logger.log(items)
    

    cost = priceItems(items, userMail, "Overdue")
    // Logger.log(cost)

    ACC.charge(userMail, 'missing', items, cost, "Overdue", devs)
    let transaction = new Txn(userMail, "Overdue Items", Date(), account)
    if (cost > 0) {
      transaction.invoiceSent = true
    }
    transaction.commit()
  })

  if (today.getMonth() != 7 && today.getDate() != 1) {
    return
  } else {
    // means today is august first
    let newSY = new Number(getSY());
    let oldSY = newSY-1;
    let oldSyFull = 2000+oldSY
    
    let potentialGrads = SingleAccounts.createTextFinder(`${oldSyFull}@lakerschools.org`).matchEntireCell(false).findAll()
    potentialGrads.forEach((rng) => {
      let userRow = rng.getRow()
      let userMail = SingleAccounts.getRange(userRow, 1, 1, 1).getValue();
      ACC.attemptClose(userMail)
    })

  }

}

function daysAccsList(day) {
  // Logger.log(`listing for ${day}`)
  let dueOnDay = SingleAccounts.createTextFinder(day).matchEntireCell(false).findAll()
  // Logger.log(dueOnDay.length)

  var accountsList = [];
  for (let i = 0; i < dueOnDay.length; i++) {
    let itemDue = dueOnDay[i]
    let itemRow = itemDue.getRow()
    let itemAcc = SingleAccounts.getRange(itemRow, 1, 1, 1).getValue();
    accountsList.push(itemAcc)
    // Logger.log(accountsList)
  }

  // TODO dueOnDay = BulkAccounts.createTectFinder etc etc

  
  accountsList = [...new Set(accountsList)]
  return accountsList
}

function dueTodaysList(today) {
  var todaysMailingList = [];
  
  let todaysStuList = SingleAccounts.createTextFinder(today).matchEntireCell(false).findAll()
  todaysStuList.forEach((todayRng) => {
    let itemRow = todayRng.getRow()
    let itemAcc = SingleAccounts.getRange(itemRow, 1, 1, 1).getValue();
    let mailTo = [itemAcc]
    if (!todaysMailingList.toString().includes(mailTo)) {
      todaysMailingList.push(mailTo)
    }
    let itemName = todayRng.offset(0, -1).getValue();
    if (typeof itemName !== 'string') { // then must be number, usu. only used for number of chargers as they do not have names :(
      let numChargersToday = countInstances(todayRng.getValue().toString(), today)
      if (numChargersToday == 0) { numChargersToday = 1 } // this is a tricky thing, but bc the date was found with text finder there is at least one, but if there is only one when toString-ed it shows as a JS Date Object format, which throws the count instances thing off. Basically one is found but cannot be counted, so we add it back

      itemName = numChargersToday.toString() + ' charger(s)'
    }
    // Logger.log("itemName = " + itemName)
    let accountsList = todaysMailingList.map(({ [0]: v }) => v)
    let currentAccountIndex = accountsList.indexOf(itemAcc)
    let currentAccount = todaysMailingList[currentAccountIndex]
    currentAccount.push(itemName)
  })

  return todaysMailingList
}

function toDueString(date) {
  var nonZeroedMonth = (new Number(date.getMonth().toString()) + 1).toString() // I hate Javascript
  var dueString = nonZeroedMonth.padStart(2, 0) + '/' + date.getDate().toString().padStart(2, 0) + '/' + date.getFullYear().toString().slice(2) // So so much
  return dueString // Aug '23 Liam knows i can redo this with intl date format or whatever but honestly? don't feel like it, this works and is probably update-proof
}

function getDevicesFromBulk(rangeVal, dueString) {
  let position = rangeVal.indexOf(dueString);
  let deviceArray = [];

  while (position !== -1) {
    deviceArray.push(rangeVal.substring(position - 13, position - 2)) // -2 is before the space and open parentheses, so so longs as the device remains a 11-char string we're good
    position = rangeVal.indexOf(dueString, position + 1);
  }

  return deviceArray
}