console.log("APP JS LOADED");

// ============================================================
//  Thailand Trip Planner — app.js (v2 — Collaborative)
// ============================================================

// ============================================================
//  SUPABASE
// ============================================================

console.log('App.js loaded');

const SUPABASE_URL = 'https://askvzamahozscwnbezwc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ynMNxMawzMwtMfYpm6v8Vw_LNFUQjDb';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('Supabase client created');

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabaseClient.from('itinerary_items').select('*');
  if (error) {
    console.error('Supabase connection error:', error.message);
  } else {
    console.log('Supabase connected. Rows returned:', data);
  }
}
testSupabaseConnection();

// Read ?trip=xyz from URL; fall back to "default-trip"
function getTripId() {
  return new URLSearchParams(window.location.search).get('trip') || 'default-trip';
}

// In-memory itinerary store — single source of truth, populated from Supabase on load.
// All reads go through getStoredItinerary(); all writes go through saveItinerary().
const _itineraryCache = { user1: {}, user2: {} };

// Fetch both users' rows from Supabase and populate _itineraryCache.
async function loadItineraryFromSupabase() {
  const tripId = getTripId();
  const { data, error } = await supabaseClient
    .from('itinerary_items')
    .select('activity, day, user')
    .eq('trip_id', tripId);

  if (error) {
    console.error('Supabase load error:', error.message);
    return;
  }

  // Reset cache, then rebuild from DB rows
  _itineraryCache.user1 = {};
  _itineraryCache.user2 = {};
  data.forEach(({ activity, day, user }) => {
    const target = user === 'user1' ? _itineraryCache.user1 : _itineraryCache.user2;
    if (!target[day]) target[day] = [];
    target[day].push(activity);
  });
}

// Granular Supabase helpers — each fires independently (fire-and-forget callers).

async function supabaseInsertActivity(actId, dayKey, userKey) {
  const { error } = await supabaseClient.from('itinerary_items').insert({
    trip_id: getTripId(),
    activity: actId,
    day:      dayKey,
    user:     userKey,
    city:     dayKey.split('|')[0]
  });
  if (error) console.error('Supabase insert error:', error.message);
}

async function supabaseDeleteActivity(actId, dayKey, userKey) {
  const { error } = await supabaseClient
    .from('itinerary_items')
    .delete()
    .eq('trip_id', getTripId())
    .eq('activity', actId)
    .eq('day',      dayKey)
    .eq('user',     userKey);
  if (error) console.error('Supabase delete error:', error.message);
}

async function supabaseMoveActivity(actId, fromDayKey, toDayKey, userKey) {
  const { error } = await supabaseClient
    .from('itinerary_items')
    .update({ day: toDayKey, city: toDayKey.split('|')[0] })
    .eq('trip_id', getTripId())
    .eq('activity', actId)
    .eq('day',      fromDayKey)
    .eq('user',     userKey);
  if (error) console.error('Supabase move error:', error.message);
}

const App = {
  users: null,           // { user1, user2, bangkokDays, chiangMaiDays }
  activeUser: 'user1',   // 'user1' | 'user2' | 'combined'
  filters: { city: 'all', type: 'all', cost: 'all', duration: 'all', bookmarked: false },
  ignoredConflicts:  new Set(), // activity IDs dismissed for this combined session
  combinedEditMode:  false,     // true while the combined itinerary is being edited
  combinedPreEditState: null    // snapshot of override before entering edit (for Cancel)
};

const LS_USERS             = 'tp_users';
const LS_ITINERARY_1       = 'tp_itinerary_1';
const LS_ITINERARY_2       = 'tp_itinerary_2';
const LS_BOOKMARKS_1       = 'tp_bookmarks_1';
const LS_BOOKMARKS_2       = 'tp_bookmarks_2';
const LS_TIME_OVERRIDES    = 'tp_time_overrides';
const LS_CUSTOM            = 'tp_custom_activities';
const LS_COMBINED_OVERRIDE  = 'tp_combined_override';
const LS_ACTIVITY_OVERRIDES = 'tp_activity_overrides'; // { actId: dayKey } — from suggestion resolution

// Sortable instances active during combined edit mode
let _combinedSortables = [];

const ITINERARY_KEYS = { user1: LS_ITINERARY_1, user2: LS_ITINERARY_2 };
const BOOKMARK_KEYS  = { user1: LS_BOOKMARKS_1, user2: LS_BOOKMARKS_2 };

const TIME_OPTIONS = [
  'Early Morning', 'Morning', 'Afternoon', 'Sunset', 'Evening', 'Night', 'Anytime'
];

const DURATION_HOURS = {
  'Under 1 hour': 0.75,
  '1-2 hours':    1.5,
  '2-3 hours':    2.5,
  '3-4 hours':    3.5,
  'Half day':     4.5,
  'Full day':     8
};

// ============================================================
//  BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  migrateOldData();
  migratePrefsToBookmarks();
  const saved = localStorage.getItem(LS_USERS);
  if (saved) {
    App.users = JSON.parse(saved);
    showDashboard();
  } else {
    showOnboarding();
  }
});

// Auto-migrate v1 single-user data
function migrateOldData() {
  const oldUser  = localStorage.getItem('tp_user');
  const newUsers = localStorage.getItem(LS_USERS);
  if (!oldUser || newUsers) return;

  const u = JSON.parse(oldUser);
  localStorage.setItem(LS_USERS, JSON.stringify({
    user1: u.name, user2: 'User 2',
    bangkokDays: u.bangkokDays, chiangMaiDays: u.chiangMaiDays
  }));
  const oldBookmarks = localStorage.getItem('tp_bookmarks');
  if (oldBookmarks) {
    const prefs = {};
    JSON.parse(oldBookmarks).forEach(id => { prefs[id] = 'mustdo'; });
    localStorage.setItem(LS_PREFS_1, JSON.stringify(prefs));
  }
  ['tp_user', 'tp_itinerary', 'tp_bookmarks'].forEach(k => localStorage.removeItem(k));
}

// Migrate v2 prefs (mustdo/interested/skip) to v3 bookmarks (simple array)
function migratePrefsToBookmarks() {
  [['tp_prefs_1', LS_BOOKMARKS_1], ['tp_prefs_2', LS_BOOKMARKS_2]].forEach(([prefsKey, bmKey]) => {
    const raw = localStorage.getItem(prefsKey);
    if (!raw) return;
    if (!localStorage.getItem(bmKey)) {
      const prefs = JSON.parse(raw);
      const ids = Object.keys(prefs).filter(id => prefs[id] === 'interested' || prefs[id] === 'mustdo');
      localStorage.setItem(bmKey, JSON.stringify(ids));
    }
    localStorage.removeItem(prefsKey);
  });
}

// ============================================================
//  CUSTOM ACTIVITIES
// ============================================================

function getCustomActivities() {
  const raw = localStorage.getItem(LS_CUSTOM);
  return raw ? JSON.parse(raw) : [];
}

function saveCustomActivity(activity) {
  const list = getCustomActivities();
  list.push(activity);
  localStorage.setItem(LS_CUSTOM, JSON.stringify(list));
}

function getAllActivities() {
  return ACTIVITIES.concat(getCustomActivities());
}

// ============================================================
//  ONBOARDING
// ============================================================

function showOnboarding() {
  document.getElementById('screen-onboarding').classList.remove('hidden');
  document.getElementById('screen-dashboard').classList.add('hidden');
  window.scrollTo(0, 0);

  bindDaysStepper('bkk-days-input', 'bkk-dec', 'bkk-inc', 1, 21);
  bindDaysStepper('cnx-days-input', 'cnx-dec', 'cnx-inc', 1, 21);

  document.getElementById('onboarding-form').addEventListener('submit', handleOnboardingSubmit);

  const ctaBtn = document.getElementById('hero-cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      document.getElementById('setup-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function bindDaysStepper(inputId, decId, incId, min, max) {
  const input = document.getElementById(inputId);
  document.getElementById(decId).addEventListener('click', () => {
    const v = parseInt(input.value, 10);
    if (v > min) input.value = v - 1;
  });
  document.getElementById(incId).addEventListener('click', () => {
    const v = parseInt(input.value, 10);
    if (v < max) input.value = v + 1;
  });
}

function handleOnboardingSubmit(e) {
  e.preventDefault();
  const u1El = document.getElementById('user1-name');
  const u2El = document.getElementById('user2-name');
  const user1 = u1El.value.trim();
  const user2 = u2El.value.trim();
  u1El.classList.remove('input-error');
  u2El.classList.remove('input-error');
  if (!user1) { u1El.classList.add('input-error'); }
  if (!user2) { u2El.classList.add('input-error'); }
  if (!user1 || !user2) return;

  App.users = {
    user1,
    user2,
    bangkokDays:   parseInt(document.getElementById('bkk-days-input').value, 10),
    chiangMaiDays: parseInt(document.getElementById('cnx-days-input').value, 10)
  };
  localStorage.setItem(LS_USERS, JSON.stringify(App.users));
  showDashboard();
}

// ============================================================
//  DASHBOARD
// ============================================================

async function showDashboard() {
  document.getElementById('screen-onboarding').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('hidden');

  renderHeader();
  populateFilterSelects();
  setupFilterListeners();
  setupAddActivityModal();
  document.getElementById('btn-generate-plan').addEventListener('click', generateFinalPlan);
  document.getElementById('btn-edit-combined').addEventListener('click', enterCombinedEditMode);
  document.getElementById('btn-recalc-combined').addEventListener('click', recalculateCombinedPlan);
  document.getElementById('btn-save-combined').addEventListener('click', saveCombinedChanges);
  document.getElementById('btn-cancel-combined').addEventListener('click', cancelCombinedEdit);

  // Load itinerary from Supabase into localStorage before rendering
  await loadItineraryFromSupabase();
  switchUser('user1');
}

// ============================================================
//  HEADER
// ============================================================

function renderHeader() {
  const u = App.users;
  document.getElementById('header-name').textContent = `${u.user1} & ${u.user2}`;
  document.getElementById('header-bkk-days').textContent =
    `${u.bangkokDays} day${u.bangkokDays !== 1 ? 's' : ''} Bangkok`;
  document.getElementById('header-cnx-days').textContent =
    `${u.chiangMaiDays} day${u.chiangMaiDays !== 1 ? 's' : ''} Chiang Mai`;

  document.getElementById('btn-clear-itinerary').addEventListener('click', clearItinerary);
  document.getElementById('btn-reset').addEventListener('click', resetApp);

  renderUserTabs();
  updateActivityStat();
}

function renderUserTabs() {
  const container = document.getElementById('user-tabs');
  container.innerHTML = '';
  const tabs = [
    { key: 'user1',    label: App.users.user1 },
    { key: 'user2',    label: App.users.user2 },
    { key: 'combined', label: 'Combined' }
  ];
  tabs.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = 'user-tab' + (App.activeUser === key ? ' active' : '');
    if (key === 'combined') btn.classList.add('user-tab-combined');
    btn.dataset.user = key;
    btn.textContent = label;
    btn.addEventListener('click', () => switchUser(key));
    container.appendChild(btn);
  });
}

function updateActivityStat() {
  let count;
  if (App.activeUser === 'combined') {
    const i1 = getStoredItinerary('user1');
    const i2 = getStoredItinerary('user2');
    const ids = new Set([...Object.values(i1).flat(), ...Object.values(i2).flat()]);
    count = ids.size;
  } else {
    count = document.querySelectorAll('.day-sortable .activity-card').length;
  }
  document.getElementById('stat-activities').textContent =
    count === 0 ? '0 planned' : `${count} planned`;
}

// ============================================================
//  USER SWITCHING
// ============================================================

function switchUser(viewKey) {
  // Leaving combined view: clean up edit mode
  if (App.activeUser === 'combined' && viewKey !== 'combined') {
    destroyCombinedSortables();
    App.combinedEditMode = false;
    document.getElementById('itinerary-panel').classList.remove('combined-editing');
  }

  App.activeUser = viewKey;
  document.querySelectorAll('.user-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.user === viewKey);
  });

  const isCombined = viewKey === 'combined';
  const hint = document.getElementById('itinerary-hint');
  if (hint) {
    hint.textContent = isCombined
      ? 'Read-only — click Edit to rearrange the combined itinerary'
      : 'Drag activities from the library into your days';
  }

  if (isCombined) {
    renderCombinedView();
    updateCombinedModeUI(false);
  } else {
    App.ignoredConflicts = new Set(); // reset dismissed suggestions on leaving combined
    const suggPanel = document.getElementById('collab-suggestions-panel');
    if (suggPanel) suggPanel.style.display = 'none';
    renderItineraryColumns();
    restoreItinerary();
    updateCombinedModeUI(false);
  }

  renderLibrary();
  updateActivityStat();
}

// ============================================================
//  FILTERS
// ============================================================

const DURATION_ORDER = ['Under 1 hour', '1-2 hours', '2-3 hours', '3-4 hours', 'Half day', 'Full day'];

function populateFilterSelects() {
  const all = getAllActivities();
  populateSelect('filter-type', [...new Set(all.map(a => a.type))].sort());
  populateSelect('filter-cost', ['Free', '$', '$$', '$$$']);
  populateSelect('filter-duration', DURATION_ORDER.filter(d => all.some(a => a.duration === d)));
}

function populateSelect(id, values) {
  const sel = document.getElementById(id);
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}

function setupFilterListeners() {
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      App.filters.city = btn.dataset.city;
      renderLibrary();
    });
  });

  document.getElementById('btn-bookmarked').addEventListener('click', () => {
    App.filters.bookmarked = !App.filters.bookmarked;
    document.getElementById('btn-bookmarked').classList.toggle('active', App.filters.bookmarked);
    renderLibrary();
  });

  ['filter-type', 'filter-cost', 'filter-duration'].forEach(id => {
    document.getElementById(id).addEventListener('change', e => {
      App.filters[id.replace('filter-', '')] = e.target.value;
      e.target.classList.toggle('active', e.target.value !== 'all');
      renderLibrary();
    });
  });
}

function filterActivities() {
  const results = getAllActivities().filter(a => {
    if (App.filters.city !== 'all'     && a.city     !== App.filters.city)     return false;
    if (App.filters.type !== 'all'     && a.type     !== App.filters.type)     return false;
    if (App.filters.cost !== 'all'     && a.cost     !== App.filters.cost)     return false;
    if (App.filters.duration !== 'all' && a.duration !== App.filters.duration) return false;
    if (App.filters.bookmarked) {
      if (App.activeUser === 'combined') {
        if (!isBookmarked(a.id, 'user1') && !isBookmarked(a.id, 'user2')) return false;
      } else {
        if (!isBookmarked(a.id)) return false;
      }
    }
    return true;
  });

  // Sort: bookmarked activities float to the top
  // Combined mode: both-bookmarked(2) > one-bookmarked(1) > none(0)
  // Single-user mode: bookmarked(1) > none(0)
  results.sort((a, b) => bookmarkSortKey(b.id) - bookmarkSortKey(a.id));
  return results;
}

function bookmarkSortKey(id) {
  if (App.activeUser === 'combined') {
    const b1 = isBookmarked(id, 'user1');
    const b2 = isBookmarked(id, 'user2');
    return (b1 && b2) ? 2 : (b1 || b2) ? 1 : 0;
  }
  return isBookmarked(id) ? 1 : 0;
}

// ============================================================
//  ACTIVITY LIBRARY
// ============================================================

function renderLibrary() {
  const results   = filterActivities();
  const container = document.getElementById('activity-list-sortable');
  container.innerHTML = '';
  const isCombined = App.activeUser === 'combined';

  if (results.length === 0) {
    container.innerHTML = '<div class="no-results">No activities match these filters.</div>';
    setupLibrarySortable();
    document.getElementById('activity-count').textContent = '0 activities';
    return;
  }

  results.forEach(a => container.appendChild(createLibraryCard(a)));
  document.getElementById('activity-count').textContent =
    `${results.length} of ${getAllActivities().length} activities`;
  setupLibrarySortable();
}

function createLibraryCard(activity) {
  const card = document.createElement('div');
  card.className = 'activity-card';
  card.dataset.id = activity.id;

  const isCombined  = App.activeUser === 'combined';
  const currentTime = getTimeOverride(activity.id) || activity.bestTime;

  const timeOptions = TIME_OPTIONS.map(t =>
    `<option value="${escHtml(t)}"${t === currentTime ? ' selected' : ''}>${escHtml(t)}</option>`
  ).join('');

  const linkHtml = (activity.link && activity.link !== '#')
    ? `<a href="${escHtml(activity.link)}" target="_blank" rel="noopener noreferrer" class="card-link">↗</a>`
    : '';

  const customBadge = activity.custom ? `<span class="custom-badge">Custom</span>` : '';
  const descHtml    = activity.description ? `<p class="card-desc">${escHtml(activity.description)}</p>` : '';

  // Bookmark button (single user) or attribution tags (combined view)
  let bmTopHtml = '', bmBodyHtml = '';
  if (isCombined) {
    const bm1 = isBookmarked(activity.id, 'user1');
    const bm2 = isBookmarked(activity.id, 'user2');
    if (bm1 || bm2) {
      bmBodyHtml = `<div class="bookmark-attribution">` +
        (bm1 ? `<span class="bm-tag bm-user1">&#9829; ${escHtml(App.users.user1)}</span>` : '') +
        (bm2 ? `<span class="bm-tag bm-user2">&#9829; ${escHtml(App.users.user2)}</span>` : '') +
        `</div>`;
    }
  } else {
    const bm = isBookmarked(activity.id);
    bmTopHtml = `<button class="bookmark-btn${bm ? ' bookmarked' : ''}" title="Bookmark">&#9829;</button>`;
  }

  card.innerHTML = `
    <div class="card-top">
      <span class="type-badge ${typeBadgeClass(activity.type)}">${escHtml(activity.type)}</span>
      ${customBadge}
      <span class="card-duration">${escHtml(activity.duration)}</span>
      ${bmTopHtml}
    </div>
    <p class="card-name">${escHtml(activity.name)}</p>
    ${bmBodyHtml}
    ${descHtml}
    <div class="card-meta">
      <span class="meta-item area-text">${escHtml(activity.area || activity.city)}</span>
      <span class="meta-sep">·</span>
      <select class="time-select" title="Adjust visit time">${timeOptions}</select>
      <span class="meta-sep">·</span>
      <span class="meta-item cost-badge ${costClass(activity.cost)}">${escHtml(activity.cost)}</span>
      ${linkHtml}
    </div>
  `;

  setupCardListeners(card, activity.id);
  return card;
}

function setupCardListeners(card, activityId) {
  // JS properties are not copied by cloneNode, so this guard prevents duplicate
  // listeners on cards moved between day columns without affecting library clones.
  if (card._listenersSetup) return;
  card._listenersSetup = true;
  const id = activityId || card.dataset.id;

  const timeSelect = card.querySelector('.time-select');
  if (timeSelect) {
    timeSelect.addEventListener('mousedown', e => e.stopPropagation());
    timeSelect.addEventListener('change', e => {
      e.stopPropagation();
      saveTimeOverride(id, e.target.value);
    });
  }

  const bmBtn = card.querySelector('.bookmark-btn');
  if (bmBtn) {
    bmBtn.addEventListener('mousedown', e => e.stopPropagation());
    bmBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleBookmark(id);
    });
  }
}

function setupLibrarySortable() {
  const list = document.getElementById('activity-list-sortable');
  if (list._sortable) list._sortable.destroy();
  list._sortable = new Sortable(list, {
    group: { name: 'trip', pull: 'clone', put: false },
    sort: false,
    animation: 120,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    filter: '.bookmark-btn, .remove-btn, .time-select, .card-link',
    preventOnFilter: false,
    disabled: App.activeUser === 'combined'
  });
}

// ============================================================
//  ITINERARY COLUMNS
// ============================================================

function renderItineraryColumns() {
  const container = document.getElementById('days-scroll');
  container.innerHTML = '';
  for (let i = 1; i <= App.users.chiangMaiDays; i++) container.appendChild(buildDayColumn('Chiang Mai', i));
  for (let i = 1; i <= App.users.bangkokDays; i++)    container.appendChild(buildDayColumn('Bangkok', i));
}

function buildDayColumn(city, dayNum) {
  const key = `${city}|Day ${dayNum}`;
  const col = document.createElement('div');
  const citySlug = city === 'Bangkok' ? 'bangkok' : 'chiangmai';
  col.className = `day-column day-column--${citySlug}`;
  const cityClass = city === 'Bangkok' ? 'day-city-bangkok' : 'day-city-chiangmai';

  col.innerHTML = `
    <div class="day-column-header">
      <div class="day-city-label ${cityClass}">${city}</div>
      <div class="day-header-row">
        <div class="day-number">Day ${dayNum}</div>
        <div class="day-pacing-info">
          <div class="day-pacing-bar"><div class="day-pacing-fill pacing-empty"></div></div>
          <span class="day-hours-label"></span>
        </div>
      </div>
    </div>
    <div class="day-sortable" data-day="${escHtml(key)}">
      <div class="empty-day-msg">Drag activities here</div>
    </div>
    <div class="day-footer"></div>
  `;

  const sortableEl = col.querySelector('.day-sortable');
  new Sortable(sortableEl, {
    group: { name: 'trip', pull: true, put: true },
    animation: 120,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    filter: '.bookmark-btn, .remove-btn, .time-select, .card-link',
    preventOnFilter: false,
    onAdd(evt) {
      addRemoveButton(evt.item);
      setupCardListeners(evt.item);
      toggleEmptyMsg(evt.to);
      saveItinerary();
      supabaseInsertActivity(evt.item.dataset.id, evt.to.dataset.day, App.activeUser);
      updateActivityStat();
    },
    onUpdate() { saveItinerary(); }, // reorder within same day — no row change needed
    onRemove(evt) {
      toggleEmptyMsg(evt.from);
      saveItinerary();
      // Delete from source day; if this is a cross-column move, onAdd on the
      // destination column will INSERT the new row — net effect is an UPDATE.
      supabaseDeleteActivity(evt.item.dataset.id, evt.from.dataset.day, App.activeUser);
      updateActivityStat();
    }
  });

  return col;
}

function addRemoveButton(cardEl) {
  if (cardEl.querySelector('.remove-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'remove-btn';
  btn.title = 'Remove';
  btn.innerHTML = '&times;';
  btn.addEventListener('mousedown', e => e.stopPropagation());
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const col   = cardEl.closest('.day-sortable');
    const actId = cardEl.dataset.id;
    const dayKey = col ? col.dataset.day : null;
    cardEl.remove();
    if (col) toggleEmptyMsg(col);
    saveItinerary();
    if (actId && dayKey) supabaseDeleteActivity(actId, dayKey, App.activeUser);
    updateActivityStat();
  });
  const cardTop = cardEl.querySelector('.card-top');
  if (cardTop) cardTop.appendChild(btn);
  else cardEl.appendChild(btn);
}

function toggleEmptyMsg(colEl) {
  const msg = colEl.querySelector('.empty-day-msg');
  if (!msg) return;
  msg.style.display = colEl.querySelectorAll('.activity-card').length > 0 ? 'none' : '';
}

// ============================================================
//  COMBINED VIEW
// ============================================================

function renderCombinedView() {
  const container = document.getElementById('days-scroll');
  container.innerHTML = '';

  const itin1 = getStoredItinerary('user1');
  const itin2 = getStoredItinerary('user2');
  const all   = getAllActivities();

  // Precompute conflict map from user itineraries (always — never from overrides).
  const map1 = {}, map2 = {};
  Object.entries(itin1).forEach(([dk, ids]) => ids.forEach(id => { map1[id] = dk; }));
  Object.entries(itin2).forEach(([dk, ids]) => ids.forEach(id => { map2[id] = dk; }));
  const conflictMap = {};
  Object.keys(map1).forEach(id => {
    if (map2[id] && map1[id] !== map2[id]) conflictMap[id] = { day1: map1[id], day2: map2[id] };
  });
  // Activities that have been explicitly placed via suggestion resolution are no
  // longer "conflicting" in the combined view — remove them from the conflict map.
  const actOverrides = getActivityOverrides();
  Object.keys(actOverrides).forEach(id => { delete conflictMap[id]; });

  // Full-itinerary attribution sets (used when layout comes from an override).
  const allIds1 = new Set(Object.values(itin1).flat());
  const allIds2 = new Set(Object.values(itin2).flat());

  // Use the effective combined layout (respects both full override and per-activity overrides).
  const effectiveLayout = getEffectiveCombinedLayout();

  [
    { city: 'Chiang Mai', days: App.users.chiangMaiDays },
    { city: 'Bangkok',    days: App.users.bangkokDays }
  ].forEach(({ city, days }) => {
    for (let d = 1; d <= days; d++) {
      container.appendChild(
        buildCombinedDayColumn(city, d, itin1, itin2, all, conflictMap, effectiveLayout, allIds1, allIds2)
      );
    }
  });

  if (App.combinedEditMode) setupCombinedSortables();

  renderCollabSuggestions();
}

function buildCombinedDayColumn(city, dayNum, itin1, itin2, all, conflictMap, override, allIds1, allIds2) {
  const key    = `${city}|Day ${dayNum}`;
  const ids1   = itin1[key] || [];
  const ids2   = itin2[key] || [];

  // When an override exists, use its layout; otherwise merge per-day.
  let mergedIds;
  if (override) {
    mergedIds = override[key] || [];
  } else {
    const seen = new Set();
    mergedIds = [];
    [...ids1, ...ids2].forEach(id => { if (!seen.has(id)) { seen.add(id); mergedIds.push(id); } });
  }

  const col = document.createElement('div');
  const citySlugC = city === 'Bangkok' ? 'bangkok' : 'chiangmai';
  col.className = `day-column day-column--${citySlugC}`;
  const cityClass = city === 'Bangkok' ? 'day-city-bangkok' : 'day-city-chiangmai';

  col.innerHTML = `
    <div class="day-column-header">
      <div class="day-city-label ${cityClass}">${city}</div>
      <div class="day-header-row">
        <div class="day-number">Day ${dayNum}</div>
        <div class="day-pacing-info">
          <div class="day-pacing-bar"><div class="day-pacing-fill pacing-empty"></div></div>
          <span class="day-hours-label"></span>
        </div>
      </div>
    </div>
    <div class="day-sortable-combined" data-day="${escHtml(key)}">
      <div class="empty-day-msg">No activities planned yet</div>
    </div>
    <div class="day-footer"></div>
  `;

  const sortableEl = col.querySelector('.day-sortable-combined');

  mergedIds.forEach(id => {
    const activity = all.find(a => a.id === id);
    if (!activity) return;
    // In override mode, use full-itinerary attribution so badges remain correct
    // even when an activity has been moved to a different day.
    const inUser1        = override ? (allIds1 ? allIds1.has(id) : ids1.includes(id)) : ids1.includes(id);
    const inUser2        = override ? (allIds2 ? allIds2.has(id) : ids2.includes(id)) : ids2.includes(id);
    const bothBookmarked = isBookmarked(id, 'user1') && isBookmarked(id, 'user2');
    const conflict       = conflictMap ? conflictMap[id] : null;
    sortableEl.appendChild(createCombinedCard(activity, inUser1, inUser2, bothBookmarked, conflict, App.combinedEditMode));
  });

  if (mergedIds.length > 0) {
    const emptyMsg = sortableEl.querySelector('.empty-day-msg');
    if (emptyMsg) emptyMsg.style.display = 'none';
  }

  // Pacing bar for combined
  const activities = mergedIds.map(id => all.find(a => a.id === id)).filter(Boolean);
  const totalHours = activities.reduce((sum, a) => sum + durationToHours(a.duration), 0);
  const fill  = col.querySelector('.day-pacing-fill');
  const label = col.querySelector('.day-hours-label');
  if (fill && label && totalHours > 0) {
    fill.style.width   = Math.min((totalHours / 10) * 100, 100) + '%';
    fill.className     = 'day-pacing-fill ' + getPacingClass(totalHours);
    label.textContent  = formatHours(totalHours);
  }

  return col;
}

function createCombinedCard(activity, inUser1, inUser2, bothBookmarked, conflict, showRemove) {
  const card = document.createElement('div');
  const extraClass = conflict ? ' card-conflict' : bothBookmarked ? ' card-both-bookmarked' : '';
  card.className = 'activity-card combined-card' + extraClass;
  card.dataset.id = activity.id;

  let badgeClass, badgeText;
  if (conflict) {
    badgeClass = 'collab-badge collab-conflict';
    badgeText  = 'Suggestion';
  } else if (inUser1 && inUser2) {
    badgeClass = 'collab-badge collab-both';
    badgeText  = 'Both';
  } else if (inUser1) {
    badgeClass = 'collab-badge collab-user1';
    badgeText  = App.users.user1;
  } else {
    badgeClass = 'collab-badge collab-user2';
    badgeText  = App.users.user2;
  }

  let conflictHtml = '';
  if (conflict) {
    const [city1, dayLabel1] = conflict.day1.split('|');
    const [city2, dayLabel2] = conflict.day2.split('|');
    const loc1 = city1 !== city2 ? `${city1} ${dayLabel1}` : dayLabel1;
    const loc2 = city1 !== city2 ? `${city2} ${dayLabel2}` : dayLabel2;
    conflictHtml = `
      <div class="conflict-indicator">
        <span class="conflict-users">
          <span class="conflict-user1">${escHtml(App.users.user1)} → ${escHtml(loc1)}</span>
          <span class="conflict-sep">·</span>
          <span class="conflict-user2">${escHtml(App.users.user2)} → ${escHtml(loc2)}</span>
        </span>
      </div>`;
  }

  const bothBookmarkedHtml = (!conflict && bothBookmarked)
    ? `<div class="both-bookmarked-banner">&#9829; Both interested</div>`
    : '';

  const removeBtnHtml = showRemove
    ? `<button class="remove-btn-combined" title="Remove from combined itinerary">&times;</button>`
    : '';

  card.innerHTML = `
    <div class="card-top">
      <span class="type-badge ${typeBadgeClass(activity.type)}">${escHtml(activity.type)}</span>
      <span class="card-duration">${escHtml(activity.duration)}</span>
      <span class="${badgeClass}">${escHtml(badgeText)}</span>
      ${removeBtnHtml}
    </div>
    <p class="card-name">${escHtml(activity.name)}</p>
    ${conflictHtml}
    <div class="card-meta">
      <span class="meta-item area-text">${escHtml(activity.area || activity.city)}</span>
      <span class="meta-sep">·</span>
      <span class="meta-item">${escHtml(getTimeOverride(activity.id) || activity.bestTime)}</span>
      <span class="meta-sep">·</span>
      <span class="meta-item cost-badge ${costClass(activity.cost)}">${escHtml(activity.cost)}</span>
    </div>
    ${bothBookmarkedHtml}
  `;

  if (showRemove) {
    const removeBtn = card.querySelector('.remove-btn-combined');
    removeBtn.addEventListener('mousedown', e => e.stopPropagation());
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      const col = card.closest('.day-sortable-combined');
      card.remove();
      if (col) toggleEmptyMsg(col);
      saveCombinedOverride();
    });
  }

  return card;
}

// ============================================================
//  COMBINED EDIT MODE
// ============================================================

function getCombinedOverride() {
  const raw = localStorage.getItem(LS_COMBINED_OVERRIDE);
  return raw ? JSON.parse(raw) : null;
}

function saveCombinedOverride() {
  const override = {};
  document.querySelectorAll('.day-sortable-combined').forEach(col => {
    const day = col.dataset.day;
    override[day] = [...col.querySelectorAll('.activity-card')].map(c => c.dataset.id);
  });
  localStorage.setItem(LS_COMBINED_OVERRIDE, JSON.stringify(override));
}

function clearCombinedOverride() {
  localStorage.removeItem(LS_COMBINED_OVERRIDE);
}

// Activity-level overrides: { actId: dayKey }
// Set by accepting / editing a suggestion. Does NOT modify user itineraries.
function getActivityOverrides() {
  const raw = localStorage.getItem(LS_ACTIVITY_OVERRIDES);
  return raw ? JSON.parse(raw) : {};
}

function setActivityOverride(activityId, dayKey) {
  const overrides = getActivityOverrides();
  overrides[activityId] = dayKey;
  localStorage.setItem(LS_ACTIVITY_OVERRIDES, JSON.stringify(overrides));
}

function clearActivityOverrides() {
  localStorage.removeItem(LS_ACTIVITY_OVERRIDES);
}

// Returns the layout the combined view should display:
//   1. tp_combined_override (full drag-drop layout) takes total precedence.
//   2. Otherwise: merge user itineraries per day, then apply activity-level overrides.
function getEffectiveCombinedLayout() {
  const fullOverride = getCombinedOverride();
  if (fullOverride) return fullOverride;

  const itin1 = getStoredItinerary('user1');
  const itin2 = getStoredItinerary('user2');
  const actOverrides = getActivityOverrides();

  // Build base merged layout
  const layout = {};
  getAllDayKeys().forEach(dayKey => {
    const ids1 = itin1[dayKey] || [];
    const ids2 = itin2[dayKey] || [];
    const seen = new Set();
    const merged = [];
    [...ids1, ...ids2].forEach(id => { if (!seen.has(id)) { seen.add(id); merged.push(id); } });
    if (merged.length > 0) layout[dayKey] = merged;
  });

  // Apply per-activity overrides: move each overridden activity to its assigned day
  Object.entries(actOverrides).forEach(([actId, targetDay]) => {
    // Remove from wherever it currently sits
    Object.keys(layout).forEach(dayKey => {
      if (dayKey !== targetDay) {
        layout[dayKey] = (layout[dayKey] || []).filter(id => id !== actId);
        if (layout[dayKey].length === 0) delete layout[dayKey];
      }
    });
    // Ensure it appears in the target day
    if (!layout[targetDay]) layout[targetDay] = [];
    if (!layout[targetDay].includes(actId)) layout[targetDay].push(actId);
  });

  return layout;
}

function setupCombinedSortables() {
  destroyCombinedSortables();
  document.querySelectorAll('.day-sortable-combined').forEach(el => {
    const s = new Sortable(el, {
      group: { name: 'combined-edit', pull: true, put: true },
      animation: 120,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: '.remove-btn-combined, .time-select',
      preventOnFilter: false,
      onEnd() { saveCombinedOverride(); }
    });
    _combinedSortables.push(s);
  });
}

function destroyCombinedSortables() {
  _combinedSortables.forEach(s => s.destroy());
  _combinedSortables = [];
}

function enterCombinedEditMode() {
  // Snapshot current override state so Cancel can restore it.
  App.combinedPreEditState = getCombinedOverride();

  // Initialise tp_combined_override from the effective combined layout (which
  // respects any existing per-activity suggestion overrides) if not already set.
  if (!getCombinedOverride()) {
    localStorage.setItem(LS_COMBINED_OVERRIDE, JSON.stringify(getEffectiveCombinedLayout()));
  }

  App.combinedEditMode = true;
  document.getElementById('itinerary-panel').classList.add('combined-editing');
  renderCombinedView(); // re-renders with override + activates sortables
  updateCombinedModeUI(true);
}

function saveCombinedChanges() {
  saveCombinedOverride(); // ensure latest DOM state is persisted
  App.combinedEditMode = false;
  App.combinedPreEditState = null;
  destroyCombinedSortables();
  document.getElementById('itinerary-panel').classList.remove('combined-editing');
  renderCombinedView();
  updateCombinedModeUI(false);
}

function cancelCombinedEdit() {
  // Restore the snapshot taken when edit mode was entered.
  if (App.combinedPreEditState) {
    localStorage.setItem(LS_COMBINED_OVERRIDE, JSON.stringify(App.combinedPreEditState));
  } else {
    clearCombinedOverride();
  }
  App.combinedEditMode = false;
  App.combinedPreEditState = null;
  destroyCombinedSortables();
  document.getElementById('itinerary-panel').classList.remove('combined-editing');
  renderCombinedView();
  updateCombinedModeUI(false);
}

function recalculateCombinedPlan() {
  if (!confirm('Discard the manual combined itinerary and recompute from both users\' plans?')) return;
  clearCombinedOverride();
  clearActivityOverrides();
  App.combinedEditMode = false;
  App.combinedPreEditState = null;
  destroyCombinedSortables();
  document.getElementById('itinerary-panel').classList.remove('combined-editing');
  App.ignoredConflicts = new Set();
  renderCombinedView();
  updateCombinedModeUI(false);
}

function updateCombinedModeUI(editing) {
  const isCombined   = App.activeUser === 'combined';
  const editBtn      = document.getElementById('btn-edit-combined');
  const recalcBtn    = document.getElementById('btn-recalc-combined');
  const saveBtn      = document.getElementById('btn-save-combined');
  const cancelBtn    = document.getElementById('btn-cancel-combined');
  const genBtn       = document.getElementById('btn-generate-plan');
  const hint         = document.getElementById('itinerary-hint');

  if (!isCombined) {
    editBtn.style.display    = 'none';
    recalcBtn.style.display  = 'none';
    saveBtn.style.display    = 'none';
    cancelBtn.style.display  = 'none';
    genBtn.style.display     = 'none';
    return;
  }

  if (editing) {
    editBtn.style.display    = 'none';
    recalcBtn.style.display  = 'none';
    saveBtn.style.display    = '';
    cancelBtn.style.display  = '';
    genBtn.style.display     = 'none';
    if (hint) hint.textContent = 'Drag to reorder or move activities between days';
  } else {
    editBtn.style.display    = '';
    recalcBtn.style.display  = (getCombinedOverride() || Object.keys(getActivityOverrides()).length > 0) ? '' : 'none';
    saveBtn.style.display    = 'none';
    cancelBtn.style.display  = 'none';
    genBtn.style.display     = '';
    if (hint) hint.textContent = 'Read-only — click Edit to rearrange the combined itinerary';
  }
}

// ============================================================
//  COLLABORATION SUGGESTIONS
// ============================================================

// Returns all day keys in trip order (Chiang Mai first, then Bangkok).
function getAllDayKeys() {
  const keys = [];
  for (let i = 1; i <= App.users.chiangMaiDays; i++) keys.push(`Chiang Mai|Day ${i}`);
  for (let i = 1; i <= App.users.bangkokDays;    i++) keys.push(`Bangkok|Day ${i}`);
  return keys;
}

// Move an activity from one day to another in a single user's stored itinerary.
function moveActivityInItinerary(userKey, activityId, fromDayKey, toDayKey) {
  if (fromDayKey === toDayKey) return;
  const itin = getStoredItinerary(userKey);
  if (itin[fromDayKey]) {
    itin[fromDayKey] = itin[fromDayKey].filter(id => id !== activityId);
    if (itin[fromDayKey].length === 0) delete itin[fromDayKey];
  }
  if (!itin[toDayKey]) itin[toDayKey] = [];
  if (!itin[toDayKey].includes(activityId)) itin[toDayKey].push(activityId);
  _itineraryCache[userKey] = itin;
  supabaseMoveActivity(activityId, fromDayKey, toDayKey, userKey);
}

function acceptSuggestion(activityId, day1, day2, targetDayKey) {
  if (!targetDayKey) return;
  // Write to the combined layer only — user itineraries are never modified.
  setActivityOverride(activityId, targetDayKey);
  renderCombinedView();
  updateCombinedModeUI(App.combinedEditMode);
}

function ignoreSuggestion(activityId) {
  App.ignoredConflicts.add(activityId);
  renderCombinedView();
}

function applyEditSuggestion(activityId, day1, day2, targetDayKey) {
  // Write to the combined layer only — user itineraries are never modified.
  setActivityOverride(activityId, targetDayKey);
  renderCombinedView();
  updateCombinedModeUI(App.combinedEditMode);
}

function renderCollabSuggestions() {
  const panel = document.getElementById('collab-suggestions-panel');
  if (!panel) return;

  const itin1 = getStoredItinerary('user1');
  const itin2 = getStoredItinerary('user2');
  const all   = getAllActivities();

  // Build activityId → dayKey maps for each user
  const map1 = {}, map2 = {};
  Object.entries(itin1).forEach(([dayKey, ids]) => ids.forEach(id => { map1[id] = dayKey; }));
  Object.entries(itin2).forEach(([dayKey, ids]) => ids.forEach(id => { map2[id] = dayKey; }));

  // Find conflicts, excluding ones the user has ignored or already resolved via an override.
  const resolvedByOverride = getActivityOverrides();
  const conflicts = [];
  Object.keys(map1).forEach(id => {
    if (map2[id] && map1[id] !== map2[id]
        && !App.ignoredConflicts.has(id)
        && !resolvedByOverride[id]) {
      const activity = all.find(a => a.id === id);
      if (activity) conflicts.push({ activity, day1: map1[id], day2: map2[id] });
    }
  });

  if (conflicts.length === 0) {
    panel.style.display = 'none';
    return;
  }

  const itemsHtml = conflicts.map(({ activity, day1, day2 }) => {
    const [city1, dayLabel1] = day1.split('|');
    const [city2, dayLabel2] = day2.split('|');
    const loc1 = city1 !== city2 ? `${city1} ${dayLabel1}` : dayLabel1;
    const loc2 = city1 !== city2 ? `${city2} ${dayLabel2}` : dayLabel2;

    const rec = getAlignmentSuggestion(day1, day2, itin1, itin2);
    const suggestedKey = rec ? `${city1}|${rec.suggestedDay}` : '';

    const recHtml = rec
      ? `<div class="collab-sugg-rec">
           <span class="collab-sugg-rec-label">Suggested: ${escHtml(rec.suggestedDay)}</span>
           — ${escHtml(rec.reason)}
         </div>`
      : '';

    // Day options for the edit dropdown, pre-selecting suggested day
    const dayOptions = getAllDayKeys().map(dk => {
      const [c, dl] = dk.split('|');
      const label    = c !== city1 ? `${c} ${dl}` : dl;
      const sel      = dk === suggestedKey ? ' selected' : '';
      return `<option value="${escHtml(dk)}"${sel}>${escHtml(label)}</option>`;
    }).join('');

    return `<div class="collab-sugg-card"
        data-activity-id="${escHtml(activity.id)}"
        data-day1="${escHtml(day1)}"
        data-day2="${escHtml(day2)}"
        data-suggested="${escHtml(suggestedKey)}">
      <div class="collab-sugg-card-main">
        <div class="collab-sugg-top">
          <span class="collab-sugg-name">${escHtml(activity.name)}</span>
          <span class="collab-sugg-conflict-label">Planning suggestion</span>
        </div>
        <div class="collab-sugg-days">
          <span class="collab-sugg-who">${escHtml(App.users.user1)} → ${escHtml(loc1)}</span>
          <span class="collab-sugg-sep">·</span>
          <span class="collab-sugg-who">${escHtml(App.users.user2)} → ${escHtml(loc2)}</span>
        </div>
        ${recHtml}
      </div>
      <div class="collab-sugg-actions">
        ${rec ? `<button class="sugg-btn sugg-btn-accept">Accept</button>` : ''}
        <button class="sugg-btn sugg-btn-edit">Edit</button>
        <button class="sugg-btn sugg-btn-ignore">Ignore</button>
      </div>
      <div class="collab-sugg-edit-row hidden">
        <span class="sugg-edit-label">Move both to:</span>
        <select class="sugg-day-select">${dayOptions}</select>
        <button class="sugg-btn sugg-btn-apply">Apply</button>
        <button class="sugg-btn sugg-btn-cancel">Cancel</button>
      </div>
    </div>`;
  }).join('');

  panel.style.display = '';
  panel.innerHTML = `
    <div class="collab-sugg-header">
      <span class="collab-sugg-title"><svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>Collaboration Suggestions</span>
      <span class="collab-sugg-count">${conflicts.length}</span>
    </div>
    <div class="collab-sugg-list">${itemsHtml}</div>
  `;

  // Bind interactive listeners
  panel.querySelectorAll('.collab-sugg-card').forEach(card => {
    const activityId  = card.dataset.activityId;
    const day1        = card.dataset.day1;
    const day2        = card.dataset.day2;
    const suggested   = card.dataset.suggested;
    const editRow     = card.querySelector('.collab-sugg-edit-row');

    const acceptBtn = card.querySelector('.sugg-btn-accept');
    if (acceptBtn) acceptBtn.addEventListener('click', () => acceptSuggestion(activityId, day1, day2, suggested));

    card.querySelector('.sugg-btn-ignore').addEventListener('click', () => ignoreSuggestion(activityId));

    card.querySelector('.sugg-btn-edit').addEventListener('click', () => editRow.classList.toggle('hidden'));

    card.querySelector('.sugg-btn-apply').addEventListener('click', () => {
      applyEditSuggestion(activityId, day1, day2, card.querySelector('.sugg-day-select').value);
    });

    card.querySelector('.sugg-btn-cancel').addEventListener('click', () => editRow.classList.add('hidden'));
  });
}

// Returns { suggestedDay, reason } or null for cross-city conflicts.
function getAlignmentSuggestion(day1, day2, itin1, itin2) {
  const [city1, label1] = day1.split('|');
  const [city2, label2] = day2.split('|');
  if (city1 !== city2) return null; // cross-city: no sensible recommendation

  // Count unique combined activities on each day
  const count1 = new Set([...(itin1[day1] || []), ...(itin2[day1] || [])]).size;
  const count2 = new Set([...(itin1[day2] || []), ...(itin2[day2] || [])]).size;

  const dayNum1 = parseInt(label1.replace('Day ', ''), 10);
  const dayNum2 = parseInt(label2.replace('Day ', ''), 10);

  let suggestedDay, reason;
  if (count1 < count2) {
    suggestedDay = label1;
    reason = `${label1} currently has fewer activities scheduled.`;
  } else if (count2 < count1) {
    suggestedDay = label2;
    reason = `${label2} currently has fewer activities scheduled.`;
  } else {
    suggestedDay = dayNum1 <= dayNum2 ? label1 : label2;
    reason = `Both days have the same number of activities — ${suggestedDay} is earlier in the trip.`;
  }

  return { suggestedDay, reason };
}

// ============================================================
//  FINAL PLAN
// ============================================================

function generateFinalPlan() {
  const all          = getAllActivities();
  const allKeys      = getAllDayKeys();
  const effectiveLayout = getEffectiveCombinedLayout();
  const finalPlan    = {};

  allKeys.forEach(dayKey => {
    const ids = effectiveLayout[dayKey] || [];
    if (ids.length > 0) finalPlan[dayKey] = ids;
  });

  showFinalPlan(finalPlan, all, allKeys);
}

function showFinalPlan(finalPlan, all, allKeys) {
  document.getElementById('screen-dashboard').classList.add('hidden');
  const screen = document.getElementById('screen-final-plan');
  screen.classList.remove('hidden');

  document.getElementById('final-plan-subtitle').textContent =
    `${App.users.user1} & ${App.users.user2} · ` +
    `${App.users.bangkokDays} day${App.users.bangkokDays !== 1 ? 's' : ''} Bangkok · ` +
    `${App.users.chiangMaiDays} day${App.users.chiangMaiDays !== 1 ? 's' : ''} Chiang Mai`;

  const activeDays = allKeys.filter(dk => finalPlan[dk] && finalPlan[dk].length > 0);

  if (activeDays.length === 0) {
    document.getElementById('final-plan-content').innerHTML =
      '<div class="final-empty">No activities have been planned yet.</div>';
    return;
  }

  let currentCity = null;
  const sections = activeDays.map(dayKey => {
    const [city, dayLabel] = dayKey.split('|');
    const activities = (finalPlan[dayKey] || []).map(id => all.find(a => a.id === id)).filter(Boolean);

    let cityHeader = '';
    if (city !== currentCity) {
      currentCity = city;
      const cityClass = city === 'Bangkok' ? 'final-city-bkk' : 'final-city-cnx';
      cityHeader = `<div class="final-city-header ${cityClass}">${escHtml(city)}</div>`;
    }

    const rows = activities.map(a => `
      <div class="final-activity-row">
        <span class="final-activity-name">${escHtml(a.name)}</span>
        <span class="final-activity-tags">
          <span class="type-badge ${typeBadgeClass(a.type)}">${escHtml(a.type)}</span>
          <span class="final-tag-dur">${escHtml(a.duration)}</span>
          <span class="final-tag-cost cost-badge ${costClass(a.cost)}">${escHtml(a.cost)}</span>
        </span>
      </div>`).join('');

    return `${cityHeader}
      <div class="final-day-block">
        <div class="final-day-label">${escHtml(dayLabel)}</div>
        <div class="final-day-activities">${rows}</div>
      </div>`;
  }).join('');

  document.getElementById('final-plan-content').innerHTML = sections;
}

function showPlanningMode() {
  document.getElementById('screen-final-plan').classList.add('hidden');
  document.getElementById('screen-dashboard').classList.remove('hidden');
  switchUser('combined');
}

// ============================================================
//  DAY INTELLIGENCE
// ============================================================

function durationToHours(str) { return DURATION_HOURS[str] || 1; }

function formatHours(h) {
  if (h <= 0) return '';
  const whole = Math.floor(h);
  const mins  = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole}h`;
  if (whole === 0) return `${mins}m`;
  return `${whole}h ${mins}m`;
}

function getPacingClass(hours) {
  if (hours <= 0) return 'pacing-empty';
  if (hours < 5)  return 'pacing-green';
  if (hours <= 7) return 'pacing-yellow';
  return 'pacing-red';
}

function getDayClusters(activities) {
  if (activities.length < 3) return [];
  const byArea = {};
  activities.forEach(a => {
    const area = (a.area || a.city).split('(')[0].split('/')[0].trim();
    if (!byArea[area]) byArea[area] = [];
    byArea[area].push(a.name);
  });
  if (Object.keys(byArea).length < 2) return [];
  return Object.entries(byArea).filter(([, names]) => names.length >= 2).map(([area, names]) => ({ area, names }));
}

function formatNameList(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} and ${names[2]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

function updateDayIntelligence() {
  const all = getAllActivities();
  document.querySelectorAll('.day-column').forEach(col => {
    // Skip combined columns unless we're in edit mode (edit mode re-uses this function for pacing).
    if (col.querySelector('.day-sortable-combined') && !App.combinedEditMode) return;

    const cards      = [...col.querySelectorAll('.day-sortable .activity-card')];
    const activities = cards.map(c => all.find(a => a.id === c.dataset.id)).filter(Boolean);
    const totalHours = activities.reduce((sum, a) => sum + durationToHours(a.duration), 0);

    const fill  = col.querySelector('.day-pacing-fill');
    const label = col.querySelector('.day-hours-label');
    if (fill && label) {
      fill.style.width  = Math.min((totalHours / 10) * 100, 100) + '%';
      fill.className    = 'day-pacing-fill ' + getPacingClass(totalHours);
      label.textContent = formatHours(totalHours);
    }

    const footer = col.querySelector('.day-footer');
    if (!footer) return;
    footer.innerHTML = '';

    if (activities.length === 0) { col.classList.remove('has-day-footer'); return; }

    let hasContent = false;

    if (totalHours > 7) {
      const warn = document.createElement('div');
      warn.className = 'day-warning';
      warn.innerHTML = `<span class="day-warning-icon">!</span>This day has ~${formatHours(totalHours)} of activities and may be too packed.`;
      footer.appendChild(warn);
      hasContent = true;
    }

    const clusters = getDayClusters(activities);
    if (clusters.length > 0) {
      const sugg = document.createElement('div');
      sugg.className = 'day-suggestions';
      const title = document.createElement('div');
      title.className = 'day-sugg-title';
      title.textContent = 'Optimization Suggestions';
      sugg.appendChild(title);
      clusters.forEach(({ area, names }) => {
        const item = document.createElement('div');
        item.className = 'day-sugg-item';
        item.textContent = `${formatNameList(names)} are all in ${area} — consider grouping them.`;
        sugg.appendChild(item);
      });
      footer.appendChild(sugg);
      hasContent = true;
    }

    col.classList.toggle('has-day-footer', hasContent);
  });
}

// ============================================================
//  BOOKMARKS
// ============================================================

function getBookmarks(userKey) {
  const lsKey = BOOKMARK_KEYS[userKey || App.activeUser];
  if (!lsKey) return new Set();
  const raw = localStorage.getItem(lsKey);
  return raw ? new Set(JSON.parse(raw)) : new Set();
}

function saveBookmarks(userKey, bookmarkSet) {
  const lsKey = BOOKMARK_KEYS[userKey || App.activeUser];
  if (lsKey) localStorage.setItem(lsKey, JSON.stringify([...bookmarkSet]));
}

function isBookmarked(id, userKey) {
  return getBookmarks(userKey || App.activeUser).has(id);
}

function toggleBookmark(id) {
  if (App.activeUser === 'combined') return;
  const bm = getBookmarks(App.activeUser);
  if (bm.has(id)) bm.delete(id); else bm.add(id);
  saveBookmarks(App.activeUser, bm);

  const nowBookmarked = bm.has(id);
  document.querySelectorAll(`.activity-card[data-id="${id}"] .bookmark-btn`).forEach(btn => {
    btn.classList.toggle('bookmarked', nowBookmarked);
  });

  // Re-render library to update sort order and filter state
  renderLibrary();
}

// ============================================================
//  TIME OVERRIDES
// ============================================================

function getTimeOverrides() {
  const raw = localStorage.getItem(LS_TIME_OVERRIDES);
  return raw ? JSON.parse(raw) : {};
}

function getTimeOverride(id) { return getTimeOverrides()[id] || null; }

function saveTimeOverride(id, time) {
  const overrides = getTimeOverrides();
  overrides[id] = time;
  localStorage.setItem(LS_TIME_OVERRIDES, JSON.stringify(overrides));
  document.querySelectorAll(`.activity-card[data-id="${id}"] .time-select`).forEach(sel => { sel.value = time; });
}

// ============================================================
//  PERSISTENCE
// ============================================================

function getStoredItinerary(userKey) {
  return _itineraryCache[userKey] || {};
}

function saveItinerary() {
  if (App.activeUser === 'combined') return;
  const itinerary = {};
  document.querySelectorAll('.day-sortable').forEach(col => {
    const day = col.dataset.day;
    itinerary[day] = [...col.querySelectorAll('.activity-card')].map(c => c.dataset.id);
  });
  _itineraryCache[App.activeUser] = itinerary;
  updateDayIntelligence();
}

function restoreItinerary() {
  if (App.activeUser === 'combined') return;
  const itinerary = getStoredItinerary(App.activeUser);
  const all       = getAllActivities();

  Object.entries(itinerary).forEach(([dayKey, ids]) => {
    const col = document.querySelector(`.day-sortable[data-day="${CSS.escape(dayKey)}"]`);
    if (!col) return;
    ids.forEach(id => {
      const activity = all.find(a => a.id === id);
      if (!activity) return;
      const card = createLibraryCard(activity);
      addRemoveButton(card);
      col.appendChild(card);
    });
    toggleEmptyMsg(col);
  });

  updateActivityStat();
  updateDayIntelligence();
}

// ============================================================
//  CLEAR / RESET
// ============================================================

function clearItinerary() {
  if (App.activeUser === 'combined') return;
  const name = App.users[App.activeUser];
  if (!confirm(`Remove all activities from ${name}'s itinerary?`)) return;
  document.querySelectorAll('.day-sortable').forEach(col => {
    col.querySelectorAll('.activity-card').forEach(c => c.remove());
    toggleEmptyMsg(col);
  });
  _itineraryCache[App.activeUser] = {};
  supabaseClient
    .from('itinerary_items')
    .delete()
    .eq('trip_id', getTripId())
    .eq('user', App.activeUser)
    .then(({ error }) => { if (error) console.error('Supabase clear error:', error.message); });
  updateActivityStat();
  updateDayIntelligence();
}

function resetApp() {
  if (!confirm('Start over? This will clear all profiles and itineraries.')) return;
  [LS_USERS, LS_ITINERARY_1, LS_ITINERARY_2, LS_BOOKMARKS_1, LS_BOOKMARKS_2,
   LS_TIME_OVERRIDES, LS_CUSTOM, LS_COMBINED_OVERRIDE, LS_ACTIVITY_OVERRIDES,
   'tp_user', 'tp_itinerary', 'tp_bookmarks', 'tp_prefs_1', 'tp_prefs_2'].forEach(k => localStorage.removeItem(k));
  supabaseClient
    .from('itinerary_items')
    .delete()
    .eq('trip_id', getTripId())
    .then(({ error }) => { if (error) console.error('Supabase reset error:', error.message); });
  App.users      = null;
  App.activeUser = 'user1';
  App.filters    = { city: 'all', type: 'all', cost: 'all', duration: 'all', bookmarked: false };
  showOnboarding();
}

// ============================================================
//  ADD ACTIVITY MODAL
// ============================================================

function setupAddActivityModal() {
  document.getElementById('btn-add-activity').addEventListener('click', openAddActivityModal);
  document.getElementById('modal-close').addEventListener('click', closeAddActivityModal);
  document.getElementById('modal-cancel').addEventListener('click', closeAddActivityModal);
  document.getElementById('modal-submit').addEventListener('click', handleAddActivitySubmit);
  document.getElementById('modal-add-activity').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAddActivityModal();
  });
}

function openAddActivityModal() {
  document.getElementById('modal-add-activity').classList.remove('hidden');
  document.getElementById('ca-name').focus();
}

function closeAddActivityModal() {
  document.getElementById('modal-add-activity').classList.add('hidden');
  resetAddActivityForm();
}

function handleAddActivitySubmit() {
  const nameInput = document.getElementById('ca-name');
  const cityInput = document.getElementById('ca-city');
  nameInput.classList.remove('input-error');
  cityInput.classList.remove('input-error');
  const name = nameInput.value.trim();
  const city = cityInput.value;
  let valid = true;
  if (!name) { nameInput.classList.add('input-error'); valid = false; }
  if (!city) { cityInput.classList.add('input-error'); valid = false; }
  if (!valid) return;

  const link = document.getElementById('ca-link').value.trim();
  const area = document.getElementById('ca-area').value.trim();
  saveCustomActivity({
    id: 'custom-' + Date.now(), city, area: area || city, name,
    description: document.getElementById('ca-desc').value.trim(),
    type:     document.getElementById('ca-type').value,
    cost:     document.getElementById('ca-cost').value,
    duration: document.getElementById('ca-duration').value,
    bestTime: document.getElementById('ca-time').value,
    link:     link || '#',
    custom:   true
  });
  closeAddActivityModal();
  renderLibrary();
}

function resetAddActivityForm() {
  ['ca-name', 'ca-area', 'ca-desc', 'ca-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('input-error'); }
  });
  Object.entries({ 'ca-city': '', 'ca-type': 'Cultural', 'ca-cost': '$', 'ca-duration': '1-2 hours', 'ca-time': 'Morning' })
    .forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) { el.value = val; el.classList.remove('input-error'); }
    });
}

// ============================================================
//  HELPERS
// ============================================================

function typeBadgeClass(type) {
  return { Cultural: 'badge-cultural', Food: 'badge-food', Nature: 'badge-nature',
           Shopping: 'badge-shopping', Adventure: 'badge-adventure', Wellness: 'badge-wellness',
           Nightlife: 'badge-nightlife', 'Day Trip': 'badge-day-trip' }[type] || 'badge-cultural';
}

function costClass(cost) {
  return { 'Free': 'cost-free', '$': 'cost-dollar', '$$': 'cost-dollar-dollar', '$$$': 'cost-dollar-dollar-dollar' }[cost] || 'cost-dollar';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
