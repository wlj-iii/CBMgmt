const me = Session.getActiveUser().getEmail();
const aliases = GmailApp.getAliases();
const maskName = "Laker Device Management System";
const maskAcc = "lakers-device-manager@lakerschools.org";
const redirect = "help@lakerschools.org";

const MAIL = new (function () {

  this.charge = (userMail, faultOrMiss, items, charge, category) => {
    var msgSubj = 'Technology Charge Reciept';
    var fullName = ACC.fullName(userMail)
    var greeting = spanGreeting()
    var problem = faultOrMiss + " " + engMultiples(items)
    var spaProblem = spanProb(faultOrMiss, items)
    var spaCategory = spanCat(category)
    var outstanding = ACC.outstandingFines(userMail)
    var report = ACC.report(userMail)
    var spaRep = ACC.spanReport(userMail)
    let parentEmail
    if (charge != 0) {
      parentEmail = Parents.createTextFinder(userMail).findNext().offset(0, 4).getValue()
    } else {
      parentEmail = ""
    }
  
    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);
      let chargeEmail = HtmlService.createTemplateFromFile('chargeTemplate');

      chargeEmail.eng = {name: fullName, problem: problem, charge: charge, category: category, outstanding: outstanding, report: report};
      chargeEmail.spa = {greeting: greeting, name: fullName, problem: spaProblem, charge: charge, category: spaCategory, outstanding: outstanding, report: spaRep};
      // Logger.log(chargeEmail.getCode())

      GmailApp.sendEmail(userMail, msgSubj, 'The missing parameter',{ // this 'missing parameter' is where the body parameter would go, but here is overwritten by the html body
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': redirect,
        'htmlBody': chargeEmail.evaluate().getContent(),
        'cc':parentEmail
      })
    }
  };

  this.error = (e) => {
    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);
      GmailApp.sendEmail(redirect, "CBMgmt is complaining", e, {
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': 'williamljoslyn@gmail.com',
      })
    }
  }

  this.inbound = (retMail, items, cbAssetTag) => {
    let msgSubj = 'Technology Return Receipt'
    let parentEmail = Parents.createTextFinder(retMail).findNext().offset(0, 4).getValue()
    let retVsAsgn;
    let spanRetVsAsgn;
    let report = ACC.report(retMail)
    let spanReport = ACC.spanReport(retMail)
    let device = findDevice(cbAssetTag)
    let asgnMail = device.annotatedUser

    if (items.includes("Chromebook")) {
      retVsAsgn = retIsAsgn(retMail, asgnMail)
      spanRetVsAsgn = spanRetIsAsgn(retMail, asgnMail)
    } else {
      retVsAsgn = ""
      spanRetVsAsgn = ""
    }

    let msgBody =
    `Thank you, ${ACC.fullName(retMail)}, for returning that ${engMultiples(items)}!` +
    "\n" +
    retVsAsgn + 
    "\n" +
    "Just to recap, here is everything still on your account, please feel free to reply to this email if you have any questions!" +
    "\n\n" +
    report +
    "\n\n" +
    "Thank you again, and have an excellent day!" + 
    "\n\n\n" + 
    `¡Gracias, ${ACC.fullName(retMail)}, por devolver ${spanThatMultiples(items)}!` +
    "\n" +
    spanRetVsAsgn +
    "\n" +
    "Para recapitular, aquí está todo lo que aún está en su cuenta, ¡háganos saber si tiene alguna pregunta con respecto a los elementos mencionados respondiendo a este correo electrónico!" +
    "\n\n" +
    spanReport +
    "\n\n" +
    "Le saludamos atentamente, y muchas gracias por su tiempo."

    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);

      GmailApp.sendEmail(retMail, msgSubj, msgBody,{
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': redirect
      })
    }
  }

  this.outbound = (asgnMail, items, dueDate) => {
    let msgSubj = 'Technology Check-Out Receipt'
    let parentEmail = Parents.createTextFinder(asgnMail).findNext().offset(0, 4).getValue()
    let report = ACC.report(asgnMail)
    let spanReport = ACC.spanReport(asgnMail)


    let msgBody =
    `Hello, ${ACC.fullName(asgnMail)}! This is just an update on your account with us, technology-wise. It looks like you just checked out a ${engMultiples(items)}, which will (all) be due on ${dueDate}` +
    "If this is not the case, please come in to our offices so we can get things sorted for you. Your full account looks like:" +
    "\n\n" +
    report +
    "\n\n" +
    "If you have any questions, feel free to reply to this email!" + 
    "\n" +
    "Thank you again, and have an excellent day!" + 
    "\n\n\n" + 
    `¡${spanGreeting()}, ${ACC.fullName(retMail)}! Esta es solo una puesta al dia en su cuenta con nosotros, en cuanto a tecnología. Parece que acabas de revisar ${spaMultiples(items)}, que nos llegará/n el ${dueDate}` +
    "Si no es así, acérquese a nuestras oficinas para que podamos solucionarlo. Su cuenta completa se ve así:" +
    "\n\n" +
    spanReport +
    "\n\n" +
    "¡Háganos saber si tiene alguna pregunta con respecto a los elementos mencionados respondiendo a este correo electrónico! Quedamos a su disposición para cualquier aclaración." +
    "\n" +
    "Le saludamos atentamente, y muchas gracias por su tiempo."

    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);

      GmailApp.sendEmail(retMail, msgSubj, msgBody,{
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': redirect,
        // TODO MAKE SURE TO TURN OFF THE PARENT CC WHEN DONE WITH TESTING
        'cc': parentEmail
      })
    }
  }
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
