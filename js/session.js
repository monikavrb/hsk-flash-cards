// The study session: which cards are queued, flipping, and grading answers.
import { shuffle } from './utils.js';
import { CARDS } from './cards.js';
import { known, review, prefs, save } from './storage.js';
import { renderAll, showSide } from './render.js';

let sess = null;
let flipped = false;
const stash = {};   // the Study session is kept while you visit Review, and vice versa

// passed to the renderer for the buttons on the finished panel
const actions = { start, setMode, includeKnown };

function build() {
  if (prefs.mode === 'review') {
    // Review tab: only the words marked "Again", from any level
    return CARDS.filter((c) => review.has(c.id));
  }
  // Study tab: words in the Review list are kept out, so they are only practised there
  return CARDS.filter((c) =>
    prefs.levels.indexOf(c.lv) > -1 && !review.has(c.id) && !(prefs.skip && known.has(c.id)));
}

function setFlipped(v, snap) {
  flipped = v;
  showSide(v, snap);
}

// The card on screen, or null when the session is finished
export function currentCard() {
  return sess && sess.queue.length ? sess.queue[0] : null;
}

export function start(list) {
  const cards = (list || build()).slice();
  if (prefs.shuffle) shuffle(cards);
  sess = { queue: cards, total: cards.length, got: 0, again: 0, missed: {} };
  setFlipped(false, true);
  renderAll(sess, actions);
}

export function setMode(m) {
  if (prefs.mode === m) return;
  stash[prefs.mode] = sess;
  prefs.mode = m;
  save();
  // Study resumes where you left off. Review is always rebuilt from the current list.
  if (m === 'study' && stash.study) {
    sess = stash.study;
    setFlipped(false, true);
    renderAll(sess, actions);
  } else {
    start();
  }
}

export function includeKnown() {
  prefs.skip = false;
  save();
  start();
}

export function flip() {
  if (currentCard()) setFlipped(!flipped, false);
}

export function grade(ok) {
  if (!currentCard()) return;
  const c = sess.queue.shift();
  if (ok) {
    known.add(c.id);
    review.delete(c.id);   // learned: leaves the Review list
    sess.got++;
  } else {
    known.delete(c.id);
    review.add(c.id);      // goes to the Review tab
    sess.again++;
    sess.missed[c.id] = c;
    // In Review the card comes back a few cards later until you get it.
    // In Study it is simply moved to the Review tab and not shown again here.
    if (prefs.mode === 'review') sess.queue.splice(Math.min(4, sess.queue.length), 0, c);
  }
  save();
  setFlipped(false, true);
  renderAll(sess, actions);
}
