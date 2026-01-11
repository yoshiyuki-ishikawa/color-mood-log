/**
 * Color Mood Log
 * Simple calendar-based mood tracker.
 * Logic: LocalStorage KVS (YYYY-MM-DD -> colorId)
 */

const STORAGE_KEY = 'color-log-data';

// Color Definitions
const COLORS = ['grey', 'blue', 'green', 'yellow', 'red'];

// State
let currentDate = new Date(); // To track calendar view month
let db = {}; // In-memory data

// DOM Elements
const els = {
    monthDisplay: document.getElementById('current-month-display'),
    calendarGrid: document.getElementById('calendar-grid'),
    prevBtn: document.getElementById('prev-month'),
    nextBtn: document.getElementById('next-month'),
    inputArea: document.getElementById('input-area'),
    colorBtns: document.querySelectorAll('.color-btn')
};

// Utils
const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

const isFuture = (d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d > today;
};

// Data Layer
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) db = JSON.parse(raw);
    } catch (e) {
        console.error('Data load failed', e);
        db = {};
    }
}

function saveData(key, color) {
    db[key] = color;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    // Provide tactile feedback implicitly by UI update
}

// Render Logic
function renderCalendar(viewDate) {
    els.calendarGrid.innerHTML = ''; // Clear

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed

    // Header
    els.monthDisplay.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;

    // Determine grid start
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay(); // 0(Sun)

    // Days in month
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Today
    const today = new Date();

    // Calendar Generation
    // 1. Padding cells (empty divs)
    for (let i = 0; i < startingDay; i++) {
        const pad = document.createElement('div');
        els.calendarGrid.appendChild(pad);
    }

    // 2. Day cells
    for (let d = 1; d <= lastDay; d++) {
        const dateObj = new Date(year, month, d);
        const key = formatDateKey(dateObj);

        const cell = document.createElement('div');
        cell.className = 'date-cell';
        cell.textContent = d;

        // Is Today?
        if (isSameDay(dateObj, today)) {
            cell.classList.add('is-today');
        }

        // Has Color?
        if (db[key]) {
            cell.setAttribute('data-color', db[key]);
        }

        els.calendarGrid.appendChild(cell);
    }

    // Input Area Visibility: Only show if displaying current month (implied by directive: "今日の色" logic)
    // Actually, input area is always visible but disabled/hidden if today is not selectable?
    // Directive says: "Input Area: 当日は何度でも... 過去日を表示中: エリア非表示 or Disable"
    // Since input area is detached from calendar grid (it's at the footer), we should check if 'Today' is in the current view?
    // Or actually, the input area is ALWAY for "Today". 
    // The requirement is: "記録ルール: 当日のみ... 過去日は変更不可".
    // So the Input Area always writes to *TODAY*. It doesn't write to the selected calendar day.
    // However, if the user navigates to a past month, maybe we should hide it to reduce noise?
    // Let's keep it simple: Ensure pressing the button writes to TODAY regardless of view, OR strict: only write to today.
    // Specification 3.1: "過去日を表示中: 入力エリアは非表示... UIを消す"
    // Let's interpret 'viewing a past month' as hiding the input.
    if (year === today.getFullYear() && month === today.getMonth()) {
        els.inputArea.style.opacity = '1';
        els.inputArea.style.pointerEvents = 'auto';
        updatePaletteSelection(formatDateKey(today));
    } else {
        els.inputArea.style.opacity = '0';
        els.inputArea.style.pointerEvents = 'none';
    }
}

function updatePaletteSelection(todayKey) {
    const currentColor = db[todayKey];
    els.colorBtns.forEach(btn => {
        if (btn.dataset.color === currentColor) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Input Logic
function setupListeners() {
    // Navigation
    els.prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    els.nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Color Input
    els.colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const today = new Date();
            const key = formatDateKey(today);
            const color = btn.dataset.color;

            // Save logic
            saveData(key, color);

            // UI Feedback
            // 1. Update palette state
            updatePaletteSelection(key);

            // 2. If 'today' is visible in calendar, animate it
            // We need to re-render or find the cell. 
            // Re-rendering is safe and cheap enough for monthly view.
            if (currentDate.getFullYear() === today.getFullYear() &&
                currentDate.getMonth() === today.getMonth()) {
                renderCalendar(currentDate);
            }
        });
    });
}

// Init
function init() {
    loadData();
    renderCalendar(currentDate);
    setupListeners();
}

document.addEventListener('DOMContentLoaded', init);
