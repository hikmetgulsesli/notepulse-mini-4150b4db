(function () {
  'use strict';

  var store = window.NotePulseStore;
  var container = document.querySelector('[data-testid="setfarm-app-root"]');
  var searchTimeout = null;

  function el(tag, attrs) {
    var node = document.createElement(tag);
    var children = Array.prototype.slice.call(arguments, 2);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (key === 'className') {
          node.className = val;
        } else if (key === 'text') {
          node.textContent = val;
        } else if (key === 'html') {
          node.innerHTML = val;
        } else if (key.startsWith('on') && typeof val === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), val);
        } else if (val !== undefined && val !== null) {
          node.setAttribute(key, val);
        }
      });
    }
    children.forEach(function (child) {
      if (child === null || child === undefined) return;
      if (typeof child === 'string' || typeof child === 'number') {
        node.appendChild(document.createTextNode(child));
      } else {
        node.appendChild(child);
      }
    });
    return node;
  }

  function renderHeader() {
    var state = store.getState();
    return el(
      'header',
      { className: 'app-header' },
      el(
        'div',
        { className: 'brand' },
        el('span', { className: 'brand-mark', text: '◆' }),
        el('h1', { text: 'NotePulse Mini' })
      ),
      el(
        'nav',
        { className: 'app-nav', 'aria-label': 'Primary' },
        el(
          'a',
          {
            href: '#',
            className: state.view === 'operations' ? 'nav-link active' : 'nav-link',
            'data-view': 'operations',
            onClick: function (e) {
              e.preventDefault();
              store.setView('operations');
            }
          },
          'Operations'
        ),
        el(
          'a',
          {
            href: '#',
            className: state.view === 'editor' ? 'nav-link active' : 'nav-link',
            'data-view': 'editor',
            onClick: function (e) {
              e.preventDefault();
              store.setView('editor');
            }
          },
          'Editor'
        ),
        el(
          'a',
          {
            href: '#',
            className: state.view === 'insights' ? 'nav-link active' : 'nav-link',
            'data-view': 'insights',
            onClick: function (e) {
              e.preventDefault();
              store.setView('insights');
            }
          },
          'Insights'
        )
      ),
      el(
        'div',
        { className: 'header-actions' },
        el(
          'button',
          {
            className: 'btn btn-secondary',
            'data-action-id': 'ACT_EXPORT_SUMMARY',
            onClick: function () {
              store.exportSummary();
            }
          },
          'Export JSON Summary'
        ),
        el(
          'button',
          {
            className: 'btn btn-ghost',
            'data-action-id': 'ACT_RETRY_LOAD',
            onClick: function () {
              store.retryLoad();
            }
          },
          'Retry Load'
        )
      )
    );
  }

  function renderOperations() {
    var state = store.getState();
    var query = state.search.toLowerCase();
    var notes = state.notes.filter(function (note) {
      if (!query) return true;
      return (
        note.title.toLowerCase().indexOf(query) !== -1 ||
        note.content.toLowerCase().indexOf(query) !== -1
      );
    });

    var section = el(
      'section',
      { className: 'view operations-view' },
      el(
        'div',
        { className: 'view-toolbar' },
        el('input', {
          type: 'text',
          className: 'input search-input',
          placeholder: 'Search records...',
          value: state.search,
          'data-action-id': 'ACT_SEARCH_RECORDS',
          onInput: function (e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function () {
              store.setSearch(e.target.value);
            }, 250);
          }
        }),
        el(
          'button',
          {
            className: 'btn btn-primary',
            'data-action-id': 'ACT_CREATE_RECORD',
            onClick: function () {
              store.startNewDraft();
            }
          },
          'Create Note'
        )
      )
    );

    if (notes.length === 0) {
      section.appendChild(el('p', { className: 'empty-state', text: 'No records found.' }));
      return section;
    }

    var list = el('ul', { className: 'record-list' });
    notes.forEach(function (note) {
      var item = el(
        'li',
        { className: 'record-card status-' + note.status, 'data-record-id': note.id },
        el(
          'div',
          { className: 'record-main' },
          el('h3', { text: note.title || '(untitled)' }),
          el('p', { className: 'record-meta', text: new Date(note.updatedAt).toLocaleString() })
        ),
        el(
          'div',
          { className: 'record-actions' },
          el(
            'button',
            {
              className: 'status-btn' + (note.status === 'active' ? ' active' : ''),
              'data-action-id': 'set-status-active',
              onClick: function () {
                store.setStatus(note.id, 'active');
              }
            },
            'Active'
          ),
          el(
            'button',
            {
              className: 'status-btn' + (note.status === 'warn' ? ' active' : ''),
              'data-action-id': 'set-status-warn',
              onClick: function () {
                store.setStatus(note.id, 'warn');
              }
            },
            'Warn'
          ),
          el(
            'button',
            {
              className: 'status-btn' + (note.status === 'fail' ? ' active' : ''),
              'data-action-id': 'set-status-fail',
              onClick: function () {
                store.setStatus(note.id, 'fail');
              }
            },
            'Fail'
          ),
          el(
            'button',
            {
              className: 'btn btn-secondary',
              'data-action-id': 'ACT_SELECT_RECORD',
              onClick: function () {
                store.editNote(note.id);
              }
            },
            'Edit'
          ),
          el(
            'button',
            {
              className: 'btn btn-danger',
              'data-action-id': 'delete-record',
              onClick: function () {
                if (confirm('Delete this record?')) {
                  store.deleteNote(note.id);
                }
              }
            },
            'Delete'
          )
        )
      );
      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  function renderEditor() {
    var state = store.getState();
    var draft = state.draft;
    if (!draft) {
      draft = store.startNewDraft();
    }

    function updateDraft(field, value) {
      draft[field] = value;
    }

    return el(
      'section',
      { className: 'view editor-view' },
      el(
        'form',
        {
          className: 'editor-form',
          onSubmit: function (e) {
            e.preventDefault();
            store.saveDraft();
          }
        },
        el(
          'label',
          { className: 'field-label', text: 'Identifier' },
          el('input', {
            type: 'text',
            className: 'input',
            placeholder: 'Enter a precise identifier...',
            value: draft.title,
            required: true,
            onInput: function (e) {
              updateDraft('title', e.target.value);
            }
          })
        ),
        el(
          'label',
          { className: 'field-label', text: 'Details' },
          el('textarea', {
            className: 'input textarea',
            placeholder: 'Document the procedural details here...',
            rows: 6,
            onInput: function (e) {
              updateDraft('content', e.target.value);
            }
          }, draft.content)
        ),
        el(
          'div',
          { className: 'status-group' },
          el('span', { className: 'field-label', text: 'Status' }),
          el(
            'button',
            {
              type: 'button',
              className: 'status-btn' + (draft.status === 'active' ? ' active' : ''),
              onClick: function () {
                updateDraft('status', 'active');
                render();
              }
            },
            'Active'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'status-btn' + (draft.status === 'warn' ? ' active' : ''),
              onClick: function () {
                updateDraft('status', 'warn');
                render();
              }
            },
            'Warn'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'status-btn' + (draft.status === 'fail' ? ' active' : ''),
              onClick: function () {
                updateDraft('status', 'fail');
                render();
              }
            },
            'Fail'
          )
        ),
        state.lastError
          ? el('p', { className: 'error-message', text: state.lastError.message })
          : null,
        el(
          'div',
          { className: 'form-actions' },
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-secondary',
              'data-action-id': 'ACT_CANCEL_EDIT',
              onClick: function () {
                store.cancelEdit();
              }
            },
            'Cancel Edit'
          ),
          el(
            'button',
            {
              type: 'submit',
              className: 'btn btn-primary',
              'data-action-id': 'ACT_SAVE_RECORD'
            },
            'Record'
          )
        )
      )
    );
  }

  function renderInsights() {
    var state = store.getState();
    var counts = {};
    store.STATUS.forEach(function (status) {
      counts[status] = state.notes.filter(function (n) {
        return n.status === status;
      }).length;
    });
    var recent = state.notes
      .slice()
      .sort(function (a, b) {
        return b.updatedAt.localeCompare(a.updatedAt);
      })
      .slice(0, 4);

    var panelContent;
    if (recent.length) {
      var list = el('ul', { className: 'recent-list' });
      recent.forEach(function (note) {
        list.appendChild(el('li', { text: note.title + ' — ' + note.status }));
      });
      panelContent = list;
    } else {
      panelContent = el('p', { text: 'No activity yet.' });
    }

    return el(
      'section',
      { className: 'view insights-view' },
      el(
        'div',
        { className: 'metrics' },
        el(
          'div',
          { className: 'metric-card' },
          el('span', { className: 'metric-value', text: state.notes.length }),
          el('span', { className: 'metric-label', text: 'Total' })
        ),
        el(
          'div',
          { className: 'metric-card status-active' },
          el('span', { className: 'metric-value', text: counts.active }),
          el('span', { className: 'metric-label', text: 'Active' })
        ),
        el(
          'div',
          { className: 'metric-card status-warn' },
          el('span', { className: 'metric-value', text: counts.warn }),
          el('span', { className: 'metric-label', text: 'Warn' })
        ),
        el(
          'div',
          { className: 'metric-card status-fail' },
          el('span', { className: 'metric-value', text: counts.fail }),
          el('span', { className: 'metric-label', text: 'Fail' })
        )
      ),
      el(
        'div',
        { className: 'panel' },
        el('h2', { text: 'Recent Activity' }),
        panelContent
      ),
      el(
        'div',
        { className: 'view-toolbar' },
        el(
          'button',
          {
            className: 'btn btn-secondary',
            'data-action-id': 'ACT_FILTER_INSIGHTS',
            onClick: function () {
              store.setView('operations');
            }
          },
          'Filter Insights'
        ),
        el(
          'button',
          {
            className: 'btn btn-primary',
            'data-action-id': 'resolve-insights',
            onClick: function () {
              if (typeof store.resolveAllNotes === 'function') {
                store.resolveAllNotes();
              }
            }
          },
          'Resolve'
        )
      )
    );
  }

  function render() {
    if (!container) return;
    var state = store.getState();
    var previousActiveId = document.activeElement ? document.activeElement.getAttribute('data-action-id') : null;

    container.innerHTML = '';
    container.appendChild(renderHeader());

    if (state.lastError && state.view !== 'editor') {
      container.appendChild(
        el(
          'div',
          { className: 'error-banner' },
          el('span', { text: state.lastError.message || 'Something went wrong.' }),
          el(
            'button',
            {
              className: 'btn btn-ghost',
              onClick: function () {
                store.clearError();
              }
            },
            'Dismiss'
          )
        )
      );
    }

    if (state.view === 'operations') {
      container.appendChild(renderOperations());
    } else if (state.view === 'editor') {
      container.appendChild(renderEditor());
    } else if (state.view === 'insights') {
      container.appendChild(renderInsights());
    }

    if (previousActiveId === 'ACT_SEARCH_RECORDS') {
      var searchInput = container.querySelector('[data-action-id="ACT_SEARCH_RECORDS"]');
      if (searchInput) {
        searchInput.focus();
        var len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
      }
    }
  }

  store.subscribe(render);
  store.init().then(function () {
    window.app = store;
    window.setfarmStaticReady = true;
  });
})();
