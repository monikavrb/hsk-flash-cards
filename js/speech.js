// Text-to-speech using the browser's Chinese voice, when one is installed.

export let canSpeak = false;
try { canSpeak = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function'; } catch (e) { canSpeak = false; }

export function say(text, rate) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = rate;
    speechSynthesis.speak(u);
  } catch (e) { /* speech not available */ }
}
