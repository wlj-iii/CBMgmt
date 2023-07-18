const ActiveDuty = SpreadsheetApp.getActive().getSheetByName('Active Duty');
const Reserves = SpreadsheetApp.getActive().getSheetByName('Reserves');
const SickBay = SpreadsheetApp.getActive().getSheetByName('Sick Bay');
const Boneyard = SpreadsheetApp.getActive().getSheetByName('Boneyard');
const MissingInAction = SpreadsheetApp.getActive().getSheetByName('MIA');
const inactiveOU = HouseRules.createTextFinder("Inactive OU").findNext().offset(0, 1).getValue()

let legions = [ActiveDuty, Reserves, SickBay, Boneyard, MissingInAction];


const LGN = new (function () {
  const _findDevice = (cbAssetTag) => {
    cbAssetTag = cbAssetTag.toString().slice(0, 11)
    Logger.log(cbAssetTag)
    let device = AdminDirectory.Chromeosdevices.list("my_customer", {
      "query": `${cbAssetTag}`
    }).chromeosdevices[0]
    return device
  }

  const _removeDeviceLegion = (assetTag) => {
    for (let i = 0; i < legions.length; i++) {
      let found = legions[i].createTextFinder(assetTag).findAll()
      for (let j = 0; j < found.length; j++) {
        let asset = found[j].getRow();
        legions[i].deleteRows(asset, 1);
      }
    }
  };


  this.reserves = (cbAssetTag, explanation) => {
    let device = _findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 11)
    let newDevice = {
      "annotatedAssetId": `${deviceName} - RESERVES`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`
    }

    if (explanation) {
      newDevice = {
        ...newDevice,
        notes: explanation
      }
    } else {
      newDevice = {
        ...newDevice,
        notes: 'No explanation given'
      }
    }

    AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", device.deviceId)

    _removeDeviceLegion(deviceName);

    let certaintyCheck = _findDevice(cbAssetTag).annotatedAssetId;

    let formulas = "=ArrayFormula(if(isblank($A$2:$A), \"\", split($A$2:$A, \" - \", false)))";
    let dataRow = [certaintyCheck]

    Reserves.appendRow(dataRow).getRange("B2:B").clear();
    Reserves.moveRows(Reserves.getRange(Reserves.getLastRow(), 1, 1, 1), 2)
    Reserves.getRange(2, 2, 1, 1).setFormula(formulas);
  };


  this.missing = (cbAssetTag) => {
    let device = _findDevice(cbAssetTag)
    let deviceName = device.annotatedAssetId.slice(0, 13) // 13 includes the dash
    let deviceId = device.deviceId;
    let dateMissing = new Date().toDateString();
    let lastAsgn = device.annotatedUser || "none found";
    let lastUser = device.recentUsers[0].email;
    let lastUsed = getLastTime(device)
    let newDevice = {
      "annotatedAssetId": `${deviceName} Marked AWOL ${dateMissing}`,
      "annotatedUser": "",
      "orgUnitPath": `${inactiveOU}`,
      "notes": `Last assigned to ${lastAsgn}` + '\u000D' + `Last used by ${lastUser} on ${lastUsed}`
    }

    // The line below would wipe devices when missing if enabled. Currently not for "hey I lost my-" 10 minutes later "found it"
    // AdminDirectory.Customer.Devices.Chromeos.issueCommand({ "commandType": "WIPE_USERS" }, "my_customer", device.deviceId)
    if (device.status === "ACTIVE") {
      AdminDirectory.Chromeosdevices.action({"action": "disable"},"my_customer",deviceId)
    };
    AdminDirectory.Chromeosdevices.patch(newDevice, "my_customer", deviceId)

    _removeDeviceLegion(deviceName);

    let certaintyCheck = _findDevice(cbAssetTag).annotatedAssetId;

    let formulas = [["=ArrayFormula(if(isblank($A$2:$A), \"\", split($A$2:$A, \" - \", false)))"]];
    let dataRow = [certaintyCheck]

    MissingInAction.appendRow(dataRow).getRange("B2:B").clear();
    MissingInAction.moveRows(MissingInAction.getRange(MissingInAction.getLastRow(), 1, 1, 1), 2)
    MissingInAction.getRange(2, 2, 1, 1).setFormula(formulas);
  };
})();