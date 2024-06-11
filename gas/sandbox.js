const cb = "Lakers 1101";
const items = ['Chromebook', 'Charger']
const testStu = 'ascaddan2022@lakerschools.org'
const testBulk = 'lakintaccmgr@lakerschools.org'
const testBulkDevs = "Lakers 0426 (05/31/2024), Lakers 1101 (05/31/2024), Lakers 0429 (05/31/2024)"
function iShouldntBeHere() {
  // let tester = new RegExp(`${cb}.{13}`)
  // let devsArr = testBulkDevs.split(",").filter((dev) => dev.toString().search(tester) == -1)
  // Logger.log(devsArr)
  // let fullName = AdminDirectory.Users.get(testEmail).name.fullName
  // Logger.log(fullName)
  
  // latestFirst(MIA)
  

  // let newBulkDevs = testBulkDevs.toString().split(",").forEach(
    // dev = dev.trim().replace(")", "").split("(")
    // )
    // let temp = priceItems("Chromebook entirely")
    // Logger.log(temp)
  // ACC.totalPoints('ascaddan2022@lakerschools.org', 'Unforeseeable Accident')
  ACC.addCharger(testStu, dateToTwos(new Date()))
  // ACC.charge('ascaddan2022@lakerschools.org', "missing", "Chromebook entirely", 235, "Overdue", "Lakers 1101")
  // ACC.removeBulkDevice(`${cb}`)
  // Logger.log(ACC.outstandingFines(testEmail))/
  // Logger.log(ACC.spanReport(testEmail))
  // dailyCheckDue()

  // LGN.active('Lakers 0327', testEmail, '10/20/23')
  // LGN.reserves('Lakers 0327', 'testing purposes')

  // MAIL.inbound(testEmail, items, cb)
  // MAIL.outbound(testEmail, 'Chromebook entirely, charger', '01/01/24')
  // MAIL.charge(testEmail, 'faulty', items, '20', 'Unforeseeable Accident')
  // MAIL.dueSoon(testEmail)
  
  // Logger.log(new Date(new Date('01/01/24').setHours(16)).toLocaleString())
  // Logger.log(AdminDirectory.Chromeosdevices.get("my_customer", "d3c2e57c-f1fb-4177-9da8-838c0548c027"))
  // dailyCheckDue()
  // return temp
}


function jShouldntBeHere() {
  let chgsDueCol = findHeader("Due (C)", SingleAccounts);
  let stuAcc = ACC.getAccount(testStu).getRow();
  let tempArr = [];


      let datesList = SingleAccounts.getRange(stuAcc, chgsDueCol, 1, 1);
      Logger.log("dListCell = " + datesList.getA1Notation())
      Logger.log("dList = " + datesList.getValue().toString())
      let currentDates = datesList
        .getValue()
        .toString()
        .trim()


        if (!currentDates) { // null case
          currentDates = [];
          currentDates.length = 0;
        } else {
          currentDates = currentDates
          .split(",")
          .map((el) => {
            if (el.toString().length > 8 ) { return new Date(el).getTime() } // single raw date case, otherwise list of pre-formatted
            let date = new Date(el
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
        }

      Logger.log("tempArr length = " + tempArr.length)
      Logger.log("cDates length = " + currentDates.length)
      Logger.log(currentDates)
};
