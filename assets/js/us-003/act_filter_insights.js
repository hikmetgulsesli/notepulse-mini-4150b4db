(function (global) {
  'use strict';

  var FILTERS = ['all', 'active', 'warn', 'fail'];
  var currentFilterIndex = 0;

  function getNotes() {
    if (global.NotePulseStore && typeof global.NotePulseStore.getState === 'function') {
      var state = global.NotePulseStore.getState();
      var notes = (state && state.notes) || [];
      return notes.filter(function (note) {
        return note !== null && typeof note === 'object';
      });
    }
    return [];
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function updateRecentList(notes, filter) {
    var list = document.getElementById('insights-recent');
    if (!list) return;

    var visible = filter === 'all' ? notes : notes.filter(function (n) {
      return n.status === filter;
    });

    list.innerHTML = '';
    if (visible.length === 0) {
      var empty = document.createElement('li');
      empty.textContent = 'No notes match the current filter.';
      list.appendChild(empty);
      return;
    }

    visible.slice(0, 4).forEach(function (note) {
      var item = document.createElement('li');
      item.textContent = (note.title || '(untitled)') + ' — ' + note.status;
      list.appendChild(item);
    });
  }

  function updateFeedback(filter, count) {
    var feedback = document.getElementById('insights-feedback');
    if (!feedback) return;
    feedback.style.display = 'block';
    feedback.textContent = 'Filter: ' + filter + ' (' + count + ' result' + (count === 1 ? '' : 's') + ')';
  }

  function updateMetrics(notes, filter) {
    var counts = { active: 0, warn: 0, fail: 0 };
    notes.forEach(function (note) {
      if (counts[note.status] !== undefined) counts[note.status]++;
    });

    var visibleCount = filter === 'all' ? notes.length : counts[filter] || 0;

    setText('metric-total', visibleCount);
    setText('metric-active', counts.active);
    setText('metric-warn', counts.warn);
    setText('metric-fail', counts.fail);

    updateRecentList(notes, filter);
    updateFeedback(filter, visibleCount);

    return visibleCount;
  }

  function actFilterInsights(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    currentFilterIndex = (currentFilterIndex + 1) % FILTERS.length;
    var filter = FILTERS[currentFilterIndex];
    var notes = getNotes();
    updateMetrics(notes, filter);
    return filter;
  }

  function refresh() {
    var filter = FILTERS[currentFilterIndex];
    updateMetrics(getNotes(), filter);
  }

  function renderAll() {
    currentFilterIndex = 0;
    updateMetrics(getNotes(), 'all');
  }

  function init() {
    if (
      global.NotePulseStore &&
      typeof global.NotePulseStore.init === 'function' &&
      global.NotePulseStore.getState() === null
    ) {
      global.NotePulseStore.init().then(renderAll);
      return;
    }
    renderAll();
  }

  global.actFilterInsights = actFilterInsights;

  if (global.NotePulseStore && typeof global.NotePulseStore.subscribe === 'function') {
    global.NotePulseStore.subscribe(refresh);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
