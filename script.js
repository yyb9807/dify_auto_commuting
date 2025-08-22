/**
 * Google Apps Script: commute logger webhook
 * Ensures: Asia/Shanghai timezone, one-row-per-day, robust date matching,
 * and stable +08:00 time writing.
 */

/***** CONFIG *****/
const SPREADSHEET_ID = 'PUT_YOUR_SPREADSHEET_ID_HERE'; // e.g. 1abc...xyz (from sheet URL)
const SHEET_NAME     = 'trans';                         // tab name
const TZ             = 'Asia/Shanghai';                 // Beijing time
/***** END CONFIG *****/

const HEADERS = [
  '日期', '通勤方式（上班）', '出门时间', '到达时间', '下班打卡', '到家', '通勤方式（下班）', '备注'
];

const EVENT_MAP = {
  'depart_home':   { col: '出门时间',   commuteSide: 'up'   },
  'arrive_office': { col: '到达时间',   commuteSide: 'up'   },
  'depart_office': { col: '下班打卡',   commuteSide: 'down' },
  'arrive_home':   { col: '到家',       commuteSide: 'down' }
};

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok:false, error:'empty body' });
    }

    const payload = JSON.parse(e.postData.contents || '{}');
    let dateStr = (payload.date || '').toString().trim();   // expect YYYY-MM-DD
    const event   = (payload.event || '').toString().trim();
    const timeStr = (payload.time || '').toString().trim(); // HH:mm or ISO
    const commute = (payload.commute_mode || '').toString().trim();
    const note    = (payload.note || '').toString().trim();
    const utter   = (payload.utterance || '').toString();
    const todayHint = (payload.today_ymd || '').toString();

    if (!event || !timeStr) {
      return json({ ok:false, error:'missing fields (need event, time)' });
    }
    if (!EVENT_MAP[event]) {
      return json({ ok:false, error:'unknown event: ' + event });
    }

    // Open sheet, enforce timezone
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss.getSpreadsheetTimeZone() !== TZ) ss.setSpreadsheetTimeZone(TZ);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    ensureHeaders(sheet);

    // --- Normalize dateStr ---
    // 1) If dateStr looks like "18:02" treat as time and derive from timeStr
    if (/^\d{1,2}:\d{2}$/.test(dateStr)) {
      const t = new Date(timeStr);
      if (!isNaN(t)) dateStr = Utilities.formatDate(t, TZ, 'yyyy-MM-dd');
    }
    // 2) If dateStr is ISO, convert to Beijing date
    else if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
      const d = new Date(dateStr);
      if (!isNaN(d)) dateStr = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    }
    // 3) If still not YYYY-MM-DD, try from time or todayHint
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const t = new Date(timeStr);
      if (!isNaN(t)) dateStr = Utilities.formatDate(t, TZ, 'yyyy-MM-dd');
      else if (todayHint) dateStr = todayHint;
    }
    // 4) If user wrote "今天/今早/今晚/现在", force to today
    const todayYMD = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    if (/今(天|早|晚)|现在/i.test(utter) || /today/i.test(utter)) {
      dateStr = todayYMD;
    }

    // Anchor the row for the day
    const dateOnly = toDateOnly(dateStr);
    let rowIdx = findRowByDate(sheet, dateOnly);
    if (rowIdx === -1) {
      rowIdx = sheet.getLastRow() + 1;
      sheet.appendRow([dateOnly]);
      sheet.getRange(rowIdx, 1).setNumberFormat('yyyy-mm-dd');
    }

    // Write time
    const targetColIdx = colIndexByHeader(sheet, EVENT_MAP[event].col);
    const when = parseTimeOnDate(timeStr, dateOnly);
    const timeCell = sheet.getRange(rowIdx, targetColIdx);
    timeCell.setValue(when).setNumberFormat('yyyy-mm-dd hh:mm');

    // Commute mode (AM/PM)
    if (commute) {
      const commuteColName = EVENT_MAP[event].commuteSide === 'up' ? '通勤方式（上班）' : '通勤方式（下班）';
      const commuteColIdx = colIndexByHeader(sheet, commuteColName);
      const commuteCell = sheet.getRange(rowIdx, commuteColIdx);
      const current = (commuteCell.getValue() || '').toString().trim();
      if (!current) commuteCell.setValue(commute);
      else if (current !== commute) commuteCell.setValue(current + ' / ' + commute);
    }

    // Note (append)
    if (note) {
      const noteIdx = colIndexByHeader(sheet, '备注');
      const noteCell = sheet.getRange(rowIdx, noteIdx);
      const currentNote = (noteCell.getValue() || '').toString().trim();
      noteCell.setValue(currentNote ? (currentNote + ' | ' + note) : note);
    }

    return json({
      ok: true,
      row: rowIdx,
      a1: timeCell.getA1Notation(),
      sheetName: SHEET_NAME,
      spreadsheetUrl: ss.getUrl(),
      received: { date: dateStr, event, time: timeStr, commute_mode: commute, note, utterance: utter }
    });

  } catch (err) {
    return json({ ok:false, error: String(err) });
  }
}

/******** Helpers ********/
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(sheet) {
  const needCols = HEADERS.length;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1,1,1,needCols).setFontWeight('bold');
    return;
  }
  const current = sheet.getRange(1,1,1,needCols).getValues()[0] || [];
  const same = HEADERS.every((h,i) => (current[i]||'').toString().trim() === h);
  if (!same) sheet.getRange(1,1,1,needCols).setValues([HEADERS]);
}

function colIndexByHeader(sheet, headerName) {
  const headers = sheet.getRange(1,1,1,HEADERS.length).getValues()[0];
  for (let i=0;i<headers.length;i++){
    if ((headers[i]||'').toString().trim() === headerName) return i+1;
  }
  throw new Error('Header not found: ' + headerName);
}

// Robust matching for date column (A), regardless of formats
function findRowByDate(sheet, dateOnly) {
  const last = sheet.getLastRow();
  if (last < 2) return -1;

  const rng = sheet.getRange(2, 1, last - 1, 1);
  const values = rng.getValues();
  const target = Utilities.formatDate(dateOnly, TZ, 'yyyy-MM-dd');

  for (let i = 0; i < values.length; i++) {
    const cell = values[i][0];
    if (cell instanceof Date) {
      const ymd = Utilities.formatDate(cell, TZ, 'yyyy-MM-dd');
      if (ymd === target) return i + 2;
      continue;
    }
    const str = (cell || '').toString().trim();
    if (!str) continue;
    const norm10 = str.replace(/\//g, '-').slice(0,10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(norm10) && norm10 === target) return i + 2;
    const m = str.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (m) {
      const ymd2 = `${m[1]}-${m[2]}-${m[3]}`;
      if (ymd2 === target) return i + 2;
    }
  }
  return -1;
}

// Normalize date-only for column A
function toDateOnly(input) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const d = new Date(input + 'T00:00:00+08:00');
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const d = new Date(input);
  if (isNaN(d)) throw new Error('Bad date: ' + input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Force write times as +08:00 (Beijing)
function parseTimeOnDate(timeStr, dateOnly) {
  const ymd = Utilities.formatDate(dateOnly, TZ, 'yyyy-MM-dd'); // target date in Beijing

  // HH:mm -> ISO +08:00
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return new Date(`${ymd}T${timeStr}:00+08:00`);
  }

  // ISO (with/without tz)
  const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?$/;
  if (isoLike.test(timeStr)) {
    const d0 = /[+-]\d{2}:\d{2}|Z$/.test(timeStr) ? new Date(timeStr) : new Date(`${timeStr}+08:00`);
    if (isNaN(d0)) throw new Error('Bad time: ' + timeStr);
    const y = Utilities.formatDate(d0, TZ, 'yyyy-MM-dd');
    const hm = Utilities.formatDate(d0, TZ, 'HH:mm');
    return new Date(`${y}T${hm}:00+08:00`);
  }

  // Fallback
  const d1 = new Date(timeStr);
  if (isNaN(d1)) throw new Error('Bad time: ' + timeStr);
  const y = Utilities.formatDate(d1, TZ, 'yyyy-MM-dd');
  const hm = Utilities.formatDate(d1, TZ, 'HH:mm');
  return new Date(`${y}T${hm}:00+08:00`);
}
