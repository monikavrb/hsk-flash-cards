// Small DOM and string helpers shared by the other modules.

export const $ = (id) => document.getElementById(id);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ESCAPES[c]);
}

// CJK Unified Ideographs (U+4E00 to U+9FFF)
export function isZh(ch) {
  return /[一-鿿]/.test(ch);
}

// Keeps only the Chinese characters, so speech skips punctuation such as "..."
export function hanziOnly(s) {
  return s.replace(/[^一-鿿]+/g, ' ').trim();
}

// Fisher-Yates, in place
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
