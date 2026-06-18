(function (global) {
  'use strict';

  function actSaveRecord(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    global.NotePulseStore.saveDraft();
    return true;
  }

  global.actSaveRecord = actSaveRecord;
})(window);
