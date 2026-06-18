(function (global) {
  'use strict';

  function setFeedback(message) {
    var el = document.getElementById('insights-feedback');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = message;
  }

  function actExportSummary(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    var store = global.NotePulseStore;
    if (!store || typeof store.exportSummary !== 'function') {
      setFeedback('Export unavailable: store not ready.');
      return false;
    }

    try {
      var summary = store.exportSummary();
      var count = summary && summary.count !== undefined ? summary.count : 0;
      setFeedback('Exported ' + count + ' note(s) to notepulse-summary.json.');
      return true;
    } catch (err) {
      setFeedback('Export failed: ' + (err && err.message ? err.message : 'unknown error'));
      return false;
    }
  }

  global.actExportSummary = actExportSummary;
})(window);
