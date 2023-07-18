const me = Session.getActiveUser().getEmail();
const aliases = GmailApp.getAliases();
const maskName = "Laker Device Management System";
const maskAcc = "lakers-device-manager@lakerschools.org";
const redirect = "help@lakerschools.org";

const MAIL = new (function () {

  this.charge = (userMail, faultOrMiss, items, charge, category) => {
    var msgSubj = 'Device Charge Reciept';
    var account = ACC.getAccount(userMail)
    var problem = faultOrMiss + " " + engMultiples(items)
    var spaProblem = spanProb(faultOrMiss, items)
    var spaCategory = spanCat(category)
    var outstanding = account.getValues()[0][findHeader("Outstanding", SingleAccounts)-1]
    var report = ACC.report(userMail)
    var spaRep = ACC.spanReport(userMail)
    var parentEmail = Parents.createTextFinder(userMail).findNext().offset(0, 4).getValue()
  
    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);
      let chargeEmail = HtmlService.createTemplateFromFile('chargeTemplate');

      chargeEmail.eng = {problem: problem, charge: charge, category: category, outstanding: outstanding, report: report};
      chargeEmail.spa = {problem: spaProblem, charge: charge, category: spaCategory, outstanding: outstanding, report: spaRep};

      GmailApp.sendEmail(userMail, msgSubj, 'The missing parameter',{
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': redirect,
        'htmlBody':chargeEmail.evaluate().getContent(),
        'cc':parentEmail
      })
    }
  };
})();

function diffUsers(retUsr, retDev, annotUsr) {
  var msgSubj = "Chromebook Return Receipt";
  var currOut = ACC.report(retUsr);
  if (!annotUsr) {
    devOwner =
      "Unfortunately, we were unable to make sure that device was assigned to you, and so any devices below are still under your name.";
  } else {
    devOwner =
      `Unfortunately, that device was assigned to ` +
      GAM.getUserName(annotUsr) +
      ". Below are any devices still under your name.";
  }

  let maskIndex = aliases.indexOf(maskAcc);
  let msgBody = `Thank you for returning ${retDev}!\n${devOwner}\n\nCurrently, you have checked out: \n\n${currOut}\n\nIf you still have items checked out, please see about returning those items before their due date(s), otherwise you may be charged.`;

  GmailApp.sendEmail(retUsr, msgSubj, msgBody, {
    from: aliases[maskIndex],
    name: maskName,
    replyTo: redirect,
  });
  let lakerTagRegex = /Lakers (\d){3}/gi;
  let retUsersLost = currOut.match(lakerTagRegex);
  Logger.log(retUsersLost);
  if (retUsersLost) {
    retUsersLost.forEach((lostDevTag) => LGN.missing(lostDevTag, retUsr));
  }
}
