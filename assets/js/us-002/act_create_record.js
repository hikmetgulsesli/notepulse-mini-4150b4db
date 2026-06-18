(function (global) {
  'use strict';

  function actCreateRecord(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    global.NotePulseStore.startNewDraft();
    return true;
  }

  global.actCreateRecord = actCreateRecord;
})(window);
