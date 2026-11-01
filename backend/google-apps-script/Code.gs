/**
 * RSVP backend for the Yi & Kyaw wedding site.
 * Stores responses in the bound Google Sheet and returns live totals.
 *
 *   GET  ?action=stats  -> { guests, households, declined }
 *   POST {name, phone, attending, guests, message, dietary}
 *        -> { ok: true, stats } | { ok: false, error }
 *
 * Setup: see README.md in this folder.
 */

var SHEET_NAME = 'RSVPs';
var HEADERS = ['Timestamp', 'Name', 'Phone', 'Attending', 'Guests', 'Message', 'Dietary'];
var MAX_GUESTS = 6;

function doGet(e) {
  return json_(computeStats_());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var entry = validate_(body);
    sheet_().appendRow([
      new Date(),
      entry.name,
      // Leading apostrophe stops Sheets from mangling phone numbers like 09...
      entry.phone ? "'" + entry.phone : '',
      entry.attending ? 'Yes' : 'No',
      entry.guests,
      entry.message,
      entry.dietary,
    ]);
    SpreadsheetApp.flush();
    return json_({ ok: true, stats: computeStats_() });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function validate_(b) {
  var name = String(b.name || '').trim().slice(0, 80);
  if (name.length < 2) throw new Error('Please enter your name.');
  var attending = b.attending === true;
  var guests = attending ? Math.floor(Number(b.guests)) : 0;
  if (attending && !(guests >= 1 && guests <= MAX_GUESTS)) throw new Error('Invalid party size.');
  return {
    name: sanitize_(name),
    phone: String(b.phone || '').replace(/[^\d+\s-]/g, '').slice(0, 20),
    attending: attending,
    guests: guests,
    message: sanitize_(String(b.message || '').slice(0, 500)),
    dietary: attending ? sanitize_(String(b.dietary || '').slice(0, 120)) : '',
  };
}

/** Prevents spreadsheet formula injection (values starting with = + - @). */
function sanitize_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function computeStats_() {
  var rows = sheet_().getDataRange().getValues().slice(1);
  var stats = { guests: 0, households: 0, declined: 0 };
  rows.forEach(function (r) {
    if (r[3] === 'Yes') {
      stats.guests += Number(r[4]) || 0;
      stats.households += 1;
    } else if (r[3] === 'No') {
      stats.declined += 1;
    }
  });
  return stats;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
