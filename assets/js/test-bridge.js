window.__SETFARM_TEST_BRIDGE__ = {
  stack: 'static-html',
  ready: true,

  get state() {
    return window.NotePulseStore ? window.NotePulseStore.getState() : null;
  },

  get actions() {
    return window.NotePulseStore || null;
  },

  get storage() {
    return window.NotePulseStorage || null;
  },

  resetStorage: function () {
    if (window.NotePulseStorage) {
      window.NotePulseStorage.clear();
    }
  }
};
