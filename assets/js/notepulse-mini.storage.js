(function (global) {
  'use strict';

  var STORAGE_KEY = 'notepulse-mini-state-v1';

  function readRaw(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeRaw(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeRaw(key) {
    try {
      global.localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  var storage = {
    key: STORAGE_KEY,

    read: function (defaultValue) {
      var raw = readRaw(STORAGE_KEY);
      if (raw === null || raw === undefined) {
        return defaultValue;
      }
      try {
        return JSON.parse(raw);
      } catch (e) {
        return defaultValue;
      }
    },

    write: function (value) {
      return writeRaw(STORAGE_KEY, JSON.stringify(value));
    },

    clear: function () {
      return removeRaw(STORAGE_KEY);
    }
  };

  global.NotePulseStorage = storage;
})(window);
