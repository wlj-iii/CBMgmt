const Trigger = (function () {
    class Trigger {
      constructor(functionName, everyMinutes) {
        return ScriptApp.newTrigger(functionName)
          .timeBased()
          .everyMinutes(everyMinutes)
          .create();
      }
  
      static deleteTrigger(e) {
        if (typeof e !== 'object')
          return console.log(`look at that, didn\'t even need a trigger :)`);
        if (!e.triggerUid)
          return console.log(`${JSON.stringify(e)} doesn't have a triggerUid`);
        ScriptApp.getProjectTriggers().forEach(trigger => {
          if (trigger.getUniqueId() === e.triggerUid) {
            console.log('logging off soon, I\'ll miss you!');
            return ScriptApp.deleteTrigger(trigger);
          }
        });
      }
    }
    return Trigger;
  })();
  