(function (global) {
  'use strict';

  function actSearchRecords(event) {
    if (!global.NotePulseStore) return false;
    var value = '';
    if (event && event.target) {
      value = event.target.value;
    }
    global.NotePulseStore.setSearch(value);
    return true;
  }

  global.actSearchRecords = actSearchRecords;
})(window);
