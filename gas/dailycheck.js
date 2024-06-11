const scanFull = () => {
    return
    const files = DriveApp.getFolderById(Run.from.get()).getFilesByType('image/jpeg');
    const done = DriveApp.getFolderById(Run.to.get());
    const url =  'https://api.verkada.com/cameras/v1/people/person_of_interest?org_id=' + Run.org.get()
    const existing = {
      'headers' : {
        'accept' : 'application/json',
        'x-api-key' : Run.api.get()
        },
      'method' : 'GET',
      'muteHttpExceptions' : true
    }
    while (files.hasNext()) {
        const vd = new VerkadaDone();
        if (vd.limit <= vd.timer.getDuration()) {
          vd.scanUnfinished = true;
          return; }
        const _file = files.next();
        const fileBased = Utilities.base64Encode(_file.getBlob().getBytes());
        const person_of_interest = {base64_image: fileBased, label: _file.getName()};
        const stringed = JSON.stringify(person_of_interest);
        const params = {
          'headers' : { 'x-api-key' : Run.api.get() },
          'contentType' : 'application/json',
          'method' : 'POST',
          'payload': stringed,
          'muteHttpExceptions' : true
          };
        let response = UrlFetchApp.fetch(url, params)

        if (response.getResponseCode() !== 200) {
          Logger.log('Error code %s on item %s:\n%s', response.getResponseCode(), _file.getName(), JSON.parse(response.getContentText()).message)
        } else {
        _file.moveTo(done);
        Logger.log('Successfully created %s from %s :)', _file.getName(), done.getName().replace(' Completed', ''))
        }

    }
};

const pickUpScan = e => {
    return
  // If the script is in the middle of a run
    if ('running' === ScanStatus.get()) {
    // Log to the console that pickUpScan is not needed for this exact minute
      console.log('There\'s already one running, silly goose!');
    
    // Do not pass this point in the function
      return;
  }

  // Save the status of the script as running
    ScanStatus.set('running');
    Logger.log('Successfully Picked Up Scan :)')

  // Start the timer for this run
    const vd = new VerkadaDone();
  
  // If the latest Run Type is anything but a Full Run:
    if (Run.type.get() !== 'YES') {
    // Do a Test Run of the Folder
        scanTest(Run.from.get());

  // Otherwise do a Full Run
    } else scanFull(Run.from.get())
  ;


  // Save script as not running
    ScanStatus.set('not running');

  // If timer ran up before the scan finished, do not pass this point in the function
  // (A new Trigger is not needed, the old one still exists)
    if (true === vd.scanUnfinished) return;

  // (Otherwise the scan finished and was not ended, so delete the Trigger and any properties)
    Trigger.deleteTrigger(e);
    PropertiesService.getUserProperties().deleteAllProperties();
    Logger.log('bye-bye :)')
};

const main = () => {
    return
    // If the script is in the middle of a run
      if ('running' === ScanStatus.get()) {
      // Log to the console that pickUpScan is not needed for this exact minute
        console.log('please wait for your first run to finish before starting another');
      
      // Do not pass this point in the function
        return;
    }
  
    // Save the current status of the script as running (this status remains outside of the script)
      ScanStatus.set('running');
      Logger.log('Successfully started new Scan :)')
  
    // Sort spreadsheet with latest Timestamp at top
    let pastDue = dueTodaysList(today); // Bc remember, we aren't sending emails in the morning if a device is due that day, so the list of devices due today will go out only after they are past due
    let dueTomorrow = daysAccsList(tomorrow);
    let dueOneWeek = daysAccsList(oneWeek);
    dueTomorrow.forEach((account) => MAIL.dueSoon(account))
    dueOneWeek.forEach((account) => MAIL.dueSoon(account))

    // Get the highest (latest) value in the URL column
      const inputUrl = SpreadsheetApp.getActive().getRange('B2').getValue();
  
    // Save the latest inputs to the Script Properties, so they are accessible between pauses
      Run.org.set(SpreadsheetApp.getActive().getRange('C2').getValue());
      Run.api.set(SpreadsheetApp.getActive().getRange('D2').getValue());
      Run.type.set(SpreadsheetApp.getActive().getRange('E2').getValue());
  
    // Take the new URL, save only the ID portion to the Properties, and create a subfolder for the completed files
      const inputID = inputUrl.match(/([-|\w]{17,})/)[0];
      Run.from.set(inputID.toString());
      const undoneName = DriveApp.getFolderById(Run.from.get()).getName();
      const doneFolder = DriveApp.getFolderById(Run.from.get()).getFoldersByName(undoneName + ' Completed');
      if (!(doneFolder.hasNext())) Run.to.set(DriveApp.getFolderById(Run.from.get()).createFolder(undoneName + ' Completed').getId().toString());
      else Run.to.set(doneFolder.next().getId().toString());
      
      
    // If the Full Run column has anything but ' YES ':
      if (Run.type.get() !== 'YES') {
      // Create an album in Google Photos to show that the folder/files are readable  
        newAlbum('Set Started at ' + new Date().getHours() + ":" + new Date().getMinutes());
        Run.album.set(Array.from(PhotoApp.getAlbumList({ excludeNonAppCreatedData: true })).pop().id);
      
      // Do a TEST scan of the folder that does not upload to Verkada
        scanTest(Run.from.get());
        
    // Otherwise (Full Run has a YES) do a FULL scan of the folder
      } else scanFull(Run.from.get())
    ;
  
  
    // Check if scan function either completed or was ended by timer
      const vd = new VerkadaDone();
  
    // Save script as not running (so the pickUpScan will know it is safe to start again if necessary)
      ScanStatus.set('not running');
    
    // If the timer has exceeded its limit (and not finished the scan)
      if (true === vd.scanUnfinished) {
      // Log to the console that the first pass did not finish the scan
        console.log('Attempting to pick up Scan...');
  
      // Create a Trigger that will run pickUpScan every minute and do not go any further in this function
        return new Trigger('pickUpScan', 1); }
  
    /** If the code reaches this point, congrats!
      * That means your scan was so fast it did not even need a trigger
      * Just in case though, we'll tell it to delete anything it might've made
      */
      Trigger.deleteTrigger();
      PropertiesService.getUserProperties().deleteAllProperties();
      Logger.log('Bye-bye now!')
  };




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
      devs.forEach(
          (foundCB) => {LGN.missing(foundCB.toString())} // is there a reason this is not on?
          // (foundCB) => {Logger.log(foundCB.toString())}
        )
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
  
    if (new Date().getMonth() != 7 || new Date().getDate() != 1) {
      return
    } else {
      // means today is august first
      let ytdPtsCol = findHeader("YTD Points", SingleAccounts)
      let ytdPts = SingleAccounts.getRange(2, ytdPtsCol, SingleAccounts.getLastRow()-1, 1)
      let emptyPoints = Array(ytdPts.getValues().length).fill([0])
      ytdPts.setValues(emptyPoints)
  
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
    Logger.log(today)
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