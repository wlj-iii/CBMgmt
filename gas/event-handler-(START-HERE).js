function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tech Dept. Options")
    .addItem("Check In Asset", "showCheckInForm")
    .addItem("Check Out Asset", "showCheckOutForm")
    .addItem("Mark Asset Missing", "showMiaForm")
    .addItem("Fix-It Ticket", "showFixItForm")
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
        Logger.log("Liam is testing so we won't count this edit yet");
        break;
      } else {
        updateFormItems();
        break;
      }
    case "Charges":
      if (e.user.getEmail() === "lakintaccmgr@lakerschools.org") {
        Logger.log("No need to send over to Secretaries")
        break;
      } else {
        if (e.range.getColumn() === findHeader("Resolved", Charges)) {
          updateSecretaryCharges(e)
          return
        } else {
          return
        }
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
  let debtorEmail = ACC.findAccount(thisCharge[0])
  let debtorFirst = AdminDirectory.Users.get(debtorEmail).name.givenName
  let debtorLast = AdminDirectory.Users.get(debtorEmail).name.familyName
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

  for (let i = 2; i < Secretaries.getLastRow(); i++) {
    let testDate = new Date(Secretaries.getRange(i, j, 1, 1).getValue())
    if (!Secretaries.isRowHiddenByFilter(i) && Math.abs(testDate.getTime() - secDate.getTime()) < 10000) {
          Secretaries.getRange(i, findHeader("✔Paid", Secretaries)).setValue(e.value)
          Secretaries.getFilter().remove()
          return
      }
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
  let embedForm = HtmlService.createTemplateFromFile("FormTemplate.html");
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
