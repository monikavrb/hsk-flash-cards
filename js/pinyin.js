// Splits pinyin into syllables and wraps each one in a tone-colour span (.t1 to .t5).
import { esc } from './utils.js';

const V = 'aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜ';
const SYL = new RegExp('(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[' + V + ']+(?:ng(?![' + V + '])|nr(?![' + V + '])|n(?![' + V + '])|r(?![' + V + ']))?', 'gi');

// Tone from the combining diacritic left after NFD normalisation
function tone(s) {
  const d = s.normalize('NFD');
  if (/̄/.test(d)) return 1;   // macron  ā
  if (/́/.test(d)) return 2;   // acute   á
  if (/̌/.test(d)) return 3;   // caron   ǎ
  if (/̀/.test(d)) return 4;   // grave   à
  return 5;                         // neutral
}

export function pinyinHTML(py) {
  let out = '', last = 0, m;
  SYL.lastIndex = 0;
  while ((m = SYL.exec(py))) {
    out += esc(py.slice(last, m.index)) + '<span class="t' + tone(m[0]) + '">' + esc(m[0]) + '</span>';
    last = m.index + m[0].length;
  }
  return out + esc(py.slice(last));
}
