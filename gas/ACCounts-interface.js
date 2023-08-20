const ACC = new (function () {
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

  this.createSingleAcc = (email) => {
    let rowContents = [];
    rowContents.push(email);
    rowContents.push(AdminDirectory.Users.get(email).name.fullName);
    rowContents.push("");
    for (let i = 0; i < 2; i++) {
      rowContents.push("0");
    }
    SingleAccounts.appendRow(rowContents);
    return SingleAccounts.getRange(
      SingleAccounts.getLastRow(),
      1,
      1,
      SingleAccounts.getLastColumn()
    )[0];
  };

  this.createBulkAcc = (email) => {
    let rowContents = [];
    rowContents.push(email);
    rowContents.push(AdminDirectory.Users.get(email).name.fullName);
    rowContents.push("0");
    BulkAccounts.appendRow(rowContents);
    return BulkAccounts.getRange(
      BulkAccounts.getLastRow(),
      1,
      1,
      SingleAccounts.getLastColumn()
    )[0];
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
        this.createBulkAcc(email);
        accountRow = BulkAccounts.getLastRow();
      }
      accountRange = BulkAccounts.getRange(
        accountRow,
        1,
        1,
        BulkAccounts.getLastColumn()
      );
      Logger.log(accountRange);
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
        this.createSingleAcc(email);
        accountRow = SingleAccounts.getLastRow();
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
    let chgsOutCol = account
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
      let chgsDueCol = account
        .getSheet()
        .getRange(1, 1, 1, account.getSheet().getLastColumn())
        .createTextFinder("Due (C)")
        .findNext()
        .getColumn();

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
        .map((currentDate) => new Date(currentDate))
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
      // TODO: bulk user -1 charger
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
    var accountDevices = [];
    var report;
    let devsReport;
  };

  this.report = (userMail) => {
    let userRow = this.getAccount(userMail).getValues()[0];
    let reportArray = [];
    if (this.isBulkUser(userMail)) {
      // do bulk user report
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
        reportArray.push("No hotspots");
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
      let devsReport;

      for (let i = 0; i < 3; i++) {
        let deviceCol =
          2 * i + Number(findHeader("First Device Out", SingleAccounts));
        let deviceName = userRow[deviceCol - 1];

        let deviceDue = new Date(userRow[deviceCol - 1 + 1]).toDateString();
        if (deviceDue == "Invalid Date") {
          deviceDue = "end of year";
        }
        if (deviceName) {
          accountDevices.push(deviceName + " (due " + deviceDue + ")");
        } else break;
      }

      if (accountDevices.length === 0) {
        devsReport = "No devices";
      } else if (accountDevices.length === 1) {
        devsReport = accountDevices;
      } else {
        devsReport = accountDevices.join("\r\n\t");
      }

      let hotspotReport;
      let hotspotCol = Number(findHeader("Hotspot Out", SingleAccounts));
      let hotspotName = userRow[hotspotCol - 1];
      let hotspotDue = new Date(userRow[hotspotCol - 1 + 1]).toDateString();

      if (!hotspotName) {
        hotspotReport = "no hotspot";
      } else {
        hotspotReport = hotspotName + " (due " + hotspotDue + ")";
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

      if (devsReport == "No devices" && hotspotReport == "no hotspot") {
        report = "\t" + devsReport + ", " + hotspotReport + ", " + chgsReport;
      } else {
        report =
          "\t" + devsReport + "\r\n\t" + hotspotReport + "\r\n\t" + chgsReport;
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
        reportArray.push("sin puntos de accesso");
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
      let devsReport;

      for (let i = 0; i < 3; i++) {
        let deviceCol =
          2 * i + Number(findHeader("First Device Out", SingleAccounts));
        let deviceName = userRow[deviceCol - 1];

        let deviceDue = new Date(userRow[deviceCol - 1 + 1]).toLocaleDateString(
          "es-MX"
        );
        if (deviceDue == "Invalid Date") {
          deviceDue = "a fin de año";
        }
        if (deviceName) {
          accountDevices.push(deviceName + " (vence al " + deviceDue + ")");
        } else break;
      }

      if (accountDevices.length === 0) {
        devsReport = "Sin Chromebooks";
      } else if (accountDevices.length === 1) {
        devsReport = accountDevices;
      } else {
        devsReport = accountDevices.join("\r\n\t");
      }

      let hotspotReport;
      let hotspotCol = Number(findHeader("Hotspot Out", SingleAccounts));
      let hotspotName = userRow[hotspotCol - 1];
      let hotspotDue = new Date(userRow[hotspotCol - 1 + 1]).toLocaleDateString(
        "es-MX"
      );

      if (!hotspotName) {
        hotspotReport = "sin puntos de accesso";
      } else {
        hotspotReport = hotspotName + " (vence al " + hotspotDue + ")";
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

      if (
        devsReport == "Sin Chromebooks" &&
        hotspotReport == "sin puntos de accesso"
      ) {
        report = "\t" + devsReport + ", " + hotspotReport + ", " + chgsReport;
      } else {
        report =
          "\t" + devsReport + "\r\n\t" + hotspotReport + "\r\n\t" + chgsReport;
      }

      return report;
    }
  };

  this.charge = (userMail, faultOrMiss, items, cost, category) => {
    let localCharge = [];
    let secretaryCharge = [];
    let problem = engProb(faultOrMiss, items);

    let locChargeFormula = `=if(indirect(address(row(), match(\"Resolved\", \$1:\$1, 0), 1)), 0, ${cost})`;
    let secretaryYear =
      (Number(getSY()) - 1).toString() + "-" + Number(getSY()).toString();
    let secretaryDescription = `Tech - ${problem} ${secretaryYear} SY`;

    Charges.activate();
    localCharge[findHeader("Student Full") - 1] =
      AdminDirectory.Users.get(userMail).name.fullName;
    Logger.log(localCharge[findHeader("Student Full") - 1]);
    localCharge[findHeader("Reason") - 1] = problem;
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

    MAIL.charge(userMail, faultOrMiss, items, cost, category);
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
      if (!nextDev) {
        nowDev.setValues([["", ""]]);
      } else {
        nextDev.moveTo(nowDev);
      }
    }
  };
})();

function hasUnsentOverdue(accountRange) {
  let dueNotSent = richTextify(HouseRules.getRange("B9"))[1]
  let accountRuns = richTextify(accountRange, true)
  if (accountRuns.some(runObj => compareRichTexts (runObj, dueNotSent))) {
    return true
  } else return false
}

function hasSentOverdue(accountRange) {
  let dueAndSent = richTextify(HouseRules.getRange("B10"))[1]
  let accountRuns = richTextify(accountRange, true)
  if (accountRuns.some(runObj => compareRichTexts (runObj, dueAndSent))) {
    return true
  } else return false
}

