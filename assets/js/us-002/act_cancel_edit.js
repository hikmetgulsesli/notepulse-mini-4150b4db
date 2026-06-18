(function (global) {
  'use strict';

  function actCancelEdit(event) {
    if (event) event.preventDefault();
    if (!global.NotePulseStore) return false;
    global.NotePulseStore.cancelEdit();
    return true;
  }

  global.actCancelEdit = actCancelEdit;
})(window);
