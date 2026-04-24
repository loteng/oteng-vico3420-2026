/* ============================================================
   LETICIA OTENG — PORTFOLIO JAVASCRIPT
   - Double-click landing folder → go to explorer
   - Double-click sidebar folders → open windows
   - Draggable folders (sidebar)
   - Draggable OS windows (titlebar drag)
   - Window close buttons
   - Active folder highlighting
   ============================================================ */

/* ---- UTILITY ---- */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* ---- SCREENS ---- */
const desktop  = $('#desktop');
const explorer = $('#explorer');

function showExplorer() {
  desktop.classList.remove('active');
  explorer.classList.add('active');
}

/* ---- LOGO → HOME ---- */
function goHome() {
  explorer.classList.remove('active');
  desktop.classList.add('active');
  // hide all windows
  windows.forEach(w => w.style.display = 'none');
}
document.getElementById('logoHomeBtn').addEventListener('click',         e => { e.preventDefault(); /* already on landing */ });
document.getElementById('logoHomeBtnExplorer').addEventListener('click', e => { e.preventDefault(); goHome(); });


const landingFolder = $('#landingFolder');
let landingClicks = 0, landingTimer;

function handleLandingActivate() {
  landingClicks++;
  clearTimeout(landingTimer);
  landingTimer = setTimeout(() => { landingClicks = 0; }, 400);
  if (landingClicks >= 2) {
    landingClicks = 0;
    landingFolder.classList.add('opening');
    setTimeout(showExplorer, 120);
  }
}

landingFolder.addEventListener('dblclick', showExplorer);
landingFolder.addEventListener('click',    handleLandingActivate);
landingFolder.addEventListener('keydown',  e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showExplorer(); }
});

/* ---- FOLDER ICONS (sidebar) ---- */
const folderIcons = $$('.folder-icon');

// Track click timing per folder for double-click detection on touch/mouse
folderIcons.forEach(icon => {
  let clicks = 0, timer;

  function activate() {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 450);
    if (clicks >= 2) {
      clicks = 0;
      openWindow(icon.dataset.target);
      setActiveFolder(icon);
    }
  }

  icon.addEventListener('dblclick', () => {
    openWindow(icon.dataset.target);
    setActiveFolder(icon);
  });
  icon.addEventListener('click', activate);
  icon.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openWindow(icon.dataset.target);
      setActiveFolder(icon);
    }
  });
});

function setActiveFolder(activeIcon) {
  folderIcons.forEach(f => f.classList.remove('active'));
  activeIcon.classList.add('active');
}

/* ---- WINDOWS ---- */
const windows = $$('.os-window');

function openWindow(id) {
  const win = $('#' + id);
  if (!win) return;
  win.style.display = 'block';
  bringToFront(win);
  // Animate
  win.style.animation = 'none';
  void win.offsetHeight; // reflow
  win.style.animation = '';
}

function closeWindow(win) {
  win.style.display = 'none';
}

function bringToFront(win) {
  let maxZ = 100; // windows always start above folders (folders are z:15)
  windows.forEach(w => {
    const z = parseInt(w.style.zIndex || 100);
    if (z > maxZ) maxZ = z;
  });
  win.style.zIndex = maxZ + 1;
}

// Close buttons
$$('.window-close').forEach(btn => {
  btn.addEventListener('click', () => closeWindow(btn.closest('.os-window')));
});

// Click window to bring to front
windows.forEach(win => {
  win.addEventListener('mousedown', () => bringToFront(win));
});

/* ---- WINDOW DRAG (titlebar) ---- */
$$('.window-bar').forEach(bar => {
  const win = bar.closest('.os-window');
  let dragging = false, startX, startY, origLeft, origTop;

  bar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('window-close')) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    origLeft = win.offsetLeft; origTop = win.offsetTop;
    bringToFront(win);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    e.preventDefault();
  });

  function onMouseMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = origLeft + dx;
    let newTop  = origTop  + dy;
    // Keep inside viewport
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - win.offsetWidth));
    newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - 60));
    win.style.left = newLeft + 'px';
    win.style.top  = newTop  + 'px';
  }

  function onMouseUp() {
    dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
  }
});

/* ---- FOLDER ICON DRAG (desktop) ---- */
folderIcons.forEach(icon => {
  let startX, startY, origX, origY;
  let ghost = null;
  const THRESHOLD = 6;

  icon.setAttribute('draggable', 'false');

  icon.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    const rect = icon.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });

  function onMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!ghost && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
      // Lift the icon out of the sidebar into fixed position
      icon.style.position = 'fixed';
      icon.style.left     = origX + 'px';
      icon.style.top      = origY + 'px';
      icon.style.zIndex   = '50'; // above sidebar, below windows (100+)
      icon.style.margin   = '0';
      icon.style.opacity  = '1';
      icon.style.transform = 'scale(1.08)';
      icon.style.transition = 'none';
      // Move into body so fixed coords work correctly
      document.body.appendChild(icon);
      ghost = true; // flag: dragging started
    }

    if (ghost) {
      icon.style.left = (origX + dx) + 'px';
      icon.style.top  = (origY + dy) + 'px';
    }
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);

    if (ghost) {
      // Settle: keep fixed position, restore normal look
      icon.style.transform  = '';
      icon.style.transition = '';
      icon.style.opacity    = '1';
      icon.style.zIndex     = '15'; // always behind windows (z:100+)
      ghost = null;
    }
  }
});

/* ---- HOVER TOOLTIP on skill badges ---- */
$$('.skill-badge').forEach(badge => {
  badge.setAttribute('role', 'img');
  badge.setAttribute('aria-label', badge.title || badge.textContent);
});

/* ---- GALLERY LIGHTBOX (ADJEI + DWELLING) ---- */
function openLightbox(images, startIndex) {
  let current = startIndex;

  const lb = document.createElement('div');
  lb.className = 'adjei-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');

  const bigImg = document.createElement('img');
  bigImg.alt = images[current].alt;
  bigImg.src = images[current].src;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'adjei-lightbox-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close');

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lb-nav lb-prev';
  prevBtn.innerHTML = '&#8592;';
  prevBtn.setAttribute('aria-label', 'Previous image');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lb-nav lb-next';
  nextBtn.innerHTML = '&#8594;';
  nextBtn.setAttribute('aria-label', 'Next image');

  const counter = document.createElement('div');
  counter.className = 'lb-counter';

  function update() {
    bigImg.src   = images[current].src;
    bigImg.alt   = images[current].alt;
    counter.textContent = `${current + 1} / ${images.length}`;
    prevBtn.style.visibility = images.length > 1 ? 'visible' : 'hidden';
    nextBtn.style.visibility = images.length > 1 ? 'visible' : 'hidden';
  }

  prevBtn.addEventListener('click', e => {
    e.stopPropagation();
    current = (current - 1 + images.length) % images.length;
    update();
  });
  nextBtn.addEventListener('click', e => {
    e.stopPropagation();
    current = (current + 1) % images.length;
    update();
  });

  lb.appendChild(prevBtn);
  lb.appendChild(bigImg);
  lb.appendChild(nextBtn);
  lb.appendChild(closeBtn);
  lb.appendChild(counter);
  document.body.appendChild(lb);
  update();

  function closeLb() {
    lb.remove();
    document.removeEventListener('keydown', onKey);
  }
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  closeBtn.addEventListener('click', closeLb);

  function onKey(e) {
    if (e.key === 'Escape')      closeLb();
    if (e.key === 'ArrowLeft')  { current = (current - 1 + images.length) % images.length; update(); }
    if (e.key === 'ArrowRight') { current = (current + 1) % images.length; update(); }
  }
  document.addEventListener('keydown', onKey);
  closeBtn.focus();
}

// Delegate clicks for both gallery types
document.addEventListener('click', e => {
  const img = e.target.closest('.adjei-img, .dwelling-img');
  if (!img) return;

  const selector = img.classList.contains('adjei-img') ? '.adjei-img' : '.dwelling-img';
  const allImgs  = [...document.querySelectorAll(selector)];
  const index    = allImgs.indexOf(img);
  openLightbox(allImgs, index);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const visible = windows
    .filter(w => w.style.display !== 'none')
    .sort((a, b) => (parseInt(b.style.zIndex) || 20) - (parseInt(a.style.zIndex) || 20));
  if (visible.length) closeWindow(visible[0]);
});