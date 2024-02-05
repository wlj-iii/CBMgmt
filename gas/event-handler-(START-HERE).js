function onOpening() { // if this is titled onOpen, it fires twice, and the first time is because of the name → causes problems
  SpreadsheetApp.getUi()
    .createMenu("Tech Dept. Options")
    .addItem("Check In Asset", "showCheckInForm")
    .addItem("Check Out Asset", "showCheckOutForm")
    .addItem("Mark Asset Missing", "showMiaForm")
    .addItem("Fix-It Ticket", "showFixItForm")
    .addItem("MASS CHECK OUT", "massCheckOut")
    .addToUi();
}

function makeEditChecker() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  madeChecker = ScriptApp.newTrigger("editSwitcher")
    .forSpreadsheet(ss)
    .onEdit()
    .create();
}

function editSwitcher(e) {
  switch (e.range.getSheet().getName()) {
    case "Pricing":
      if (e.user.getEmail() === "lakintaccmgr@lakerschools.org") {
        Logger.log("Work is happening so we won't count this edit");
        break;
      } else {
        updateFormItems();
        break;
      }
    case "Charges":
    Logger.log(`Range Col = ${e.range.getColumn()}`)
    Logger.log(`Check Col = ${findHeader("Resolved", Charges)}`)
    Logger.log(`Cost Col = ${findHeader("Remaining Charge", Charges)}`)
      if (findHeader("Resolved", Charges) !== (e.range.getColumn()) && findHeader("Remaining Charge", Charges) !== (e.range.getColumn())) {
        Logger.log("No need to send over to Secretaries")
        break;
      } else {
          updateSecretaryCharges(e)
          return
      }
  }
}

function filterForStandalone(row) {
  const ss = SpreadsheetApp.getActive().getSheetByName("Pricing");
  const ssHeaders = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues()[0];
  // Logger.log(row);
  let isLineItem = ssHeaders.indexOf("Standalone?");
  return row[isLineItem];
}

function updateFormItems() {
  const ss = SpreadsheetApp.getActive().getSheetByName("Pricing");
  const ssHeaders = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues()[0];
  // Logger.log(ssHeaders);
  let itemsOnSheet = ss
    .getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
    .getValues();
  let standaloneItems = itemsOnSheet
    .filter((row) => filterForStandalone(row))
    .map((e) => (e = e[0]));

  // Logger.log(standaloneItems);
  let intakeForm = FormApp.openById(
    "1KifzDMi_XmAhaS8St8O38eaOZvOPrQFoo43Wq05k14Y"
  );
  let outboundForm = FormApp.openById(
    "1044t03EGmlntFNWsTXT4hOzfAoKi2XHzt5qYXiYbMds"
  );

  let sheetItemNames = itemsOnSheet.map((e) => (e = e[0]));
  let intakeItems = intakeForm.getItems();
  let checkIntakeItems = intakeForm.getItems().map((item) => item.getTitle());
  let intakeItemInd = checkIntakeItems.indexOf("Faulty Items");
  let intakeItemQ = intakeItems[intakeItemInd].asCheckboxItem();
  intakeItemQ.setChoiceValues(sheetItemNames).showOtherOption(false);

  let outboundItems = outboundForm.getItems();
  let checkOutboundItems = outboundForm
    .getItems()
    .map((item) => item.getTitle());
  let outboundItemInd = checkOutboundItems.indexOf("Outbound Items");
  let outboundItemQ = outboundItems[outboundItemInd].asCheckboxItem();
  outboundItemQ.setChoiceValues(standaloneItems).showOtherOption(false);
}

function updateSecretaryCharges(e) {
  let range = e.range
  let Charges = range.getSheet()
  let Secretaries = SpreadsheetApp.openById("1r1TpiQxqGvsMmyTEi8vW4eSRs9tsG8X2rMdVvMo2XPo").getActiveSheet()
  let thisCharge = Charges.getRange(range.getRow(), 1, 1, Charges.getLastColumn()).getValues()[0]
  let debtorFirst
  let debtorLast

  try {
    let debtorEmail = ACC.findAccount(thisCharge[0])
    debtorFirst = AdminDirectory.Users.get(debtorEmail).name.givenName
    debtorLast = AdminDirectory.Users.get(debtorEmail).name.familyName
  } catch (e) { // in the event a GAdmin pull fails to find their user, it attempts to parse the name from the charge
    debtorFirst = thisCharge[0].match(/^\w+\s/).toString() // this is obviously not ideal as it can not account for non-hyphenated double first names (Mary Jane Watson)
    // Logger.log(`raw = ${debtorFirst}`)
    debtorFirst = debtorFirst.trim()
    // Logger.log(`First = ${debtorFirst}`)
    debtorLast = thisCharge[0].replace(debtorFirst, "").trim()
    // Logger.log(`Last = ${debtorLast}`)
  };
  if (Secretaries.getFilter()) {
    Secretaries.getFilter().remove()
  }

  let secDate = new Date(thisCharge[findHeader("Date", Charges) - 1])
  let j = findHeader("Date Assessed", Secretaries)

  Secretaries.getRange(1, 1, Secretaries.getMaxRows(), Secretaries.getMaxColumns()).createFilter()
    .setColumnFilterCriteria(findHeader("Last", Secretaries), SpreadsheetApp.newFilterCriteria().whenTextContains(debtorLast).build())
    .setColumnFilterCriteria(findHeader("First", Secretaries), SpreadsheetApp.newFilterCriteria().whenTextContains(debtorFirst).build())
    .setColumnFilterCriteria(findHeader("Description", Secretaries), SpreadsheetApp.newFilterCriteria().whenTextContains(thisCharge[findHeader("Reason", Charges) - 1]).build())
    .setColumnFilterCriteria(j, SpreadsheetApp.newFilterCriteria().whenDateEqualTo(secDate).build())

  let chargeHandled = false;
  for (let i = 2; i <= Secretaries.getLastRow(); i++) {
    let testDate = new Date(Secretaries.getRange(i, j, 1, 1).getValue())
    if (!chargeHandled && !Secretaries.isRowHiddenByFilter(i) && Math.abs(testDate.getTime() - secDate.getTime()) < 10000) {
          if (range.getColumn() == findHeader("Remaining Charge")) {
            let costRange = Secretaries.getRange(i, findHeader("Total", Secretaries))
            let oldVal = e.oldValue
            // Logger.log(`getVal = ${oldVal}`)
            // Logger.log(`e.oldVal = ${e.oldValue}`)
            let newVal = e.range.getValue()
            let diff = Math.abs(oldVal-newVal)
            Secretaries.getRange(i, Secretaries.getMaxColumns(), 1, 1).getNextDataCell(SpreadsheetApp.Direction.PREVIOUS).offset(0, 1).setValue(`credited $${diff} for returned items on ${dateToTwos(new Date())}`)
            costRange.setValue(newVal)
          } else if (e.range.getColumn() == findHeader("Resolved")) {
          Secretaries.getRange(i, findHeader("✔Paid", Secretaries)).setValue(e.value)
          }
          chargeHandled = true
      }
  }
  if (Secretaries.getFilter()) {
    Secretaries.getFilter().remove()
  }

}

function makeFormSwitcher() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  madeChecker = ScriptApp.newTrigger("formSwitcher")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
}

function formSwitcher(e) {
  switch (e.range.getSheet().getName()) {
    case "Intake Form":
      checkIn(e);
      break;
    case "Outbound Form":
      checkOut(e);
      break;
    case "MIA Form":
      manualMissing(e);
      break;
    case "Fix-It Form":
      techTicket(e);
      break;
  }
}

function showSidebarForm(formId) {
  let embedForm = HtmlService.createTemplateFromFile("formTemplate.html");
  // Logger.log(formId);
  embedForm.formId = formId;
  // Logger.log(embedForm.evaluate().getContent());
  Logger.log(
    SpreadsheetApp.getUi().showSidebar(
      embedForm.evaluate().setTitle("Enter Asset Information")
    )
  );
}

function showCheckInForm() {
  showSidebarForm("1KifzDMi_XmAhaS8St8O38eaOZvOPrQFoo43Wq05k14Y");
}

function showCheckOutForm() {
  showSidebarForm("1044t03EGmlntFNWsTXT4hOzfAoKi2XHzt5qYXiYbMds");
}

function showMiaForm() {
  showSidebarForm("1TfnTKBEzbG59d0dJiDXX5B7tlBhFq-V2twhJ8xiVnAs");
}

function showFixItForm() {
  showSidebarForm("1g-lGfWQc2kSnPiA2qqDtvAoRNCX9zsdymTAVkwSRkzk");
}

function formsSorter() {
  let ui = SpreadsheetApp.getUi()
  let popup = ui.alert('All 4 Forms will be shown and sorted with the latest at the top now. For visibility\'s sake please be sure to hide them again after!')

  if (popup == ui.Button.OK) {
    // Logger.log('The user clicked "OK"');
    latestFirst(CheckIn)
    latestFirst(CheckOut)
    latestFirst(Fix)
    latestFirst(MIA)
  } /* else {
    Logger.log('The user clicked "No" or the dialog\'s close button.');
  } */


}