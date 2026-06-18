(function (global) {
  'use strict';

  var STATUS = ['active', 'warn', 'fail'];
  var VIEWS = ['operations', 'editor', 'insights'];

  function uid() {
    return 'np-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  var defaultData = null;

  function loadDefaultData() {
    return fetch('assets/data/notepulse-mini.json')
      .then(function (res) {
        if (!res.ok) throw new Error('default data unavailable');
        return res.json();
      })
      .then(function (data) {
        defaultData = data;
        return data;
      })
      .catch(function () {
        defaultData = {
          version: 1,
          notes: [],
          view: 'operations',
          search: '',
          lastError: null
        };
        return defaultData;
      });
  }

  var state = null;
  var listeners = [];

  function validateNote(input) {
    if (!input || typeof input !== 'object') return null;
    return {
      id: String(input.id || uid()),
      title: String(input.title || '').trim(),
      content: String(input.content || '').trim(),
      status: STATUS.indexOf(input.status) !== -1 ? input.status : 'active',
      updatedAt: input.updatedAt || nowIso()
    };
  }

  function normalize(input) {
    var data = input && typeof input === 'object' ? input : {};
    var rawNotes = Array.isArray(data.notes) ? data.notes : [];
    var notes = [];
    for (var i = 0; i < rawNotes.length; i++) {
      var note = validateNote(rawNotes[i]);
      if (note) notes.push(note);
    }
    var activity = [];
    if (Array.isArray(data.activity)) {
      for (var j = Math.max(0, data.activity.length - 50); j < data.activity.length; j++) {
        activity.push(data.activity[j]);
      }
    }
    return {
      version: Number(data.version) || 1,
      notes: notes,
      view: VIEWS.indexOf(data.view) !== -1 ? data.view : 'operations',
      draft: data.draft ? validateNote(data.draft) : null,
      search: String(data.search || ''),
      lastError: data.lastError || null,
      activity: activity
    };
  }

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](state);
    }
  }

  var store = {
    STATUS: STATUS,
    VIEWS: VIEWS,

    init: function () {
      return loadDefaultData().then(function () {
        var saved = NotePulseStorage.read(defaultData);
        state = normalize(saved);
        store.persist();
        emit();
        return state;
      });
    },

    getState: function () {
      return state;
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        var idx = listeners.indexOf(fn);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },

    persist: function () {
      if (state) NotePulseStorage.write(state);
    },

    setView: function (view) {
      if (VIEWS.indexOf(view) === -1) return false;
      state.view = view;
      if (view !== 'editor') state.draft = null;
      store.persist();
      emit();
      return true;
    },

    setSearch: function (query) {
      state.search = String(query || '').toLowerCase();
      emit();
      return state.search;
    },

    createNote: function (title, content) {
      var note = validateNote({
        id: uid(),
        title: title,
        content: content,
        status: 'active',
        updatedAt: nowIso()
      });
      state.notes.unshift(note);
      state.activity.push({ type: 'create', id: note.id, at: nowIso() });
      store.persist();
      emit();
      return note;
    },

    updateNote: function (id, patch) {
      var idx = -1;
      for (var i = 0; i < state.notes.length; i++) {
        if (state.notes[i].id === id) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return null;
      var note = state.notes[idx];
      var updated = validateNote(Object.assign({}, note, patch, { id: id, updatedAt: nowIso() }));
      state.notes[idx] = updated;
      state.activity.push({ type: 'update', id: id, at: nowIso() });
      store.persist();
      emit();
      return updated;
    },

    deleteNote: function (id) {
      var before = state.notes.length;
      var next = [];
      for (var i = 0; i < state.notes.length; i++) {
        if (state.notes[i].id !== id) next.push(state.notes[i]);
      }
      state.notes = next;
      if (state.notes.length !== before) {
        state.activity.push({ type: 'delete', id: id, at: nowIso() });
        store.persist();
        emit();
        return true;
      }
      return false;
    },

    setStatus: function (id, status) {
      if (STATUS.indexOf(status) === -1) return false;
      return store.updateNote(id, { status: status });
    },

    startNewDraft: function () {
      state.draft = validateNote({
        id: uid(),
        title: '',
        content: '',
        status: 'active',
        updatedAt: nowIso()
      });
      state.view = 'editor';
      store.persist();
      emit();
      return state.draft;
    },

    editNote: function (id) {
      var note = null;
      for (var i = 0; i < state.notes.length; i++) {
        if (state.notes[i].id === id) {
          note = state.notes[i];
          break;
        }
      }
      if (!note) return null;
      state.draft = Object.assign({}, note);
      state.view = 'editor';
      store.persist();
      emit();
      return state.draft;
    },

    saveDraft: function () {
      if (!state.draft) return null;
      var title = String(state.draft.title || '').trim();
      if (!title) {
        state.lastError = { field: 'title', message: 'Identifier is required.' };
        emit();
        return null;
      }
      var exists = false;
      for (var i = 0; i < state.notes.length; i++) {
        if (state.notes[i].id === state.draft.id) {
          exists = true;
          break;
        }
      }
      var note;
      if (exists) {
        note = store.updateNote(state.draft.id, {
          title: state.draft.title,
          content: state.draft.content,
          status: state.draft.status
        });
      } else {
        note = store.createNote(state.draft.title, state.draft.content);
        if (note && state.draft.status !== 'active') {
          store.setStatus(note.id, state.draft.status);
          note = store.getState().notes.find(function (n) { return n.id === note.id; });
        }
      }
      state.draft = null;
      state.view = 'operations';
      state.lastError = null;
      store.persist();
      emit();
      return note;
    },

    cancelEdit: function () {
      state.draft = null;
      state.lastError = null;
      state.view = 'operations';
      store.persist();
      emit();
    },

    clearError: function () {
      state.lastError = null;
      emit();
    },

    exportSummary: function () {
      var byStatus = {};
      for (var i = 0; i < STATUS.length; i++) {
        var s = STATUS[i];
        var count = 0;
        for (var j = 0; j < state.notes.length; j++) {
          if (state.notes[j].status === s) count++;
        }
        byStatus[s] = count;
      }
      var summary = {
        exportedAt: nowIso(),
        count: state.notes.length,
        byStatus: byStatus,
        notes: state.notes
      };
      var blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'notepulse-summary.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      state.activity.push({ type: 'export', at: nowIso() });
      store.persist();
      emit();
      return summary;
    },

    retryLoad: function () {
      state.lastError = null;
      return store.init().then(function () {
        emit();
        return state;
      });
    }
  };

  global.NotePulseStore = store;
})(window);
