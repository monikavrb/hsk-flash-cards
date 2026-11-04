// Entry point: wires the page controls to the session, then starts the first session.
import { $, hanziOnly } from './utils.js';
import { known, review, prefs, save } from './storage.js';
import { canSpeak, say } from './speech.js';
import { createChips } from './render.js';
import { start, setMode, flip, grade, currentCard } from './session.js';

// ---------- level chips ----------
createChips((lv) => {
  const i = prefs.levels.indexOf(lv);
  if (i > -1) { if (prefs.levels.length > 1) prefs.levels.splice(i, 1); }   // keep at least one level
  else prefs.levels.push(lv);
  prefs.levels.sort();
  save();
  start();
});

// ---------- speech ----------
if (canSpeak) $('speak').hidden = false; else document.body.classList.add('nospeech');

$('speak').addEventListener('click', () => {
  const c = currentCard();
  if (c) say(hanziOnly(c.hz), 0.85);
});
// sentence audio: capture so tapping it doesn't flip the card
$('card').addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('.say');
  if (!b) return;
  e.stopPropagation();
  const c = currentCard();
  if (c && c.zh) say(c.zh, 0.8);
}, true);

// ---------- card and options ----------
$('card').addEventListener('click', flip);
$('again').addEventListener('click', () => grade(false));
$('got').addEventListener('click', () => grade(true));
$('dirZh').addEventListener('click', () => { prefs.dir = 'zh'; save(); start(); });
$('dirEn').addEventListener('click', () => { prefs.dir = 'en'; save(); start(); });
$('skip').addEventListener('change', (e) => { prefs.skip = e.target.checked; save(); start(); });
$('shuf').addEventListener('change', (e) => { prefs.shuffle = e.target.checked; save(); start(); });

$('tabStudy').addEventListener('click', () => setMode('study'));
$('tabReview').addEventListener('click', () => setMode('review'));

// ---------- reset (asks for a second tap) ----------
let resetTimer = null;
$('reset').addEventListener('click', () => {
  const b = $('reset');
  if (!resetTimer) {
    b.textContent = 'Tap again to clear all progress';
    resetTimer = setTimeout(() => { resetTimer = null; b.textContent = 'Reset progress'; }, 4000);
    return;
  }
  clearTimeout(resetTimer);
  resetTimer = null;
  b.textContent = 'Reset progress';
  known.clear();
  review.clear();
  save();
  start();
});

// ---------- keyboard ----------
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  const onCard = t && t.id === 'card';
  if (t && t !== document.body && !onCard && t.closest && t.closest('button, input, select, textarea')) return;
  if (e.key === ' ' || (e.key === 'Enter' && onCard)) { e.preventDefault(); flip(); }
  else if (e.key === '1') grade(false);
  else if (e.key === '2') grade(true);
});

start();
