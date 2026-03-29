/* ===================================================
   SafePass SA — script.js
   Every section is commented so you can learn as you read!
   =================================================== */


/* ─────────────────────────────────────────────────────────
   SECTION 1: GRAB ELEMENTS FROM THE PAGE
   document.getElementById() finds an HTML element by its id=""
   We store them in variables so we don't have to search every time
   ───────────────────────────────────────────────────────── */

// Checker elements
const passwordInput = document.getElementById('passwordInput');
const showBtn       = document.getElementById('showBtn');
const charCount     = document.getElementById('charCount');
const meterFill     = document.getElementById('meterFill');
const strengthLabel = document.getElementById('strengthLabel');
const feedbackList  = document.getElementById('feedbackList');

// Generator elements
const lengthSlider  = document.getElementById('lengthSlider');
const lengthVal     = document.getElementById('lengthVal');
const optUpper      = document.getElementById('optUpper');
const optLower      = document.getElementById('optLower');
const optNumbers    = document.getElementById('optNumbers');
const optSymbols    = document.getElementById('optSymbols');
const generateBtn   = document.getElementById('generateBtn');
const outputBox     = document.getElementById('outputBox');
const generatedPw   = document.getElementById('generatedPw');
const copyBtn       = document.getElementById('copyBtn');
const copyFeedback  = document.getElementById('copyFeedback');
const historyWrap   = document.getElementById('historyWrap');
const historyList   = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');


/* ─────────────────────────────────────────────────────────
   SECTION 2: CHARACTER SETS USED FOR GENERATING PASSWORDS
   These are just strings — Math.random() picks letters from them
   ───────────────────────────────────────────────────────── */
const CHARS_UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_LOWER   = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_NUMBERS = '0123456789';
const CHARS_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

// Common / weak passwords to flag (South African & global)
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'letmein', 'iloveyou', 'admin', 'welcome', 'monkey',
  'eskom123', 'southafrica', 'capetown', 'joburg', 'pretoria',
  'absa1234', 'fnb12345', 'capitec', 'nedbank', 'standardbank'
];


/* ─────────────────────────────────────────────────────────
   SECTION 3: THEME TOGGLE (dark ↔ light)
   We add/remove the "light" class on <body>
   CSS variables switch automatically when that class is present
   ───────────────────────────────────────────────────────── */
themeToggle.addEventListener('click', function () {
  document.body.classList.toggle('light');

  // Change the icon to match the current mode
  const isLight = document.body.classList.contains('light');
  themeIcon.textContent = isLight ? '🌙' : '☀️';

  // Remember the user's preference so it persists after refresh
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// Apply saved theme on page load
(function applySavedTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    themeIcon.textContent = '🌙';
  }
})();


/* ─────────────────────────────────────────────────────────
   SECTION 4: SHOW / HIDE PASSWORD
   Toggle the input type between "password" and "text"
   ───────────────────────────────────────────────────────── */
showBtn.addEventListener('click', function () {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  showBtn.textContent = isHidden ? '🙈' : '👁️';
});


/* ─────────────────────────────────────────────────────────
   SECTION 5: REAL-TIME PASSWORD STRENGTH CHECKER
   This runs every time the user types a character ('input' event)
   ───────────────────────────────────────────────────────── */
passwordInput.addEventListener('input', function () {
  const pw = passwordInput.value;   // the current password text

  // Update character count
  charCount.textContent = pw.length + ' chars';

  // If the field is empty, reset everything and stop
  if (pw.length === 0) {
    resetMeter();
    return;
  }

  // Run the strength check
  const result = analysePassword(pw);
  updateMeter(result.score, result.label, result.color);
  updateFeedback(result.tips);
});


/* ─────────────────────────────────────────────────────────
   SECTION 6: ANALYSE PASSWORD — the core logic
   Returns: { score (0–100), label, color, tips[] }
   ───────────────────────────────────────────────────────── */
function analysePassword(pw) {
  let score = 0;
  const tips = [];

  // --- Length checks ---
  if (pw.length >= 8)  score += 10;
  if (pw.length >= 12) score += 10;
  if (pw.length >= 16) score += 10;

  if (pw.length < 8) {
    tips.push({ type: 'bad',  text: 'Make it at least 8 characters long' });
  } else if (pw.length < 12) {
    tips.push({ type: 'warn', text: 'Aim for 12+ characters for better security' });
  } else {
    tips.push({ type: 'good', text: 'Good length (' + pw.length + ' characters)' });
  }

  // --- Character variety checks ---
  const hasUpper   = /[A-Z]/.test(pw);
  const hasLower   = /[a-z]/.test(pw);
  const hasNumbers = /[0-9]/.test(pw);
  const hasSymbols = /[^A-Za-z0-9]/.test(pw);

  if (hasUpper)   { score += 15; tips.push({ type: 'good', text: 'Contains uppercase letters ✓' }); }
  else              tips.push({ type: 'bad',  text: 'Add uppercase letters (A, B, C…)' });

  if (hasLower)   { score += 10; }
  else              tips.push({ type: 'bad',  text: 'Add lowercase letters (a, b, c…)' });

  if (hasNumbers) { score += 15; tips.push({ type: 'good', text: 'Contains numbers ✓' }); }
  else              tips.push({ type: 'bad',  text: 'Add numbers (1, 2, 3…)' });

  if (hasSymbols) { score += 20; tips.push({ type: 'good', text: 'Contains symbols — very strong ✓' }); }
  else              tips.push({ type: 'warn', text: 'Adding symbols (!@#$) makes it much stronger' });

  // --- Common password check ---
  const isCommon = COMMON_PASSWORDS.some(function (common) {
    return pw.toLowerCase().includes(common);
  });
  if (isCommon) {
    score = Math.max(score - 30, 5);   // heavy penalty
    tips.push({ type: 'bad', text: 'Avoid common words (e.g. "eskom", "password", bank names)' });
  }

  // --- Repeated characters check (e.g. "aaaa1111") ---
  const hasRepeats = /(.)\1{2,}/.test(pw);
  if (hasRepeats) {
    score = Math.max(score - 15, 5);
    tips.push({ type: 'bad', text: 'Avoid repeating characters (aaa, 111…)' });
  }

  // --- Sequential characters (e.g. "abcd", "1234") ---
  if (/abcd|bcde|cdef|1234|2345|3456|4567|5678|6789/.test(pw.toLowerCase())) {
    score = Math.max(score - 10, 5);
    tips.push({ type: 'warn', text: 'Avoid sequential patterns (abcd, 1234…)' });
  }

  // Clamp score between 0 and 100
  score = Math.min(Math.max(score, 0), 100);

  // Determine label and colour
  let label, color;
  if      (score < 35) { label = 'Weak';      color = '#ef4444'; }
  else if (score < 65) { label = 'Moderate';  color = '#f59e0b'; }
  else if (score < 85) { label = 'Strong';    color = '#22c55e'; }
  else                 { label = 'Very Strong'; color = '#16a34a'; }

  return { score, label, color, tips };
}


/* ─────────────────────────────────────────────────────────
   SECTION 7: UPDATE THE METER BAR AND LABEL
   ───────────────────────────────────────────────────────── */
function updateMeter(score, label, color) {
  meterFill.style.width      = score + '%';
  meterFill.style.background = color;
  strengthLabel.textContent  = label;
  strengthLabel.style.color  = color;
}

function resetMeter() {
  meterFill.style.width      = '0%';
  strengthLabel.textContent  = '—';
  strengthLabel.style.color  = 'var(--text-muted)';
  feedbackList.innerHTML     = '<li class="tip-placeholder">Start typing to see feedback…</li>';
  charCount.textContent      = '0 chars';
}


/* ─────────────────────────────────────────────────────────
   SECTION 8: UPDATE THE FEEDBACK LIST
   We build HTML list items from the tips array
   ───────────────────────────────────────────────────────── */
function updateFeedback(tips) {
  // Clear the old list
  feedbackList.innerHTML = '';

  // Map tip type to icon and CSS class
  const iconMap  = { good: '✅', bad: '❌', warn: '⚠️' };
  const classMap = { good: 'tip-good', bad: 'tip-bad', warn: 'tip-warn' };

  tips.forEach(function (tip) {
    const li = document.createElement('li');
    li.className = classMap[tip.type] || '';
    li.textContent = iconMap[tip.type] + ' ' + tip.text;
    feedbackList.appendChild(li);
  });
}


/* ─────────────────────────────────────────────────────────
   SECTION 9: SLIDER — update the displayed length number
   ───────────────────────────────────────────────────────── */
lengthSlider.addEventListener('input', function () {
  lengthVal.textContent = lengthSlider.value;
});


/* ─────────────────────────────────────────────────────────
   SECTION 10: GENERATE A RANDOM PASSWORD
   Builds a pool of characters from the checked options,
   then picks random characters from that pool
   ───────────────────────────────────────────────────────── */
generateBtn.addEventListener('click', function () {
  // Build the character pool based on checked boxes
  let pool = '';
  if (optUpper.checked)   pool += CHARS_UPPER;
  if (optLower.checked)   pool += CHARS_LOWER;
  if (optNumbers.checked) pool += CHARS_NUMBERS;
  if (optSymbols.checked) pool += CHARS_SYMBOLS;

  // If nothing is checked, default to all letters + numbers
  if (pool === '') {
    pool = CHARS_UPPER + CHARS_LOWER + CHARS_NUMBERS;
    // Re-check the boxes to show the user what's being used
    optUpper.checked   = true;
    optLower.checked   = true;
    optNumbers.checked = true;
  }

  const length = parseInt(lengthSlider.value, 10);   // get slider value as a number

  // Pick random characters from the pool
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    password += pool[randomIndex];
  }

  // Show the result
  generatedPw.textContent = password;
  outputBox.style.display = 'flex';
  copyFeedback.textContent = '';

  // Save to history
  saveToHistory(password);
});


/* ─────────────────────────────────────────────────────────
   SECTION 11: COPY TO CLIPBOARD
   navigator.clipboard is a modern browser API for copying text
   ───────────────────────────────────────────────────────── */
copyBtn.addEventListener('click', function () {
  const pw = generatedPw.textContent;
  if (!pw) return;

  navigator.clipboard.writeText(pw)
    .then(function () {
      // Success!
      copyFeedback.textContent = '✅ Copied to clipboard!';
      copyBtn.textContent = '✅ Copied';

      // Reset button text after 2 seconds
      setTimeout(function () {
        copyFeedback.textContent = '';
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    })
    .catch(function () {
      // Fallback if clipboard API is blocked (rare)
      copyFeedback.textContent = '⚠️ Copy failed — select the text manually';
    });
});


/* ─────────────────────────────────────────────────────────
   SECTION 12: PASSWORD HISTORY (uses localStorage)
   localStorage is a simple key-value store in the browser.
   Data persists even after you close and reopen the tab.
   ───────────────────────────────────────────────────────── */
function saveToHistory(password) {
  // Read existing history (stored as JSON string) or start with empty array
  let history = JSON.parse(localStorage.getItem('safepass_history') || '[]');

  // Add new password to the front of the array
  history.unshift(password);

  // Keep only the 5 most recent passwords
  history = history.slice(0, 5);

  // Save back to localStorage
  localStorage.setItem('safepass_history', JSON.stringify(history));

  // Re-render the list
  renderHistory(history);
}

function renderHistory(history) {
  if (history.length === 0) {
    historyWrap.style.display = 'none';
    return;
  }

  historyWrap.style.display = 'block';
  historyList.innerHTML = '';

  history.forEach(function (pw) {
    const li = document.createElement('li');
    li.textContent = pw;
    li.title = pw;   // show full text on hover
    historyList.appendChild(li);
  });
}

// Load history when the page first opens
(function loadHistory() {
  const saved = JSON.parse(localStorage.getItem('safepass_history') || '[]');
  renderHistory(saved);
})();

// Clear history button
clearHistoryBtn.addEventListener('click', function () {
  localStorage.removeItem('safepass_history');
  renderHistory([]);
});


/* ─────────────────────────────────────────────────────────
   SECTION 13: KEYBOARD SHORTCUT — Press Enter in the input
   to trigger the strength check (it already runs live,
   but this is a nice UX touch)
   ───────────────────────────────────────────────────────── */
passwordInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    passwordInput.blur();   // remove focus so the keyboard closes on mobile
  }
});
