// Progress and preferences, saved in localStorage.
import { TOTAL } from './cards.js';

// Do not rename: existing users' progress is stored under this key.
const KEY = 'hsk13-flashcards-v1';

export const known = new Set();
export const review = new Set();   // words marked "Again" in Study; practised in the Review tab
export const prefs = { levels: [1, 2, 3, 4, 5], dir: 'zh', skip: true, shuffle: true, mode: 'study' };

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (Array.isArray(saved.known)) saved.known.forEach((k) => known.add(k));
  if (Array.isArray(saved.review)) saved.review.forEach((k) => review.add(k));
  if (saved.mode === 'review' || saved.mode === 'study') prefs.mode = saved.mode;
  if (Array.isArray(saved.levels) && saved.levels.length) prefs.levels = saved.levels.filter((l) => TOTAL[l]);
  if (!prefs.levels.length) prefs.levels = [1, 2, 3, 4, 5];
  // v2 added HSK 4 and v3 added HSK 5: switch the new level on for returning users
  if ((saved.v || 0) < 2 && prefs.levels.indexOf(4) < 0) prefs.levels.push(4);
  if ((saved.v || 0) < 3 && prefs.levels.indexOf(5) < 0) prefs.levels.push(5);
  if (saved.dir === 'en' || saved.dir === 'zh') prefs.dir = saved.dir;
  if (typeof saved.skip === 'boolean') prefs.skip = saved.skip;
  if (typeof saved.shuffle === 'boolean') prefs.shuffle = saved.shuffle;
} catch (e) { /* storage unavailable: start fresh */ }

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: 4,
      known: Array.from(known),
      review: Array.from(review),
      mode: prefs.mode,
      levels: prefs.levels,
      dir: prefs.dir,
      skip: prefs.skip,
      shuffle: prefs.shuffle,
    }));
  } catch (e) { /* ignore */ }
}
