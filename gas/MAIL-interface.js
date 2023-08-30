const me = Session.getActiveUser().getEmail();
const aliases = GmailApp.getAliases();
const maskName = "Laker Device Management System";
const maskAcc = "lakers-device-manager@lakerschools.org";
const redirect = "help@lakerschools.org";
const missingParameter = "This message is displayed due to a failure to load html. Lakers will not be able to directly aid in that, but be sure to let them know just in case!"

const MAIL = new (function () {

  this.charge = (userMail, faultOrMiss, items, charge, category) => {
    var msgSubj = 'Laker Technology Invoice';
    var fullName = ACC.fullName(userMail)
    var greeting = spanGreeting()
    var problem = faultOrMiss + " " + engMultiples(items)
    var spaProblem = spanProb(faultOrMiss, items)
    var engCategory = engCat(category)
    var spaCategory = spanCat(category)
    var outstanding = ACC.outstandingFines(userMail)
    var report = ACC.report(userMail)
    var spaRep = ACC.spanReport(userMail)
    let parentEmail
    if (charge != 0) {
      try {
      parentEmail = Parents.createTextFinder(userMail).findNext().offset(0, 4).getValue()
      } catch (e) {
        Logger.log("Parent for " + ACC.fullName(userMail) + " has not yet been synced")
      }
    } else {
      parentEmail = ""
    }
  
    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);
      let chargeEmail = HtmlService.createTemplateFromFile('chargeTemplate');

      chargeEmail.eng = {name: fullName, problem: problem, charge: charge, category: engCategory, outstanding: outstanding, report: report};
      chargeEmail.spa = {greeting: greeting, name: fullName, problem: spaProblem, charge: charge, category: spaCategory, outstanding: outstanding, report: spaRep};
      // Logger.log(chargeEmail.getCode())

      GmailApp.sendEmail(userMail, msgSubj, missingParameter,{ // html overrides missing (regular body) parameter UNLESS a client cannot load html (?!?!?)
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
    let msgSubj = 'Lakers Tech Checked In'
    /* try {
      let parentEmail = Parents.createTextFinder(retMail).findNext().offset(0, 4).getValue()
      } catch (e) {
        Logger.log("Parent for " + ACC.fullName(retMail) + " has not yet been synced")
      } */
    let retVsAsgn;
    let spanRetVsAsgn;
    let report = ACC.report(retMail)
    let spanReport = ACC.spanReport(retMail)
    let device = findDevice(cbAssetTag)
    let asgnMail = device.annotatedUser
    // Logger.log(asgnMail)

    try {
      parentEmail = Parents.createTextFinder(retMail).findNext().offset(0, 4).getValue()
      } catch (e) {
        Logger.log("Parent for " + ACC.fullName(retMail) + " has not yet been synced")
        parentEmail = ""
      }

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
        'replyTo': redirect,
        'cc': parentEmail // place cursor on this line and press ctrl+/ to toggle the parent cc on or off
      })
    }
  }

  this.outbound = (asgnMail, items, dueDate) => {
    let msgSubj = 'Lakers Tech Checked Out'
    let parentEmail = ""
    try {
      parentEmail = Parents.createTextFinder(asgnMail).findNext().offset(0, 4).getValue()
      } catch (e) {
        Logger.log("Parent for " + ACC.fullName(asgnMail) + " has not yet been synced")
      }

    let report = ACC.report(asgnMail)
    let spanReport = ACC.spanReport(asgnMail)
    dueDate = new Date(new Date(dueDate).setHours(16)).toLocaleString()


    let msgBody =
    `Hello, ${ACC.fullName(asgnMail)}! This is just an update on your account with us, technology-wise. It looks like you just checked out a ${engMultiples(items)}, which will (all) be due on ${dueDate}. If this is not the case, please come in to our offices so we can get things sorted for you. Your full account looks like:` +
    "\n\n" +
    report +
    "\n\n" +
    "If you have any questions, feel free to reply to this email!" + 
    "\n" +
    "Thank you again, and have an excellent day!" + 
    "\n\n\n" + 
    `¡${spanGreeting()}, ${ACC.fullName(asgnMail)}! Esta es solo una puesta al dia en su cuenta con nosotros, en cuanto a tecnología. Parece que acabas de revisar ${spaMultiples(items)}, que nos llegará/n el ${spanDate(dueDate)}. Si no es así, acérquese a nuestras oficinas para que podamos solucionarlo. Su cuenta completa se ve así:` +
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

      GmailApp.sendEmail(asgnMail, msgSubj, msgBody,{
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': redirect,
        'cc': parentEmail // place cursor on this line and press ctrl+/ to toggle the parent cc on or off
      })
    }
  }

  this.dueSoon = (userMail) => {
    var msgSubj = 'Lakers Tech Due Soon';
    var report = ACC.report(userMail);
    var spanReport = ACC.spanReport(userMail);

    if (!ACC.isBulkUser(userMail)) {
      try {
      parentEmail = Parents.createTextFinder(userMail).findNext().offset(0, 4).getValue()
      } catch (e) {
        Logger.log("Parent for " + ACC.fullName(userMail) + " has not yet been synced")
      }
    } else {
      parentEmail = ""
    }
    
    var aliases = GmailApp.getAliases();
    if (!aliases.includes(maskAcc)) {
      GmailApp.sendEmail(me, 'Alias not found', 'You should check the script and the account\'s settings to make sure you spelled the alias address correctly.');
    } else {
      let maskIndex = aliases.indexOf(maskAcc);
      // let msgBody = `This is just a friendly heads-up that you have devices checked out that are due soon.\n\nCurrently, you have checked out: \n\n${currOut}\n\nPlease be sure to return those items before 4 PM on their due date(s), otherwise you may be charged (if you have not been already).`
      
      let msgBody =
        `Hello, ${ACC.fullName(userMail)}! This is just an update on your account with us, technology-wise.` +
        "\u0020" +
        `It looks like you have a few items due soon, so below is a full report of everything on your account.` +
        "\u0020" +
        `Currently, you have checked out to you:` +
        "\n\n" +
        report +
        "\n\n" +
        "Please be sure to return those items before 4 PM on their due date(s)," +
        "\u0020" +
        "otherwise you may be charged (if you have not been already)." + 
        "\n" +
        "Thank you again, and have an excellent day!" + 
        "\n\n\n" + 
        `¡${spanGreeting()}, ${ACC.fullName(userMail)}! ` +
        `Esta es solo una puesta al dia en su cuenta con nosotros, en cuanto a tecnología.` +
        "\u0020" +
        `Parece que pronto deberá entregar algunos artículos,` +
        "\u0020" +
        `por lo que a continuación encontrará un informe completo de todo lo que hay en su cuenta.` +
        "\u0020" +
        `Actualmente ha prestado:` +
        "\n\n" +
        spanReport +
        "\n\n" +
        "Asegúrese de devolver esos artículos antes de las 16:00 de la fecha de vencimiento; " +
        "de lo contrario, es posible que se le cobre (si aún no lo ha hecho)." +
        "\n" +
        "Le saludamos atentamente, y quedamos a su disposición para cualquier aclaración."
      
      GmailApp.sendEmail(userMail, msgSubj, msgBody, {
        'from': aliases[maskIndex],
        'name': maskName,
        'replyTo': redirect,
        'cc':parentEmail
        });
    }
  }
})();
