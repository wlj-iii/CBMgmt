class ScanStatus {
    static set(status) {
      PropertiesService.getScriptProperties().setProperty('status', status);
    }
  
    static get() {
        return PropertiesService.getScriptProperties().getProperty('status');
    }
}

class Counter {
    static set(status) {
      PropertiesService.getScriptProperties().setProperty('status', status);
    }
  
    static get() {
        return PropertiesService.getScriptProperties().getProperty('status');
    }
}

class Run {}
  Run.type = class {
      static set(runType) {
        PropertiesService.getScriptProperties().setProperty('Full?', runType.toString());
      }

      static get() {
        return PropertiesService.getScriptProperties().getProperty('Full?');
      }
    };

  Run.from = class {
    static set(folderID) {
      PropertiesService.getScriptProperties().setProperty('from', folderID.toString());
    }

    static get() {
      return PropertiesService.getScriptProperties().getProperty('from');
    }
    };

  Run.to = class {
    static set(folderID) {
      PropertiesService.getScriptProperties().setProperty('to', folderID.toString());
    }

    static get() {
      return PropertiesService.getScriptProperties().getProperty('to');
    }
  };

  Run.album = class {
    static set (albumId) {
      PropertiesService.getScriptProperties().setProperty('album', albumId.toString());
    }

    static get() {
      return PropertiesService.getScriptProperties().getProperty('album');
    }
  };

  Run.org = class {
    static set(org_id) {
      PropertiesService.getScriptProperties().setProperty('org', org_id.toString());
    }

    static get() {
      return PropertiesService.getScriptProperties().getProperty('org');
    }
  };

  Run.api = class {
    static set(api_key) {
      PropertiesService.getScriptProperties().setProperty('api', api_key.toString());
    }

    static get() {
      return PropertiesService.getScriptProperties().getProperty('api');
    }
  };