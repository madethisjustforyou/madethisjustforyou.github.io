const EXPECTED_USER = "umaxharidas";
const EXPECTED_PASS = "cutema";
const HINT_TEXT = "my favorite thing to call you :)";

const gate = document.getElementById("gate");
const gateCard = document.querySelector(".gate-card");
const gateForm = document.getElementById("gateForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const hintBtn = document.getElementById("hintBtn");
const hint = document.getElementById("hint");
const gateError = document.getElementById("gateError");
const userMsg = document.getElementById("userMsg");

const app = document.getElementById("app");
const pages = Array.from(document.querySelectorAll(".page"));
const celebrate = document.getElementById("celebrate");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

const memoriesField = document.getElementById("memories");
const curtain = document.getElementById("curtain");

const machineBtn = document.getElementById("machineBtn");
const cloudField = document.getElementById("cloudField");
const machineMsg = document.getElementById("machineMsg");

let currentPage = 1;
let timerStarted = false;

function normalize(s) {
  return (s || "").trim().toLowerCase();
}

function setGateError(msg) {
  gateError.textContent = msg || "";
}

function setHint(msg) {
  hint.textContent = msg || "";
}

function setUserMsg(msg) {
  userMsg.textContent = msg || "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeInto(el, text, { cps = 26, caret = true } = {}) {
  if (!el) return;
  el.textContent = "";
  if (caret) el.classList.add("type-caret");

  const delay = Math.max(12, Math.floor(1000 / cps));
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await sleep(delay);
  }

  if (caret) el.classList.remove("type-caret");
}

async function showPage(n) {
  pages.forEach((p) => p.classList.remove("is-active"));
  const next = pages.find((p) => Number(p.dataset.page) === n);
  if (!next) return;

  next.classList.add("is-active");
  currentPage = n;

  if (n === 1) await runPage1Type();
  if (n === 2) layoutMemories();
  if (n === 3) layoutPolaroids();
  if (n === 5) await runPage5Type();
  if (n === 6) await runFinalRevealAndType();
}

function openApp() {
  gateCard.classList.add("is-opening");
  setTimeout(() => {
    gate.classList.add("is-leaving");
    setTimeout(() => {
      gate.style.display = "none";
      app.setAttribute("aria-hidden", "false");
      showPage(1);
    }, 620);
  }, 620);
}

/* Gate logic */
username.value = EXPECTED_USER;

username.addEventListener("input", () => {
  const u = normalize(username.value);
  if (u && u !== EXPECTED_USER) setUserMsg("This letter was written just for Uma :)");
  else setUserMsg("");
});

hintBtn.addEventListener("click", () => {
  setHint(HINT_TEXT);
  setGateError("");
});

gateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const u = normalize(username.value);
  const p = normalize(password.value);

  if (u !== EXPECTED_USER) {
    setGateError("This letter is for Uma.");
    return;
  }
  if (p !== EXPECTED_PASS) {
    setGateError("Not quite, try the hint ;)");
    return;
  }
  setGateError("");
  openApp();
});

document.querySelectorAll(".next").forEach((btn) => {
  btn.addEventListener("click", () => showPage(Number(btn.dataset.next)));
});

document.addEventListener("touchmove", (e) => {
  // Prevent iOS from treating drags as scroll on the memories page
  if (currentPage === 2) e.preventDefault();
}, { passive: false });


/* Page 1 typing */
let page1Typed = false;
async function runPage1Type() {
  if (page1Typed) return;
  page1Typed = true;

  const t = document.getElementById("p1Title");
  const p = document.getElementById("p1Lead");

  await typeInto(t, t.dataset.text, { cps: 22 });
  await sleep(220);
  await typeInto(p, p.dataset.text, { cps: 30, caret: false });
}

/* Page 5 typing */
let page5Typed = false;
async function runPage5Type() {
  if (page5Typed) return;
  page5Typed = true;

  const t = document.getElementById("valTitle");
  const s = document.getElementById("valSub");

  await typeInto(t, t.dataset.text, { cps: 20 });
  await sleep(180);
  await typeInto(s, s.dataset.text, { cps: 28, caret: false });
}

/* Draggable helper (pauses float anim instead of killing it) */
function makeDraggable(container, selector, { onPick } = {}) {
  let target = null;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  container.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(selector);
    if (!el) return;

    target = el;
    target.setPointerCapture(e.pointerId);

    const rect = container.getBoundingClientRect();
    const elRect = target.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;

    origX = elRect.left - rect.left;
    origY = elRect.top - rect.top;

    target.classList.add("is-dragging");
    target.style.zIndex = "30";

    target.dataset.prevAnimState = target.style.animationPlayState || "";
    target.style.animationPlayState = "paused";

    if (onPick) onPick(target);
    e.preventDefault();
  });

  container.addEventListener("pointermove", (e) => {
    if (!target) return;

    const rect = container.getBoundingClientRect();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let x = origX + dx;
    let y = origY + dy;

    const w = target.offsetWidth;
    const h = target.offsetHeight;

    x = Math.max(8, Math.min(rect.width - w - 8, x));
    y = Math.max(8, Math.min(rect.height - h - 8, y));

    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
  });

  container.addEventListener("pointerup", () => {
    if (!target) return;
    target.classList.remove("is-dragging");
    target.style.zIndex = "";
    target.style.animationPlayState = target.dataset.prevAnimState || "";
    target = null;
  });
}

/* Page 2: memory layout */
function layoutMemories() {
  if (!memoriesField) return;
  const items = Array.from(memoriesField.querySelectorAll("[data-memory]"));
  const rect = memoriesField.getBoundingClientRect();
  const pad = 12;

  items.forEach((el) => {
    const w = Math.min(240, rect.width - pad * 2);
    const x = pad + Math.random() * (rect.width - w - pad);
    const y = pad + Math.random() * (rect.height - 100 - pad);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  });
}

if (memoriesField) {
  memoriesField.addEventListener("click", (e) => {
    const mem = e.target.closest("[data-memory]");
    if (!mem) return;

    const isOpen = mem.classList.contains("is-revealed");
    Array.from(memoriesField.querySelectorAll("[data-memory]")).forEach((m) => {
      m.classList.remove("is-revealed", "is-active");
    });

    if (!isOpen) {
      mem.classList.add("is-revealed", "is-active");
      memoriesField.classList.add("has-active");
    } else {
      memoriesField.classList.remove("has-active");
    }
  });

  makeDraggable(memoriesField, "[data-memory]", {
    onPick: (el) => {
      Array.from(memoriesField.querySelectorAll("[data-memory]")).forEach((m) => m.classList.remove("is-active"));
      el.classList.add("is-active");
    },
  });

  window.addEventListener("resize", () => {
    if (currentPage === 2) layoutMemories();
  });
}

/* Page 3: polaroid rotation + lightbox */
function layoutPolaroids() {
  document.querySelectorAll("[data-polaroids] .polaroid").forEach((p) => {
    const rot = (Math.random() * 10 - 5).toFixed(2);
    p.style.setProperty("--prot", `${rot}deg`);
  });
}

document.querySelectorAll(".polaroid").forEach((btn) => {
  const src = btn.dataset.src;
  btn.style.backgroundImage = `url("${src}")`;

  btn.addEventListener("click", () => {
    lightboxImg.src = src;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* Page 4: reasons machine */
const reasons = [
  "Your calm presence makes everything feel like its going to be okay.",
  "You care about my well-being in a way that feels safe and comforting.",
  "The videos/selfies you send make me smile ear-to-ear wherever I am :)",
  "How excited you get about traveling and building a life together.",
  "How you notice effort, and make me want to be better a better person for you :)",
  "Our shared humor. It's special, but at least it'll be special together :)",
  "I’m just really glad it’s you."
];

let reasonIdx = 0;

function rectsOverlap(a, b) {
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function spawnCloud(text) {
  const cloud = document.createElement("div");
  cloud.className = "cloud";
  cloud.textContent = text;

  const rect = cloudField.getBoundingClientRect();
  const pad = 14;

  const w = 260;
  const h = 54;

  const centerX = rect.width / 2;
  const funnelY = 120;

  const existing = Array.from(cloudField.querySelectorAll(".cloud")).map((c) => {
    const x = parseFloat(c.style.left || "0");
    const y = parseFloat(c.style.top || "0");
    return { x, y, w: Math.min(260, c.offsetWidth || 220), h: c.offsetHeight || 54 };
  });

  let best = null;

  for (let tries = 0; tries < 120; tries++) {
    let x = centerX + (Math.random() * 320 - 160);
    let y = funnelY + (Math.random() * 240);

    x = Math.max(pad, Math.min(rect.width - w - pad, x));
    y = Math.max(pad, Math.min(rect.height - h - pad, y));

    const candidate = { x, y, w, h };
    const hit = existing.some((ex) => rectsOverlap(ex, candidate));

    if (!hit) {
      best = candidate;
      break;
    }
    if (!best) best = candidate;
  }

  cloud.style.left = `${best.x}px`;
  cloud.style.top = `${best.y}px`;

  cloudField.appendChild(cloud);
  initCloudFloat(cloud);
  requestAnimationFrame(() => cloud.classList.add("is-born"));

}

/* =========================
   Floaty clouds (gentle motion + separation)
========================= */

function initCloudFloat(el) {
  // starting velocity
  el.dataset.vx = (Math.random() * 0.6 + 0.25) * (Math.random() < 0.5 ? -1 : 1);
  el.dataset.vy = (Math.random() * 0.45 + 0.18) * (Math.random() < 0.5 ? -1 : 1);

  // tiny per-cloud wobble phase
  el.dataset.phase = (Math.random() * Math.PI * 2).toString();

  // ensure it can move smoothly via transforms
  el.style.willChange = "transform";
}

let cloudsRAF = null;

function startCloudsFloatLoop() {
  if (!cloudField) return;
  if (cloudsRAF) return;

  const pad = 14;
  const maxV = 1.1;      // speed cap
  const pushK = 0.018;   // separation strength
  const wobbleK = 0.10;  // wobble amount

  function step() {
    const rect = cloudField.getBoundingClientRect();
    const clouds = Array.from(cloudField.querySelectorAll(".cloud"));

    // read state
    const state = clouds.map((c) => {
      const left = parseFloat(c.style.left || "0");
      const top = parseFloat(c.style.top || "0");
      const w = c.offsetWidth || 240;
      const h = c.offsetHeight || 54;
      let vx = parseFloat(c.dataset.vx || "0");
      let vy = parseFloat(c.dataset.vy || "0");
      const dragging = c.classList.contains("is-dragging");
      return { c, left, top, w, h, vx, vy, dragging };
    });

    // pairwise nudge apart (center-to-center repulsion)
    for (let i = 0; i < state.length; i++) {
      for (let j = i + 1; j < state.length; j++) {
        const a = state[i], b = state[j];
        if (a.dragging || b.dragging) continue;

        const ax = a.left + a.w / 2;
        const ay = a.top + a.h / 2;
        const bx = b.left + b.w / 2;
        const by = b.top + b.h / 2;

        const dx = ax - bx;
        const dy = ay - by;

        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = (Math.min(a.w, b.w) * 0.55); // how close before we push

        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;

          const push = (minDist - dist) * pushK;
          a.vx += nx * push;
          a.vy += ny * push;
          b.vx -= nx * push;
          b.vy -= ny * push;
        }
      }
    }

    // integrate + edge bounce
    for (const s of state) {
      const { c } = s;
      if (s.dragging) continue;

      // gentle wobble (so it feels floaty, not robotic)
      const phase = parseFloat(c.dataset.phase || "0") + 0.02;
      c.dataset.phase = phase.toString();
      s.vx += Math.sin(phase) * wobbleK * 0.02;
      s.vy += Math.cos(phase * 0.9) * wobbleK * 0.02;

      // clamp velocity
      s.vx = Math.max(-maxV, Math.min(maxV, s.vx));
      s.vy = Math.max(-maxV, Math.min(maxV, s.vy));

      let x = s.left + s.vx;
      let y = s.top + s.vy;

      const maxX = rect.width - s.w - pad;
      const maxY = rect.height - s.h - pad;

      if (x < pad) { x = pad; s.vx *= -0.9; }
      if (x > maxX) { x = maxX; s.vx *= -0.9; }
      if (y < pad) { y = pad; s.vy *= -0.9; }
      if (y > maxY) { y = maxY; s.vy *= -0.9; }

      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
      c.dataset.vx = s.vx.toString();
      c.dataset.vy = s.vy.toString();
    }

    cloudsRAF = requestAnimationFrame(step);
  }

  cloudsRAF = requestAnimationFrame(step);
}

// Start floating as soon as page 4 is reachable/used
startCloudsFloatLoop();


if (cloudField) {
  makeDraggable(cloudField, ".cloud", {
    onPick: (el) => {
      Array.from(cloudField.querySelectorAll(".cloud")).forEach((c) => c.classList.remove("is-active"));
      el.classList.add("is-active");
    },
  });
}

if (machineBtn) {
  machineBtn.addEventListener("click", async () => {
    if (reasonIdx >= reasons.length) {
      machineMsg.textContent = "It’s out. But I’m not. 🤍";
      return;
    }

    machineBtn.classList.add("is-firing");
    machineMsg.textContent = "";

    spawnCloud(reasons[reasonIdx]);
    reasonIdx++;

    await sleep(320);
    machineBtn.classList.remove("is-firing");

    if (reasonIdx >= reasons.length) {
      setTimeout(() => (machineMsg.textContent = "That’s all of them. (For now.)"), 520);
    }
  });
}

/* Celebration */
function burstHeartsAndConfetti() {
  const hearts = ["♥︎", "♡", "❥", "♥︎"];
  const confettiColors = ["#E6C48A", "#F6F1EA", "#E4B7A6", "#C48A7A"];

  for (let i = 0; i < 18; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    h.style.left = `${Math.random() * 100}vw`;
    h.style.bottom = `${-10 + Math.random() * 20}px`;
    h.style.fontSize = `${16 + Math.random() * 20}px`;
    h.style.animationDelay = `${Math.random() * 220}ms`;
    celebrate.appendChild(h);
    setTimeout(() => h.remove(), 1500);
  }

  for (let i = 0; i < 26; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.top = `${-20 - Math.random() * 30}px`;
    c.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    c.style.animationDelay = `${Math.random() * 220}ms`;
    celebrate.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
}

/* Page 5: choice + "Then it's official." */
function lockValentineUI() {
  const choices = document.getElementById("valChoices");
  if (choices) {
    Array.from(choices.querySelectorAll("button")).forEach((b) => (b.disabled = true));
    choices.style.opacity = "0.35";
    choices.style.filter = "blur(0.2px)";
  }
}

async function showOfficialLine() {
  const title = document.getElementById("valTitle");
  const sub = document.getElementById("valSub");
  if (sub) sub.textContent = "";
  await sleep(180);
  await typeInto(title, "Then it’s official.", { cps: 24, caret: true });
}

async function valentineChosen() {
  lockValentineUI();
  curtain.classList.add("is-on");
  burstHeartsAndConfetti();

  await showOfficialLine();
  await sleep(520);

  showPage(6);
  setTimeout(() => curtain.classList.remove("is-on"), 1100);
}

document.getElementById("valYes").addEventListener("click", () => valentineChosen());
document.getElementById("valObv").addEventListener("click", () => valentineChosen());

/* Timer (with seconds) */
function startTimer() {
  if (timerStarted) return;
  timerStarted = true;

  const start = new Date("2025-11-01T00:00:00");
  const el = document.getElementById("timerValue");

  function tick() {
    const now = new Date();
    let diff = now - start;
    if (diff < 0) diff = 0;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds - days * 24 * 3600) / 3600);
    const minutes = Math.floor((totalSeconds - days * 24 * 3600 - hours * 3600) / 60);
    const seconds = totalSeconds - days * 24 * 3600 - hours * 3600 - minutes * 60;

    el.textContent = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds of loving you`;
  }

  tick();
  setInterval(tick, 1000);
}


/* Final page: timer reveal + typed letter */
let finalRan = false;

async function runFinalRevealAndType() {
  if (finalRan) return;
  finalRan = true;

  startTimer();

  const timer = document.querySelector(".timer");
  const letterBox = document.getElementById("letterBox");
  const typed = document.getElementById("letterTyped");

  timer.classList.add("is-revealed");
  await sleep(900);

  letterBox.classList.add("is-revealed");
  await sleep(220);

  const paragraphs = [
    "Uma,",
    "Being with you feels steady in the best way — like I can finally exhale.",
    "You’ve brought warmth, care, and a kind of peace into my life that I didn’t know I needed. I love how natural this feels, how intentional it is, and how much room there is for us to grow.",
    "This is just one small way of saying: I choose you — today, and every day.",
    "Happy Valentine’s Day 🤍"
  ];

  typed.innerHTML = "";
  for (const para of paragraphs) {
    const p = document.createElement("p");
    typed.appendChild(p);
    await typeInto(p, para, { cps: 32, caret: true });
    await sleep(420);
  }
}

/* ESC closes lightbox */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
});
