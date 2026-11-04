// Parses the word lists in /data into card objects.
import hsk1 from '../data/hsk1.js';
import hsk2 from '../data/hsk2.js';
import hsk3 from '../data/hsk3.js';
import hsk4 from '../data/hsk4.js';
import hsk5 from '../data/hsk5.js';

export const LEVELS = [1, 2, 3, 4, 5];
const RAW = { 1: hsk1, 2: hsk2, 3: hsk3, 4: hsk4, 5: hsk5 };

export const CARDS = [];
export const TOTAL = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

LEVELS.forEach((lv) => {
  RAW[lv].split('\n').forEach((line) => {
    const p = line.split('|');
    if (p.length < 3) return;
    CARDS.push({
      id: p[0].trim() + '|' + p[1].trim(),   // saved progress is keyed on this
      hz: p[0].trim(),
      py: p[1].trim(),
      en: p[2].trim(),
      zh: (p[3] || '').trim(),
      spy: (p[4] || '').trim(),
      sen: (p[5] || '').trim(),
      lv,
    });
    TOTAL[lv]++;
  });
});
