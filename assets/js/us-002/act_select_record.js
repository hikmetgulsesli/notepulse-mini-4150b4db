(function (global) {
  'use strict';

  function actSelectRecord(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    var target = event && event.target ? event.target.closest('[data-record-id]') : null;
    var recordId = target ? target.getAttribute('data-record-id') : null;
    if (!recordId) return false;
    global.NotePulseStore.editNote(recordId);
    return true;
  }

  global.actSelectRecord = actSelectRecord;
})(window);
