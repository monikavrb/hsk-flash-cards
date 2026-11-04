// Everything that writes to the DOM. Functions receive the session and actions they need,
// so this module does not import session.js (no circular dependency).
import { $, esc, isZh } from './utils.js';
import { pinyinHTML } from './pinyin.js';
import { CARDS, TOTAL, LEVELS } from './cards.js';
import { known, review, prefs } from './storage.js';

// ---------- card content ----------
const SAYBTN = '<button type="button" class="say" aria-label="Play sentence"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg></button>';

// example sentence with the study word highlighted ("..." words highlight each part)
function hiSentence(zh, hz) {
  const parts = hz.split('...').filter(Boolean), marks = [];
  let from = 0;
  parts.forEach((p) => {
    const i = zh.indexOf(p, from);
    if (i > -1) { marks.push([i, i + p.length]); from = i + p.length; }
  });
  let out = '', last = 0;
  marks.forEach((m) => {
    out += esc(zh.slice(last, m[0])) + '<mark>' + esc(zh.slice(m[0], m[1])) + '</mark>';
    last = m[1];
  });
  return out + esc(zh.slice(last));
}

function exFront(c) {
  return c.zh ? '<div class="ex">' + hiSentence(c.zh, c.hz) + SAYBTN + '</div>' : '';
}

function exBack(c) {
  if (!c.zh) return '';
  return '<div class="exbox"><div class="ex">' + hiSentence(c.zh, c.hz) + SAYBTN + '</div>' +
    (c.spy ? '<div class="expy">' + pinyinHTML(c.spy) + '</div>' : '') +
    (c.sen ? '<div class="exen">' + esc(c.sen) + '</div>' : '') + '</div>';
}

// 田字格 practice cells, sized by the number of characters
function cellsHTML(hz) {
  const chars = Array.from(hz.replace(/\.\.\./g, '…'));
  const n = chars.filter(isZh).length;
  const hasSep = chars.some((c) => !isZh(c) && c.trim());
  let px = n <= 1 ? 132 : n === 2 ? 112 : n === 3 ? 88 : (hasSep ? 52 : 62);
  if (n > 4) px = 48;
  let h = '<div class="cells" style="--cell:' + px + 'px">';
  chars.forEach((ch) => {
    if (isZh(ch)) h += '<span class="cell"><span class="g">' + ch + '</span></span>';
    else if (ch.trim()) h += '<span class="sep">' + esc(ch) + '</span>';
  });
  return h + '</div>';
}

function renderCard(c) {
  const tag = '<div class="tag">HSK ' + c.lv + '</div>';
  const hint = '<div class="hint">Tap to reveal</div>';
  if (prefs.dir === 'zh') {
    $('front').innerHTML = tag + cellsHTML(c.hz) + exFront(c) + hint;
    $('back').innerHTML = tag + '<div class="zh-sm">' + esc(c.hz.replace(/\.\.\./g, '…')) + '</div><div class="py">' + pinyinHTML(c.py) + '</div><div class="mean">' + esc(c.en) + '</div>' + exBack(c);
  } else {
    $('front').innerHTML = tag + '<div class="mean big">' + esc(c.en) + '</div>' + hint;
    $('back').innerHTML = tag + cellsHTML(c.hz) + '<div class="py">' + pinyinHTML(c.py) + '</div>' + exBack(c);
  }
}

// snap: switch sides instantly, without the flip animation
export function showSide(flipped, snap) {
  const card = $('card');
  if (snap) card.classList.add('snap');
  card.classList.toggle('flipped', flipped);
  $('front').setAttribute('aria-hidden', flipped ? 'true' : 'false');
  $('back').setAttribute('aria-hidden', flipped ? 'false' : 'true');
  if (snap) { void card.offsetWidth; card.classList.remove('snap'); }
}

// ---------- level chips ----------
const chipEls = {};

export function createChips(onToggle) {
  const levelsEl = $('levels');
  LEVELS.forEach((lv) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.innerHTML = '<b>HSK ' + lv + '</b><small></small><span class="bar"><i></i></span>';
    b.addEventListener('click', () => onToggle(lv));
    levelsEl.appendChild(b);
    chipEls[lv] = b;
  });
}

function renderChips() {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  CARDS.forEach((c) => { if (known.has(c.id)) counts[c.lv]++; });
  LEVELS.forEach((lv) => {
    const b = chipEls[lv];
    b.setAttribute('aria-pressed', prefs.levels.indexOf(lv) > -1 ? 'true' : 'false');
    b.querySelector('small').textContent = counts[lv] + ' / ' + TOTAL[lv] + ' known';
    b.querySelector('i').style.width = (TOTAL[lv] ? counts[lv] / TOTAL[lv] * 100 : 0) + '%';
  });
}

// ---------- finished panel ----------
function doneButton(label, cls, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn ' + cls;
  b.textContent = label;
  b.addEventListener('click', fn);
  return b;
}

// actions: { start, setMode, includeKnown } from session.js
function renderDone(sess, actions) {
  const d = $('done');
  d.innerHTML = '';
  const h = document.createElement('h2');
  const p = document.createElement('p');
  const row = document.createElement('div');
  row.className = 'row';
  if (prefs.mode === 'review') {
    if (sess.total === 0) {
      h.textContent = 'Nothing to review';
      p.textContent = 'Words you mark "Again" in Study are collected here. Right now the list is empty.';
    } else {
      h.textContent = 'Review complete';
      p.textContent = 'All ' + sess.total + (sess.total === 1 ? ' word' : ' words') + ' from your Review list are cleared.';
    }
    row.appendChild(doneButton('Back to Study', 'solid', () => actions.setMode('study')));
  } else if (sess.total === 0) {
    h.textContent = 'Nothing left to practice here';
    p.textContent = 'Every word in the selected levels is marked as known' + (review.size ? ' or waiting in your Review tab.' : '.');
    if (review.size) row.appendChild(doneButton('Go to Review (' + review.size + ')', 'solid', () => actions.setMode('review')));
    row.appendChild(doneButton('Include known words', review.size ? '' : 'solid', () => actions.includeKnown()));
  } else {
    const missed = Object.keys(sess.missed).length;
    h.textContent = 'Session complete';
    p.textContent = sess.total + (sess.total === 1 ? ' word' : ' words') + ' studied, ' + (missed ? missed + ' moved to your Review tab.' : 'none needed another look.');
    if (missed) row.appendChild(doneButton('Go to Review (' + review.size + ')', 'solid', () => actions.setMode('review')));
    row.appendChild(doneButton('Study again', missed ? '' : 'solid', () => actions.start()));
  }
  d.appendChild(h); d.appendChild(p); d.appendChild(row);
}

// ---------- whole page ----------
export function renderAll(sess, actions) {
  renderChips();
  const inReview = prefs.mode === 'review';
  $('tabStudy').setAttribute('aria-selected', inReview ? 'false' : 'true');
  $('tabReview').setAttribute('aria-selected', inReview ? 'true' : 'false');
  $('revCount').textContent = review.size;
  $('revCount').hidden = review.size === 0;
  $('levels').hidden = inReview;
  $('skipWrap').hidden = inReview;
  $('sub').textContent = inReview
    ? 'Review: only the words you marked "Again". Get one right to clear it from this list.'
    : CARDS.length + ' words from the HSK 2.0 lists. Progress is saved in this browser.';
  $('dirZh').setAttribute('aria-pressed', prefs.dir === 'zh' ? 'true' : 'false');
  $('dirEn').setAttribute('aria-pressed', prefs.dir === 'en' ? 'true' : 'false');
  $('skip').checked = prefs.skip;
  $('shuf').checked = prefs.shuffle;
  $('nLeft').textContent = sess.queue.length;
  $('nGot').textContent = sess.got;
  $('nAgain').textContent = sess.again;
  $('prog').style.width = (sess.total ? sess.got / sess.total * 100 : 0) + '%';
  const live = sess.queue.length > 0;
  $('stage').hidden = !live;
  $('actions').hidden = !live;
  $('done').hidden = live;
  if (live) renderCard(sess.queue[0]); else renderDone(sess, actions);
}
