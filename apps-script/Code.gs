/**
 * ICATS-FHM 2026 — poster vote backend.
 * Bound to a Google Sheet. Deploy as: Web app, "Execute as: Me",
 * "Who has access: ANYONE" (not "Anyone with a Google Account" — that one
 * bounces the browser to a sign-in page and every ballot fails with a CORS
 * error before it ever reaches this script).
 *
 * Verify a deployment by opening the /exec URL in a private window. You must
 * see JSON. If you see a Google sign-in page, the access setting is wrong.
 *
 * Voters identify themselves by typing their name as printed on their
 * conference ID card. Ballots are recorded as given and not checked against a
 * roster, so tally() flags duplicate names for you.
 *
 * Sheets used (created on demand):
 *   Votes    timestamp | name | first | second | third
 *   Results  written by tally()
 */

var POSTER_COUNT = 54;   // must match data/posters.json
var AWARDS = 8;
var MAX_PER_GROUP = 2;   // cap on awards per research group; 0 disables

var VOTES_HEADER = ['timestamp', 'name', 'first', 'second', 'third'];
var RESULTS_HEADER = ['rank', 'poster', 'points', 'firsts', 'seconds', 'thirds'];

// ---------------------------------------------------------------- setup

function setup() {
  votesSheet_();
  sheet_('Results', RESULTS_HEADER);
  SpreadsheetApp.getUi().alert('Sheets ready. Deploy the web app to start collecting ballots.');
}

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(name) || ss.insertSheet(name);
  if (s.getLastRow() === 0) s.appendRow(header);
  return s;
}

/** Created on demand so a forgotten setup() never silently drops a ballot. */
function votesSheet_() {
  return sheet_('Votes', VOTES_HEADER);
}

// ---------------------------------------------------------------- web app

/** Health check. Open the /exec URL in a browser: this JSON means it is live. */
function doGet() {
  var out = { ok: true, service: 'icats-poster-vote', posters: POSTER_COUNT };
  try {
    out.ballots = Math.max(votesSheet_().getLastRow() - 1, 0);
  } catch (err) {
    out.ok = false;
    out.error = 'Script is not bound to a spreadsheet: ' + err;
  }
  return json_(out);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'Server busy. Try again in a moment.' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'Empty request.' });
    }

    var body = JSON.parse(e.postData.contents);
    var name = String(body.name || '').trim().replace(/\s+/g, ' ');
    var picks = body.picks || [];

    if (name.length < 3) {
      return json_({ ok: false, error: 'Enter your name exactly as printed on your conference ID card.' });
    }
    if (picks.length !== 3) return json_({ ok: false, error: 'Choose exactly three posters.' });

    // Accept "P07", "07" or 7 from the client; store the bare number.
    var nums = [];
    for (var i = 0; i < 3; i++) {
      var raw = String(picks[i]).trim().toUpperCase().replace(/^P/, '');
      if (!/^\d{1,2}$/.test(raw)) return json_({ ok: false, error: 'Unknown poster number.' });
      var n = parseInt(raw, 10);
      if (!(n >= 1 && n <= POSTER_COUNT)) return json_({ ok: false, error: 'Unknown poster number.' });
      nums.push(n);
    }
    if (nums[0] === nums[1] || nums[1] === nums[2] || nums[0] === nums[2]) {
      return json_({ ok: false, error: 'Pick three different posters.' });
    }

    votesSheet_().appendRow([new Date(), name, nums[0], nums[1], nums[2]]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'Could not record the ballot. Please try again. (' + err + ')' });
  } finally {
    lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------- tally

/** 3 points for a 1st choice, 2 for a 2nd, 1 for a 3rd. Ties break on firsts, then seconds. */
function tally() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var votes = votesSheet_();
  var last = votes.getLastRow();
  if (last < 2) { SpreadsheetApp.getUi().alert('No ballots yet.'); return; }

  // Names are self-reported and unenforced, so flag anyone who voted more than once.
  var names = votes.getRange(2, 2, last - 1, 1).getValues();
  var seenNames = {}, repeats = [];
  names.forEach(function (n) {
    var key = String(n[0]).trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) return;
    seenNames[key] = (seenNames[key] || 0) + 1;
    if (seenNames[key] === 2) repeats.push(String(n[0]).trim());
  });

  var rows = votes.getRange(2, 3, last - 1, 3).getValues();
  var score = {};
  rows.forEach(function (v) {
    [3, 2, 1].forEach(function (pts, i) {
      // Tolerate legacy "P07" rows alongside plain numbers.
      var id = parseInt(String(v[i]).trim().toUpperCase().replace(/^P/, ''), 10);
      if (!id) return;
      score[id] = score[id] || { pts: 0, f: 0, s: 0, t: 0 };
      score[id].pts += pts;
      score[id][['f', 's', 't'][i]]++;
    });
  });

  var ranked = Object.keys(score).map(function (id) {
    return [Number(id), score[id].pts, score[id].f, score[id].s, score[id].t];
  }).sort(function (a, b) {
    return (b[1] - a[1]) || (b[2] - a[2]) || (b[3] - a[3]);
  });

  var out = ranked.map(function (r, i) { return [i + 1, r[0], r[1], r[2], r[3], r[4]]; });
  var sh = sheet_('Results', RESULTS_HEADER);
  sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 6).clearContent();
  sh.getRange(2, 1, out.length, 6).setValues(out);

  SpreadsheetApp.getUi().alert(
    rows.length + ' ballots counted.\nTop ' + AWARDS + ': ' +
    ranked.slice(0, AWARDS).map(function (r) { return r[0]; }).join(', ') +
    (repeats.length
      ? '\n\nWARNING: these names appear on more than one ballot, and all of ' +
        'their ballots were counted — remove the extras in Votes and tally again:\n' +
        repeats.join(', ')
      : '\n\nNo duplicate voter names found.') +
    '\n\nCheck the group cap (max ' + MAX_PER_GROUP + ' per research group) before announcing.'
  );
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Poster vote')
    .addItem('Set up sheets', 'setup')
    .addItem('Tally results', 'tally')
    .addToUi();
}
