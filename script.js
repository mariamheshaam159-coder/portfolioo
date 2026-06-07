// Moving cat eyes on the Home page
const homeKitty = document.querySelector(".kitty");

if (homeKitty) {
  document.addEventListener("mousemove", (event) => {
    const rect = homeKitty.getBoundingClientRect();
    const catCenterX = rect.left + rect.width / 2;
    const catCenterY = rect.top + rect.height / 2;

    const dx = event.clientX - catCenterX;
    const dy = event.clientY - catCenterY;
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

    const maxMove = 4;
    const eyeX = (dx / distance) * maxMove;
    const eyeY = (dy / distance) * maxMove;

    document.documentElement.style.setProperty("--eye-x", `${eyeX}px`);
    document.documentElement.style.setProperty("--eye-y", `${eyeY}px`);
  });
}

// Contact page stamps
// The real stamp moves into the postcard place.
// If another stamp replaces it, the old stamp returns to its original position.
const stampDrop = document.getElementById("stampDrop");
const stampsHolder = document.querySelector(".stamps");
let draggedStamp = null;

const stampHomeClasses = new Map();

document.querySelectorAll(".stamp").forEach((stamp) => {
  const positionClass = [...stamp.classList].find((className) =>
    className.startsWith("stamp-")
  );

  stampHomeClasses.set(stamp, positionClass);

  stamp.addEventListener("dragstart", (event) => {
    draggedStamp = stamp;
    stamp.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", stamp.alt || "stamp");
  });

  stamp.addEventListener("dragend", () => {
    stamp.classList.remove("dragging");
  });
});

function resetStampInlineStyles(stamp) {
  stamp.style.left = "";
  stamp.style.right = "";
  stamp.style.top = "";
  stamp.style.width = "";
  stamp.style.height = "";
  stamp.style.transform = "";
}

function returnStampToOriginalPlace(stamp) {
  if (!stamp || !stampsHolder) return;

  resetStampInlineStyles(stamp);
  stamp.classList.remove("in-stamp-box", "dragging");

  const originalClass = stampHomeClasses.get(stamp);
  if (originalClass) {
    stamp.classList.add(originalClass);
  }

  stamp.setAttribute("draggable", "true");
  stampsHolder.appendChild(stamp);
}

if (stampDrop) {
  stampDrop.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  stampDrop.addEventListener("drop", (event) => {
    event.preventDefault();

    if (!draggedStamp) return;

    const oldStamp = stampDrop.querySelector(".stamp");

    // If there is already a stamp in the postcard box,
    // send it back to its original place before adding the new one.
    if (oldStamp && oldStamp !== draggedStamp) {
      returnStampToOriginalPlace(oldStamp);
    }

    resetStampInlineStyles(draggedStamp);
    draggedStamp.classList.remove("dragging", "stamp-a", "stamp-b", "stamp-c", "stamp-d");
    draggedStamp.classList.add("in-stamp-box");
    draggedStamp.setAttribute("draggable", "true");

    stampDrop.appendChild(draggedStamp);
    draggedStamp = null;
  });
}

// Stop the contact form from refreshing the page while testing
const postcardForm = document.querySelector(".postcard-form");
if (postcardForm) {
  postcardForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}


// Work page category filter
const workFilterButtons = document.querySelectorAll(".work-filter button");
const projectCards = document.querySelectorAll(".project-card");

workFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;

    workFilterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    projectCards.forEach((card) => {
      const match = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("hidden", !match);
    });
  });
});


// Posters & Flyers project page race interaction
const raceShell = document.querySelector(".poster-shell");
const raceCarButton = document.querySelector(".race-car-btn");

if (raceShell && raceCarButton) {
  raceCarButton.addEventListener("click", () => {
    raceShell.classList.toggle("race-started");
  });
}


// Tools Cart interactive game page
const toolsPlayArea = document.getElementById("toolsPlayArea");
const toolsFallingLayer = document.getElementById("toolsFallingLayer");
const toolsBasketWrap = document.getElementById("toolsBasketWrap");
const toolsScoreValue = document.getElementById("scoreValue");
const toolsTimeValue = document.getElementById("timeValue");
const toolsFinishMessage = document.getElementById("toolsFinishMessage");
const toolsFinishTime = document.getElementById("toolsFinishTime");
const toolsFinishTitle = document.getElementById("toolsFinishTitle");
const toolsRestartBtn = document.getElementById("toolsRestartBtn");
const toolsInstructions = document.getElementById("toolsInstructions");

if (toolsPlayArea && toolsFallingLayer && toolsBasketWrap && toolsScoreValue && toolsTimeValue) {
  const toolSources = [
    "assets/tool-figma.png",
    "assets/tool-palette.png",
    "assets/tool-indesign.png",
    "assets/tool-photoshop.png",
    "assets/tool-aftereffects.png",
    "assets/tool-canva.png",
    "assets/tool-premiere.png",
    "assets/tool-maya.png"
  ];

  let toolQueue = [];
  let activeTool = null;
  let basketX = 0;
  let targetBasketX = 0;
  let score = 0;
  let collectedTools = 0;
  let startTime = 0;
  let elapsedMs = 0;
  let gameFinished = false;
  let lastTimestamp = 0;
  let animationId = 0;

  const basketHitPadding = {
    left: 0.16,
    right: 0.16,
    top: 0.32,
    bottom: 0.16,
  };

  function shuffle(array) {
    const cloned = [...array];
    for (let i = cloned.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}.${String(seconds).padStart(2, "0")}`;
  }

  function updateScore() {
    toolsScoreValue.textContent = String(score);
  }

  function updateTimer(now) {
    if (gameFinished) return;
    elapsedMs = now - startTime;
    toolsTimeValue.textContent = formatTime(elapsedMs);
  }

  function moveBasket(clientX) {
    const rect = toolsPlayArea.getBoundingClientRect();
    const basketWidth = toolsBasketWrap.offsetWidth;
    const desiredX = clientX - rect.left - basketWidth / 2;
    targetBasketX = Math.max(0, Math.min(rect.width - basketWidth, desiredX));
  }

  function createTool(source) {
    const tool = document.createElement("img");
    tool.className = "falling-tool";
    tool.src = source;
    tool.alt = "Tool logo";
    toolsFallingLayer.appendChild(tool);

    const size = 84 + Math.random() * 10;
    const maxX = Math.max(20, toolsPlayArea.clientWidth - size - 20);
    const x = 16 + Math.random() * (maxX - 16);
    const speed = 220 + Math.random() * 70; // px per second
    const rotation = -10 + Math.random() * 20;

    return {
      el: tool,
      source,
      x,
      y: -size - 8,
      size,
      speed,
      rotation,
    };
  }

  function removeActiveTool() {
    if (activeTool && activeTool.el && activeTool.el.parentNode) {
      activeTool.el.parentNode.removeChild(activeTool.el);
    }
    activeTool = null;
  }

  function spawnNextTool() {
    removeActiveTool();

    if (!toolQueue.length) {
      endGame();
      return;
    }

    activeTool = createTool(toolQueue.shift());
    activeTool.el.style.width = `${activeTool.size}px`;
    activeTool.el.style.height = `${activeTool.size}px`;
    activeTool.el.style.transform = `translate(${activeTool.x}px, ${activeTool.y}px) rotate(${activeTool.rotation}deg)`;
  }

  function skipActiveTool() {
    if (!activeTool) return;

    if (activeTool.el && activeTool.el.parentNode) {
      activeTool.el.parentNode.removeChild(activeTool.el);
    }

    activeTool = null;
    spawnNextTool();
  }

  function toolCaught() {
    if (!activeTool) return;

    score += 10;
    collectedTools += 1;
    updateScore();

    if (activeTool.el && activeTool.el.parentNode) {
      activeTool.el.parentNode.removeChild(activeTool.el);
    }

    activeTool = null;
    spawnNextTool();
  }

  function getBasketHitRect() {
    const rect = toolsBasketWrap.getBoundingClientRect();
    return {
      left: rect.left + rect.width * basketHitPadding.left,
      right: rect.right - rect.width * basketHitPadding.right,
      top: rect.top + rect.height * basketHitPadding.top,
      bottom: rect.bottom - rect.height * basketHitPadding.bottom,
    };
  }

  function intersects(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function endGame() {
    gameFinished = true;
    cancelAnimationFrame(animationId);
    toolsTimeValue.textContent = formatTime(elapsedMs);
    if (toolsFinishTitle) {
      toolsFinishTitle.textContent = `You collected ${collectedTools} tools!`;
    }
    if (toolsFinishTime) {
      toolsFinishTime.textContent = `Time: ${formatTime(elapsedMs)}`;
    }
    if (toolsFinishMessage) {
      toolsFinishMessage.classList.remove("hidden");
    }
  }

  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    updateTimer(timestamp);

    const smoothing = Math.min(1, delta * 12);
    basketX += (targetBasketX - basketX) * smoothing;
    toolsBasketWrap.style.left = `${basketX}px`;
    toolsBasketWrap.style.transform = "translateX(0)";

    if (activeTool) {
      activeTool.y += activeTool.speed * delta;
      activeTool.el.style.transform = `translate(${activeTool.x}px, ${activeTool.y}px) rotate(${activeTool.rotation}deg)`;

      const toolRect = activeTool.el.getBoundingClientRect();
      const basketRect = getBasketHitRect();

      if (intersects(toolRect, basketRect)) {
        toolCaught();
      } else if (activeTool && activeTool.y > toolsPlayArea.clientHeight + 20) {
        skipActiveTool();
      }
    }

    if (!gameFinished) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  function startGame() {
    cancelAnimationFrame(animationId);
    removeActiveTool();

    toolQueue = shuffle(toolSources);
    score = 0;
    collectedTools = 0;
    elapsedMs = 0;
    gameFinished = false;
    lastTimestamp = 0;
    startTime = performance.now();

    updateScore();
    toolsTimeValue.textContent = formatTime(0);

    if (toolsFinishMessage) {
      toolsFinishMessage.classList.add("hidden");
    }

    if (toolsInstructions) {
      toolsInstructions.classList.remove("hidden");
      setTimeout(() => {
        if (toolsInstructions && !gameFinished) {
          toolsInstructions.classList.add("hidden");
        }
      }, 2400);
    }

    const initialRect = toolsPlayArea.getBoundingClientRect();
    basketX = (initialRect.width - toolsBasketWrap.offsetWidth) / 2;
    targetBasketX = basketX;
    toolsBasketWrap.style.left = `${basketX}px`;
    toolsBasketWrap.style.transform = "translateX(0)";

    spawnNextTool();
    animationId = requestAnimationFrame(gameLoop);
  }

  toolsPlayArea.addEventListener("mousemove", (event) => {
    moveBasket(event.clientX);
  });

  toolsPlayArea.addEventListener("mouseenter", (event) => {
    moveBasket(event.clientX);
  });

  window.addEventListener("resize", () => {
    const areaRect = toolsPlayArea.getBoundingClientRect();
    const basketWidth = toolsBasketWrap.offsetWidth;
    basketX = Math.max(0, Math.min(areaRect.width - basketWidth, basketX));
    targetBasketX = Math.max(0, Math.min(areaRect.width - basketWidth, targetBasketX));
    toolsBasketWrap.style.left = `${basketX}px`;
    if (activeTool) {
      activeTool.x = Math.max(10, Math.min(areaRect.width - activeTool.size - 10, activeTool.x));
    }
  });

  if (toolsRestartBtn) {
    toolsRestartBtn.addEventListener("click", startGame);
  }

  startGame();
}






























// What I Do interactive service tabs
(() => {
  const page = document.querySelector('.whatdo-page');
  const stack = document.querySelector('.whatdo-stack');
  const introPanel = document.querySelector('.whatdo-intro-panel');
  const folders = Array.from(document.querySelectorAll('.whatdo-folder'));
  if (!page || !stack || !folders.length) return;

  let activeIndex = null;

  const positions = {
    collapsedTop: [62, 184, 306, 428, 550],
    activeTop: 62,
    activeHeight: 650,
    collapsedHeight: 102
  };

  function hideIntro() {
    if (introPanel) introPanel.classList.remove('is-visible');
  }

  function applyLayout(index) {
    activeIndex = index;
    hideIntro();

    if (window.innerWidth <= 1100) {
      folders.forEach((folder, i) => {
        const isActive = i === activeIndex;
        folder.classList.toggle('is-active', isActive);
        const tab = folder.querySelector('.whatdo-tab');
        if (tab) tab.setAttribute('aria-expanded', String(isActive));
        folder.style.height = isActive ? '430px' : '98px';
        folder.style.top = '';
        folder.style.left = '';
        folder.style.width = '';
      });
      return;
    }

    folders.forEach((folder, i) => {
      const isActive = i === activeIndex;
      const tab = folder.querySelector('.whatdo-tab');
      folder.classList.toggle('is-active', isActive);

      if (tab) {
        tab.setAttribute('aria-expanded', String(isActive));
      }

      folder.style.left = '0px';
      folder.style.width = '100%';

      if (isActive) {
        folder.style.top = `${positions.activeTop}px`;
        folder.style.height = `${positions.activeHeight}px`;
        folder.style.zIndex = '40';
      } else {
        folder.style.top = `${positions.collapsedTop[i]}px`;
        folder.style.height = `${positions.collapsedHeight}px`;
        folder.style.zIndex = String(10 + i);
      }
    });
  }

  folders.forEach((folder, index) => {
    const tab = folder.querySelector('.whatdo-tab');
    const open = (event) => {
      if (event) event.stopPropagation();
      applyLayout(activeIndex === index ? null : index);
    };

    folder.addEventListener('click', open);

    if (tab) {
      tab.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(event);
        }
      });
    }
  });

  window.addEventListener('resize', () => applyLayout(activeIndex));
  applyLayout(null);
})();


//  cat car: click to drive forward to the flag
(() => {
  const carButton = document.querySelector(".cat-car-btn");
  const racingStrip = document.querySelector(".racing-strip");
  if (!carButton) return;

  carButton.addEventListener("click", () => {
    if (racingStrip) racingStrip.classList.add("guides-hidden");

    carButton.classList.remove("is-arrived");
    carButton.classList.add("is-driving");

    window.setTimeout(() => {
      carButton.classList.add("is-arrived");
    }, 4200);
  });
})();


//  interactive UI for adjusting note text and buttons + CSS export
(() => {
  function initNoteAdjuster() {
    const adjuster = document.querySelector(".note-adjuster");
    if (!adjuster || adjuster.dataset.ready === "true") return;
    adjuster.dataset.ready = "true";

    const toggle = adjuster.querySelector(".adjuster-toggle");
    const noteSelect = document.getElementById("noteSelect");
    const resetBtn = adjuster.querySelector(".reset-adjustments");
    const showCssBtn = adjuster.querySelector(".save-css-adjustments");
    const copyCssBtn = adjuster.querySelector(".copy-css-adjustments");
    const cssOutput = document.getElementById("noteCssOutput");

    const controls = {
      textEditor: document.getElementById("noteTextEditor"),
      buttonTextEditor: document.getElementById("noteButtonTextEditor"),
      textSize: document.getElementById("noteTextSize"),
      textX: document.getElementById("noteTextX"),
      textY: document.getElementById("noteTextY"),
      textAlign: document.getElementById("noteTextAlign"),
      buttonWidth: document.getElementById("noteButtonWidth"),
      buttonX: document.getElementById("noteButtonX"),
      buttonY: document.getElementById("noteButtonY"),
      buttonAlign: document.getElementById("noteButtonAlign")
    };

    const defaults = {
      textSize: "18",
      textX: "0",
      textY: "0",
      textAlign: "left",
      buttonWidth: "170",
      buttonX: "0",
      buttonY: "0",
      buttonAlign: "center"
    };

    const noteKeys = ["note-top-left", "note-top-right", "note-bottom-left", "note-bottom-right"];
    const state = {};
    noteKeys.forEach(key => state[key] = { ...defaults, text: "", buttonText: "" });

    function getNoteKey(note) {
      return noteKeys.find(key => note.classList.contains(key));
    }

    function getSelectedKey() {
      return noteSelect ? noteSelect.value : "all";
    }

    function getTargetNotes() {
      const selected = getSelectedKey();
      if (selected === "all") return Array.from(document.querySelectorAll(".note-card"));
      return Array.from(document.querySelectorAll(`.note-card.${selected}`));
    }

    function isBulletNote(note) {
      return note.querySelector(".note-list") !== null;
    }

    function getNoteLines(note) {
      const paragraphs = Array.from(note.querySelectorAll(".note-text p"));
      return paragraphs.map(p => p.textContent.replace(/^♥\s*/, "").trim()).join("\n");
    }

    function setNoteLines(note, value) {
      const textBox = note.querySelector(".note-text");
      const button = note.querySelector(".note-btn");
      if (!textBox) return;

      const lines = value.split("\n").map(line => line.trim()).filter(Boolean);
      const bullet = isBulletNote(note);

      textBox.querySelectorAll("p").forEach(p => p.remove());

      lines.forEach(line => {
        const p = document.createElement("p");
        if (bullet) {
          const span = document.createElement("span");
          span.textContent = "♥";
          p.appendChild(span);
          p.appendChild(document.createTextNode(" " + line));
        } else {
          p.textContent = line;
        }
        textBox.insertBefore(p, button || null);
      });
    }

    function saveNoteStateFromControls(note) {
      const key = getNoteKey(note);
      if (!key) return;

      state[key].textSize = controls.textSize?.value || defaults.textSize;
      state[key].textX = controls.textX?.value || defaults.textX;
      state[key].textY = controls.textY?.value || defaults.textY;
      state[key].textAlign = controls.textAlign?.value || defaults.textAlign;
      state[key].buttonWidth = controls.buttonWidth?.value || defaults.buttonWidth;
      state[key].buttonX = controls.buttonX?.value || defaults.buttonX;
      state[key].buttonY = controls.buttonY?.value || defaults.buttonY;
      state[key].buttonAlign = controls.buttonAlign?.value || defaults.buttonAlign;
      state[key].text = getNoteLines(note);
      const btn = note.querySelector(".note-btn");
      state[key].buttonText = btn ? btn.textContent.trim() : "";
    }

    function loadControlsFromSelection() {
      const notes = getTargetNotes();
      const first = notes[0];
      if (!first) return;
      const key = getNoteKey(first);

      if (key && state[key].text === "") {
        state[key].text = getNoteLines(first);
        const btn = first.querySelector(".note-btn");
        state[key].buttonText = btn ? btn.textContent.trim() : "";
      }

      const data = key ? state[key] : defaults;
      if (controls.textSize) controls.textSize.value = data.textSize;
      if (controls.textX) controls.textX.value = data.textX;
      if (controls.textY) controls.textY.value = data.textY;
      if (controls.textAlign) controls.textAlign.value = data.textAlign;
      if (controls.buttonWidth) controls.buttonWidth.value = data.buttonWidth;
      if (controls.buttonX) controls.buttonX.value = data.buttonX;
      if (controls.buttonY) controls.buttonY.value = data.buttonY;
      if (controls.buttonAlign) controls.buttonAlign.value = data.buttonAlign;
      if (controls.textEditor) controls.textEditor.value = data.text || getNoteLines(first);
      if (controls.buttonTextEditor) {
        const btn = first.querySelector(".note-btn");
        controls.buttonTextEditor.value = data.buttonText || (btn ? btn.textContent.trim() : "");
      }

      updateHighlight();
    }

    function updateHighlight() {
      document.querySelectorAll(".note-card").forEach(card => card.classList.remove("is-adjusting"));
      getTargetNotes().forEach(card => card.classList.add("is-adjusting"));
    }

    function applyControls() {
      getTargetNotes().forEach(note => {
        note.style.setProperty("--note-text-size", `${controls.textSize.value}px`);
        note.style.setProperty("--note-text-x", `${controls.textX.value}px`);
        note.style.setProperty("--note-text-y", `${controls.textY.value}px`);
        note.style.setProperty("--note-text-align", controls.textAlign.value);
        note.style.setProperty("--note-button-width", `${controls.buttonWidth.value}px`);
        note.style.setProperty("--note-button-x", `${controls.buttonX.value}px`);
        note.style.setProperty("--note-button-y", `${controls.buttonY.value}px`);
        note.style.setProperty("--note-button-align", controls.buttonAlign.value);
        note.dataset.btnAlign = controls.buttonAlign.value;

        if (controls.textEditor) setNoteLines(note, controls.textEditor.value);
        if (controls.buttonTextEditor) {
          const btn = note.querySelector(".note-btn");
          if (btn) btn.textContent = controls.buttonTextEditor.value;
        }

        saveNoteStateFromControls(note);
      });

      updateHighlight();
    }

    function resetControls() {
      Object.entries(defaults).forEach(([key, value]) => {
        if (controls[key]) controls[key].value = value;
      });

      getTargetNotes().forEach(note => {
        note.style.removeProperty("--note-text-size");
        note.style.removeProperty("--note-text-x");
        note.style.removeProperty("--note-text-y");
        note.style.removeProperty("--note-text-align");
        note.style.removeProperty("--note-button-width");
        note.style.removeProperty("--note-button-x");
        note.style.removeProperty("--note-button-y");
        note.style.removeProperty("--note-button-align");
        delete note.dataset.btnAlign;
        saveNoteStateFromControls(note);
      });

      loadControlsFromSelection();
      updateCssOutput();
    }

    function buildCssOutput() {
      let output = `/* Final  note alignment CSS */\n`;
      noteKeys.forEach(key => {
        const note = document.querySelector(`.note-card.${key}`);
        if (note) saveNoteStateFromControls(note);
        const data = state[key];

        output += `
body.-page .${key} {
  --note-text-size: ${data.textSize}px;
  --note-text-x: ${data.textX}px;
  --note-text-y: ${data.textY}px;
  --note-text-align: ${data.textAlign};
  --note-button-width: ${data.buttonWidth}px;
  --note-button-x: ${data.buttonX}px;
  --note-button-y: ${data.buttonY}px;
  --note-button-align: ${data.buttonAlign};
}

body.-page .${key} .note-text p {
  text-align: var(--note-text-align) !important;
  font-size: var(--note-text-size) !important;
  transform: translate(var(--note-text-x), var(--note-text-y)) !important;
}

body.-page .${key} .note-btn {
  width: var(--note-button-width) !important;
  min-width: var(--note-button-width) !important;
  max-width: var(--note-button-width) !important;
  transform: translate(var(--note-button-x), var(--note-button-y)) !important;
}
`;
      });
      return output.trim();
    }

    function updateCssOutput() {
      if (!cssOutput) return;
      cssOutput.value = buildCssOutput();
    }

    if (toggle) {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        adjuster.classList.toggle("is-open");
        loadControlsFromSelection();
        updateCssOutput();
      });
    }

    if (noteSelect) noteSelect.addEventListener("change", loadControlsFromSelection);

    Object.values(controls).forEach(control => {
      if (!control) return;
      control.addEventListener("input", () => {
        applyControls();
        updateCssOutput();
      });
      control.addEventListener("change", () => {
        applyControls();
        updateCssOutput();
      });
    });

    if (resetBtn) resetBtn.addEventListener("click", resetControls);

    if (showCssBtn) {
      showCssBtn.addEventListener("click", () => {
        updateCssOutput();
        if (cssOutput) cssOutput.focus();
      });
    }

    if (copyCssBtn) {
      copyCssBtn.addEventListener("click", async () => {
        updateCssOutput();
        if (!cssOutput) return;
        cssOutput.select();
        try {
          await navigator.clipboard.writeText(cssOutput.value);
          copyCssBtn.textContent = "Copied!";
          setTimeout(() => copyCssBtn.textContent = "Copy CSS", 1200);
        } catch {
          document.execCommand("copy");
        }
      });
    }

    loadControlsFromSelection();
    updateCssOutput();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNoteAdjuster);
  } else {
    initNoteAdjuster();
  }

  window.addEventListener("load", initNoteAdjuster);
})();


//  drag-and-drop adjustment for note text and buttons
(() => {
  function initDragAdjuster() {
    const dragBtn = document.querySelector(".drag-mode-toggle");
    const finishBtn = document.querySelector(".finish-drag-mode");
    const cssOutput = document.getElementById("noteCssOutput");
    const noteSelect = document.getElementById("noteSelect");
    const controls = {
      textX: document.getElementById("noteTextX"),
      textY: document.getElementById("noteTextY"),
      buttonX: document.getElementById("noteButtonX"),
      buttonY: document.getElementById("noteButtonY")
    };

    if (!dragBtn || dragBtn.dataset.dragReady === "true") return;
    dragBtn.dataset.dragReady = "true";

    let activeEl = null;
    let activeNote = null;
    let startX = 0;
    let startY = 0;
    let startVarX = 0;
    let startVarY = 0;
    let activeType = null;

    function pxValue(note, name) {
      const inlineValue = note.style.getPropertyValue(name);
      if (inlineValue) return parseFloat(inlineValue) || 0;
      const computed = getComputedStyle(note).getPropertyValue(name);
      return parseFloat(computed) || 0;
    }

    function noteKey(note) {
      return ["note-top-left", "note-top-right", "note-bottom-left", "note-bottom-right"].find(cls => note.classList.contains(cls));
    }

    function selectedKeyFor(note) {
      const key = noteKey(note);
      if (noteSelect && key) noteSelect.value = key;
    }

    function updateSliders(note) {
      if (!note) return;
      if (controls.textX) controls.textX.value = pxValue(note, "--note-text-x");
      if (controls.textY) controls.textY.value = pxValue(note, "--note-text-y");
      if (controls.buttonX) controls.buttonX.value = pxValue(note, "--note-button-x");
      if (controls.buttonY) controls.buttonY.value = pxValue(note, "--note-button-y");
    }

    function makeCssOutput() {
      const notes = Array.from(document.querySelectorAll(".note-card"));
      let out = "/* Final  note alignment CSS */\n";
      notes.forEach(note => {
        const key = noteKey(note);
        if (!key) return;

        const tx = pxValue(note, "--note-text-x");
        const ty = pxValue(note, "--note-text-y");
        const bx = pxValue(note, "--note-button-x");
        const by = pxValue(note, "--note-button-y");
        const bw = getComputedStyle(note).getPropertyValue("--note-button-width").trim() || "170px";
        const ts = getComputedStyle(note).getPropertyValue("--note-text-size").trim() || "16.5px";
        const ta = getComputedStyle(note).getPropertyValue("--note-text-align").trim() || "left";
        const ba = note.dataset.btnAlign || getComputedStyle(note).getPropertyValue("--note-button-align").trim() || "center";

        out += `
body.-page .${key} {
  --note-text-size: ${ts};
  --note-text-x: ${tx}px;
  --note-text-y: ${ty}px;
  --note-text-align: ${ta};
  --note-button-width: ${bw};
  --note-button-x: ${bx}px;
  --note-button-y: ${by}px;
  --note-button-align: ${ba};
}

body.-page .${key} .note-text p {
  text-align: var(--note-text-align) !important;
  font-size: var(--note-text-size) !important;
  transform: translate(var(--note-text-x), var(--note-text-y)) !important;
}

body.-page .${key} .note-btn {
  position: absolute !important;
  width: var(--note-button-width) !important;
  min-width: var(--note-button-width) !important;
  max-width: var(--note-button-width) !important;
  left: 50% !important;
  right: auto !important;
  bottom: 0 !important;
  transform: translate(calc(-50% + var(--note-button-x)), var(--note-button-y)) !important;
}

body.-page .${key}[data-btn-align="flex-start"] .note-btn {
  left: 0 !important;
  right: auto !important;
  transform: translate(var(--note-button-x), var(--note-button-y)) !important;
}

body.-page .${key}[data-btn-align="flex-end"] .note-btn {
  left: auto !important;
  right: 0 !important;
  transform: translate(var(--note-button-x), var(--note-button-y)) !important;
}
`;
      });
      return out.trim();
    }

    function updateCssBox() {
      if (cssOutput) cssOutput.value = makeCssOutput();
    }

    function startDrag(event) {
      if (!document.body.classList.contains("note-drag-mode")) return;

      const target = event.target.closest(".note-btn, .note-text p");
      if (!target) return;

      const note = target.closest(".note-card");
      if (!note) return;

      event.preventDefault();
      event.stopPropagation();

      selectedKeyFor(note);

      activeEl = target;
      activeNote = note;
      activeType = target.classList.contains("note-btn") ? "button" : "text";
      startX = event.clientX;
      startY = event.clientY;
      startVarX = pxValue(note, activeType === "button" ? "--note-button-x" : "--note-text-x");
      startVarY = pxValue(note, activeType === "button" ? "--note-button-y" : "--note-text-y");

      activeEl.classList.add("is-dragging");
      window.addEventListener("pointermove", moveDrag);
      window.addEventListener("pointerup", stopDrag);
    }

    function moveDrag(event) {
      if (!activeEl || !activeNote) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (activeType === "button") {
        activeNote.style.setProperty("--note-button-x", `${Math.round(startVarX + dx)}px`);
        activeNote.style.setProperty("--note-button-y", `${Math.round(startVarY + dy)}px`);
      } else {
        activeNote.style.setProperty("--note-text-x", `${Math.round(startVarX + dx)}px`);
        activeNote.style.setProperty("--note-text-y", `${Math.round(startVarY + dy)}px`);
      }

      updateSliders(activeNote);
      updateCssBox();
    }

    function stopDrag() {
      if (activeEl) activeEl.classList.remove("is-dragging");
      activeEl = null;
      activeNote = null;
      activeType = null;
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", stopDrag);
      updateCssBox();
    }

    dragBtn.addEventListener("click", () => {
      document.body.classList.add("note-drag-mode");
      updateCssBox();
    });

    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        document.body.classList.remove("note-drag-mode");
        updateCssBox();
      });
    }

    document.addEventListener("pointerdown", startDrag);
    updateCssBox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDragAdjuster);
  } else {
    initDragAdjuster();
  }
  window.addEventListener("load", initDragAdjuster);
})();


//  note buttons popup interaction
(() => {
  const buttons = Array.from(document.querySelectorAll(".note-popup-btn"));
  const overlay = document.querySelector(".note-popup-overlay");
  if (!buttons.length || !overlay) return;

  const title = overlay.querySelector("#notePopupTitle");
  const text = overlay.querySelector("#notePopupText");
  const closeBtn = overlay.querySelector(".note-popup-close");

  function openPopup(button) {
    if (title) title.textContent = button.dataset.title || "Project Info";
    if (text) text.textContent = button.dataset.detail || "";
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePopup() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  buttons.forEach(button => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openPopup(button);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closePopup);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closePopup();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePopup();
  });
})();





// About page text content and size control
(() => {
  function initAboutTextControls() {
    const page = document.querySelector(".about-card-page");
    const panel = document.querySelector(".about-object-adjuster");
    if (!page || !panel || panel.dataset.textReady === "true") return;
    panel.dataset.textReady = "true";

    const textSelect = document.getElementById("aboutTextSelect");
    const textEditor = document.getElementById("aboutTextEditor");
    const textSize = document.getElementById("aboutTextSize");
    const textX = document.getElementById("aboutTextX");
    const textY = document.getElementById("aboutTextY");
    const textAlign = document.getElementById("aboutTextAlign");
    const textDragBtn = panel.querySelector(".about-text-drag-toggle");
    const cssOutput = document.getElementById("aboutCssOutput");
    const copyBtn = panel.querySelector(".about-copy-css");

    const map = {
      name: {
        el: () => document.querySelector(".about-window-text h1"),
        x: "--about-name-x",
        y: "--about-name-y",
        size: "--about-name-size",
        align: "--about-name-align",
        defaultSize: 42
      },
      paragraph: {
        el: () => document.querySelector(".about-window-text p"),
        x: "--about-paragraph-x",
        y: "--about-paragraph-y",
        size: "--about-paragraph-size",
        align: "--about-paragraph-align",
        defaultSize: 28
      }
    };

    let activeText = null;
    let activeType = "name";
    let startMouseX = 0;
    let startMouseY = 0;
    let startX = 0;
    let startY = 0;

    function cssVar(name, fallback = 0) {
      const inline = page.style.getPropertyValue(name);
      const computed = getComputedStyle(page).getPropertyValue(name);
      const raw = inline || computed;
      return parseFloat(raw) || fallback;
    }

    function alignVar(name, fallback = "left") {
      const inline = page.style.getPropertyValue(name);
      const computed = getComputedStyle(page).getPropertyValue(name);
      return (inline || computed || fallback).trim();
    }

    function loadSelectedText() {
      if (!textSelect) return;
      const selected = textSelect.value;
      const cfg = map[selected];
      const el = cfg.el();
      if (!el) return;

      if (textEditor) textEditor.value = el.textContent.trim();
      if (textSize) textSize.value = cssVar(cfg.size, cfg.defaultSize);
      if (textX) textX.value = cssVar(cfg.x, 0);
      if (textY) textY.value = cssVar(cfg.y, 0);
      if (textAlign) textAlign.value = alignVar(cfg.align, "left");

      updateCssOutput();
    }

    function applyTextControls() {
      const selected = textSelect.value;
      const cfg = map[selected];
      const el = cfg.el();
      if (!el) return;

      if (textEditor) el.textContent = textEditor.value;
      if (textSize) page.style.setProperty(cfg.size, `${textSize.value}px`);
      if (textX) page.style.setProperty(cfg.x, `${textX.value}px`);
      if (textY) page.style.setProperty(cfg.y, `${textY.value}px`);
      if (textAlign) page.style.setProperty(cfg.align, textAlign.value);

      updateCssOutput();
    }

    function buildTextCss() {
      const name = map.name;
      const para = map.paragraph;
      return `
/* Final About page text CSS */
.about-card-page {
  --about-name-x: ${cssVar(name.x, 0)}px;
  --about-name-y: ${cssVar(name.y, 0)}px;
  --about-name-size: ${cssVar(name.size, 42)}px;
  --about-name-align: ${alignVar(name.align, "left")};
  --about-paragraph-x: ${cssVar(para.x, 0)}px;
  --about-paragraph-y: ${cssVar(para.y, 0)}px;
  --about-paragraph-size: ${cssVar(para.size, 28)}px;
  --about-paragraph-align: ${alignVar(para.align, "left")};
}

.about-window-text h1 {
  font-size: var(--about-name-size) !important;
  text-align: var(--about-name-align) !important;
  transform: translate(var(--about-name-x), var(--about-name-y)) !important;
}

.about-window-text p {
  font-size: var(--about-paragraph-size) !important;
  text-align: var(--about-paragraph-align) !important;
  transform: translate(var(--about-paragraph-x), var(--about-paragraph-y)) !important;
}`.trim();
    }

    function updateCssOutput() {
      if (!cssOutput) return;
      const current = cssOutput.value || "";
      const objectCss = current.includes("/* Final About page object sizing/alignment CSS */")
        ? current.split("/* Final About page text CSS */")[0].trim()
        : "";
      cssOutput.value = `${objectCss}\n\n${buildTextCss()}`.trim();
    }

    function startDrag(e) {
      if (!document.body.classList.contains("about-text-drag-mode")) return;
      if (panel.contains(e.target)) return;

      const target = e.target.closest(".about-window-text h1, .about-window-text p");
      if (!target) return;

      e.preventDefault();
      e.stopPropagation();

      activeText = target;
      activeType = target.matches("h1") ? "name" : "paragraph";
      if (textSelect) textSelect.value = activeType;
      const cfg = map[activeType];

      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startX = cssVar(cfg.x, 0);
      startY = cssVar(cfg.y, 0);

      activeText.classList.add("is-dragging-text");
      window.addEventListener("pointermove", moveDrag);
      window.addEventListener("pointerup", stopDrag);
    }

    function moveDrag(e) {
      if (!activeText) return;
      const cfg = map[activeType];
      const nextX = Math.round(startX + e.clientX - startMouseX);
      const nextY = Math.round(startY + e.clientY - startMouseY);
      page.style.setProperty(cfg.x, `${nextX}px`);
      page.style.setProperty(cfg.y, `${nextY}px`);
      if (textX) textX.value = nextX;
      if (textY) textY.value = nextY;
      updateCssOutput();
    }

    function stopDrag() {
      if (activeText) activeText.classList.remove("is-dragging-text");
      activeText = null;
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", stopDrag);
      updateCssOutput();
    }

    if (textSelect) textSelect.addEventListener("change", loadSelectedText);
    [textEditor, textSize, textX, textY, textAlign].forEach(control => {
      if (!control) return;
      control.addEventListener("input", applyTextControls);
      control.addEventListener("change", applyTextControls);
    });

    if (textDragBtn) {
      textDragBtn.addEventListener("click", () => {
        document.body.classList.toggle("about-text-drag-mode");
        textDragBtn.textContent = document.body.classList.contains("about-text-drag-mode")
          ? "Finish Text Drag"
          : "Start Text Drag";
      });
    }

    document.addEventListener("pointerdown", startDrag);

    if (copyBtn) {
      copyBtn.addEventListener("click", () => updateCssOutput());
    }

    loadSelectedText();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutTextControls);
  } else {
    initAboutTextControls();
  }
  window.addEventListener("load", initAboutTextControls);
})();


// About page object sizing/alignment adjuster
(() => {
  function initAboutObjectAdjuster() {
    const page = document.querySelector(".about-card-page");
    const adjuster = document.querySelector(".about-object-adjuster");
    if (!page || !adjuster || adjuster.dataset.ready === "true") return;
    adjuster.dataset.ready = "true";

    const toggle = adjuster.querySelector(".about-adjuster-toggle");
    const select = document.getElementById("aboutObjectSelect");
    const scale = document.getElementById("aboutObjectScale");
    const x = document.getElementById("aboutObjectX");
    const y = document.getElementById("aboutObjectY");
    const width = document.getElementById("aboutWindowWidth");
    const height = document.getElementById("aboutWindowHeight");
    const dragStart = adjuster.querySelector(".about-drag-toggle");
    const dragFinish = adjuster.querySelector(".about-drag-finish");
    const copyBtn = adjuster.querySelector(".about-copy-css");
    const resetBtn = adjuster.querySelector(".about-reset-object");
    const output = document.getElementById("aboutCssOutput");

    const keys = {
      window: { x: "--about-window-x", y: "--about-window-y", scale: "--about-window-scale", selector: ".about-window-card" },
      card: { x: "--about-card-x", y: "--about-card-y", scale: "--about-card-scale", selector: ".about-id-card" },
      frame: { x: "--about-frame-x", y: "--about-frame-y", scale: "--about-frame-scale", selector: ".about-frame-shell" },
      paragraphWindow: { x: "--about-paragraph-window-x", y: "--about-paragraph-window-y", scale: "--about-paragraph-window-scale", selector: ".about-window-text", width: "--about-paragraph-window-width", height: "--about-paragraph-window-height" }
    };

    let activeEl = null;
    let activeKey = "window";
    let startMouseX = 0;
    let startMouseY = 0;
    let startX = 0;
    let startY = 0;

    function numVar(name, fallback = 0) {
      const inline = page.style.getPropertyValue(name);
      const value = inline || getComputedStyle(page).getPropertyValue(name);
      return parseFloat(value) || fallback;
    }

    function setSelected(key) {
      activeKey = key;
      select.value = key;
      adjuster.dataset.selectedObject = key;
      const config = keys[key];

      x.value = numVar(config.x, 0);
      y.value = numVar(config.y, 0);
      scale.value = numVar(config.scale, 1);

      if (width && config.width) width.value = numVar(config.width, 100);
      if (height && config.height) height.value = numVar(config.height, 100);

      document.querySelectorAll("[data-about-object], .about-window-text").forEach(el => el.classList.remove("is-selected-object"));
      const el = document.querySelector(config.selector);
      if (el) el.classList.add("is-selected-object");
      updateOutput();
    }

    function applySelected() {
      const config = keys[select.value];
      page.style.setProperty(config.x, `${x.value}px`);
      page.style.setProperty(config.y, `${y.value}px`);
      page.style.setProperty(config.scale, scale.value);
      if (config.width && width) page.style.setProperty(config.width, `${width.value}%`);
      if (config.height && height) page.style.setProperty(config.height, `${height.value}%`);
      setSelected(select.value);
    }

    function buildCSS() {
      return `/* Final About page object sizing/alignment CSS */
.about-card-page {
  --about-window-x: ${numVar("--about-window-x", 0)}px;
  --about-window-y: ${numVar("--about-window-y", 0)}px;
  --about-window-scale: ${numVar("--about-window-scale", 1)};
  --about-card-x: ${numVar("--about-card-x", 0)}px;
  --about-card-y: ${numVar("--about-card-y", 0)}px;
  --about-card-scale: ${numVar("--about-card-scale", 1)};
  --about-frame-x: ${numVar("--about-frame-x", 0)}px;
  --about-frame-y: ${numVar("--about-frame-y", 0)}px;
  --about-frame-scale: ${numVar("--about-frame-scale", 1)};
  --about-paragraph-window-x: ${numVar("--about-paragraph-window-x", 0)}px;
  --about-paragraph-window-y: ${numVar("--about-paragraph-window-y", 0)}px;
  --about-paragraph-window-scale: ${numVar("--about-paragraph-window-scale", 1)};
  --about-paragraph-window-width: ${numVar("--about-paragraph-window-width", 100)}%;
  --about-paragraph-window-height: ${numVar("--about-paragraph-window-height", 100)}%;
}`;
    }

    function updateOutput() {
      if (!output) return;
      const existing = output.value || "";
      const textCss = existing.includes("/* Final About page text CSS */")
        ? existing.slice(existing.indexOf("/* Final About page text CSS */")).trim()
        : "";
      output.value = `${buildCSS()}\n\n${textCss}`.trim();
    }

    function startDrag(e) {
      if (!document.body.classList.contains("about-drag-mode")) return;
      if (adjuster.contains(e.target)) return;

      let obj = null;
      let key = null;

      if (e.target.closest(".about-window-text")) {
        obj = document.querySelector(".about-window-text");
        key = "paragraphWindow";
      } else {
        obj = e.target.closest("[data-about-object]");
        key = obj ? obj.dataset.aboutObject : null;
      }

      if (!obj || !key || !keys[key]) return;

      e.preventDefault();
      const config = keys[key];
      setSelected(key);

      activeEl = obj;
      activeEl.classList.add("is-dragging-object");
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startX = numVar(config.x, 0);
      startY = numVar(config.y, 0);

      window.addEventListener("pointermove", moveDrag);
      window.addEventListener("pointerup", stopDrag);
    }

    function moveDrag(e) {
      if (!activeEl) return;
      const config = keys[activeKey];
      const nextX = Math.round(startX + (e.clientX - startMouseX));
      const nextY = Math.round(startY + (e.clientY - startMouseY));
      page.style.setProperty(config.x, `${nextX}px`);
      page.style.setProperty(config.y, `${nextY}px`);
      x.value = nextX;
      y.value = nextY;
      updateOutput();
    }

    function stopDrag() {
      if (activeEl) activeEl.classList.remove("is-dragging-object");
      activeEl = null;
      window.removeEventListener("pointermove", moveDrag);
      window.removeEventListener("pointerup", stopDrag);
      updateOutput();
    }

    toggle.addEventListener("click", () => {
      adjuster.classList.toggle("is-open");
      setSelected(select.value);
    });

    select.addEventListener("change", () => setSelected(select.value));
    [scale, x, y, width, height].forEach(input => {
      if (input) input.addEventListener("input", applySelected);
    });

    dragStart.addEventListener("click", () => {
      document.body.classList.add("about-drag-mode");
      setSelected(select.value);
    });

    dragFinish.addEventListener("click", () => {
      document.body.classList.remove("about-drag-mode");
      document.querySelectorAll("[data-about-object], .about-window-text").forEach(el => el.classList.remove("is-selected-object"));
      updateOutput();
    });

    resetBtn.addEventListener("click", () => {
      const config = keys[select.value];
      page.style.setProperty(config.x, "0px");
      page.style.setProperty(config.y, "0px");
      page.style.setProperty(config.scale, "1");
      if (config.width) page.style.setProperty(config.width, "100%");
      if (config.height) page.style.setProperty(config.height, "100%");
      setSelected(select.value);
    });

    copyBtn.addEventListener("click", async () => {
      updateOutput();
      if (!output) return;
      output.select();
      try {
        await navigator.clipboard.writeText(output.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = "Copy CSS", 1200);
      } catch {
        document.execCommand("copy");
      }
    });

    document.addEventListener("pointerdown", startDrag);
    setSelected("window");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutObjectAdjuster);
  } else {
    initAboutObjectAdjuster();
  }
  window.addEventListener("load", initAboutObjectAdjuster);
})();


// About page: unlimited smooth drag with natural spring-back on release
(() => {
  const card = document.querySelector(".about-id-card.elastic-3d-card");
  if (!card) return;

  let dragging = false;
  let pointerId = null;

  let startPointerX = 0;
  let startPointerY = 0;
  let startX = 0;
  let startY = 0;

  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;

  let vx = 0;
  let vy = 0;
  let previousX = 0;
  let previousY = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function updateCard() {
    const speedX = x - previousX;
    const speedY = y - previousY;

    const rotX = clamp((-y * 0.028) + (-speedY * 0.45), -24, 24);
    const rotY = clamp((x * 0.026) + (speedX * 0.45), -24, 24);
    const rotZ = clamp((x * 0.022) + (speedX * 0.55), -26, 26);

    card.style.setProperty("--card-free-x", `${x.toFixed(2)}px`);
    card.style.setProperty("--card-free-y", `${y.toFixed(2)}px`);
    card.style.setProperty("--card-free-rot-x", `${rotX.toFixed(2)}deg`);
    card.style.setProperty("--card-free-rot-y", `${rotY.toFixed(2)}deg`);
    card.style.setProperty("--card-free-rot-z", `${rotZ.toFixed(2)}deg`);

    previousX = x;
    previousY = y;
  }

  function animate() {
    if (dragging) {
      // smooth follow, not instant, so it feels like the reference
      const follow = 0.26;
      const nextX = x + (targetX - x) * follow;
      const nextY = y + (targetY - y) * follow;

      vx = nextX - x;
      vy = nextY - y;
      x = nextX;
      y = nextY;
    } else {
      // spring back to original place naturally
      const spring = 0.075;
      const friction = 0.82;

      vx += (0 - x) * spring;
      vy += (0 - y) * spring;
      vx *= friction;
      vy *= friction;

      x += vx;
      y += vy;

      if (Math.abs(x) < 0.03 && Math.abs(y) < 0.03 && Math.abs(vx) < 0.03 && Math.abs(vy) < 0.03) {
        x = 0;
        y = 0;
        vx = 0;
        vy = 0;
      }
    }

    updateCard();
    requestAnimationFrame(animate);
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return;

    // no clamp here: movement is free across the screen
    targetX = startX + (event.clientX - startPointerX);
    targetY = startY + (event.clientY - startPointerY);
  }

  function release(event) {
    if (!dragging) return;
    if (event && event.pointerId !== undefined && event.pointerId !== pointerId) return;

    dragging = false;
    card.classList.remove("is-dragging");

    // preserve release velocity for a smoother return
    vx *= 1.25;
    vy *= 1.25;

    try { card.releasePointerCapture?.(pointerId); } catch {}
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    pointerId = null;
  }

  card.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    dragging = true;
    pointerId = event.pointerId;
    card.classList.add("is-dragging");

    startPointerX = event.clientX;
    startPointerY = event.clientY;
    startX = x;
    startY = y;
    targetX = x;
    targetY = y;

    vx = 0;
    vy = 0;

    card.setPointerCapture?.(pointerId);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    event.preventDefault();
  });

  card.addEventListener("lostpointercapture", release);

  animate();
})();


// Petalia 4-page racing navigation
(() => {
  const page = document.querySelector(".petalia-race-page");
  if (!page) return;

  const car = document.querySelector(".petalia-car-btn");
  const screens = [...document.querySelectorAll(".petalia-project-screen")];
  const dots = [...document.querySelectorAll(".petalia-road-dots span")];
  const hint = document.querySelector(".petalia-click-hint");

  if (!car || !screens.length) return;

  let current = 0;
  // Start from the far-right edge and finish at the far-left edge.
  const fallbackPositions = ["88.2vw", "59.6vw", "31vw", "1.8vw"];
  const positions = (page.dataset.racePositions || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!positions.length) {
    if (screens.length === 2) {
      positions.push("88.2vw", "1.8vw");
    } else {
      positions.push(...fallbackPositions.slice(0, Math.max(screens.length, 1)));
      while (positions.length < screens.length) {
        positions.push(fallbackPositions[fallbackPositions.length - 1]);
      }
    }
  }

  function showStep(index) {
    screens.forEach((screen, i) => screen.classList.toggle("is-active", i === index));

    // Light the progress dots from right to left to match the car direction.
    const activeDotIndex = dots.length - 1 - index;
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === activeDotIndex);
      dot.classList.toggle("is-trail", i > activeDotIndex);
    });

    car.style.setProperty("--race-step-x", positions[index]);

    if (hint && index > 0) {
      hint.classList.add("is-hidden");
    }

    car.classList.add("is-driving");
    window.clearTimeout(car._driveTimer);
    car._driveTimer = window.setTimeout(() => car.classList.remove("is-driving"), 950);

    if (hint && index > 0) {
      hint.style.opacity = "0";
      hint.style.transform = "translateY(-10px)";
    }
  }

  car.addEventListener("click", () => {
    current = (current + 1) % screens.length;
    showStep(current);
  });


  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => {
      current = dots.length - 1 - dotIndex;
      showStep(current);

      if (hint) {
        hint.classList.add("is-hidden");
      }
    });
  });

  // keyboard support
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      current = Math.min(current + 1, screens.length - 1);
      showStep(current);
    }
    if (event.key === "ArrowLeft") {
      current = Math.max(current - 1, 0);
      showStep(current);
    }
  });

  showStep(0);
})();


// Petalia hint position/rotation adjuster UI
(function () {
  function initPetaliaHintAdjuster() {
    const page = document.querySelector(".petalia-race-page");
    const hint = document.querySelector(".petalia-click-hint");
    const text = document.querySelector(".petalia-click-hint span");
    const arrow = document.querySelector(".petalia-curved-arrow");
    const ui = document.querySelector(".petalia-hint-adjuster");

    if (!page || !hint || !text || !arrow || !ui) return;
    if (ui.dataset.ready === "true") return;
    ui.dataset.ready = "true";

    const toggle = ui.querySelector(".petalia-adjuster-toggle");
    const select = document.getElementById("petaliaHintItem");
    const x = document.getElementById("petaliaHintX");
    const y = document.getElementById("petaliaHintY");
    const size = document.getElementById("petaliaHintSize");
    const rotate = document.getElementById("petaliaArrowRotate");
    const flip = document.getElementById("petaliaArrowFlipX");
    const dragBtn = ui.querySelector(".petalia-hint-drag-toggle");
    const resetBtn = ui.querySelector(".petalia-hint-reset");
    const copyBtn = ui.querySelector(".petalia-hint-copy");
    const output = document.getElementById("petaliaHintCssOutput");

    if (!toggle || !select || !x || !y || !size || !rotate || !flip || !dragBtn || !resetBtn || !copyBtn || !output) return;

    const map = {
      group: { el: hint, x: "--petalia-hint-x", y: "--petalia-hint-y", scale: "--petalia-hint-scale" },
      text: { el: text, x: "--petalia-text-x", y: "--petalia-text-y", scale: "--petalia-text-scale" },
      arrow: { el: arrow, x: "--petalia-arrow-x", y: "--petalia-arrow-y", scale: "--petalia-arrow-scale", rotate: "--petalia-arrow-rotate", flip: "--petalia-arrow-flip-x" }
    };

    let active = select.value || "group";
    let dragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startX = 0;
    let startY = 0;

    function numVar(name, fallback) {
      const inline = page.style.getPropertyValue(name);
      const computed = getComputedStyle(page).getPropertyValue(name);
      const value = parseFloat(inline || computed);
      return Number.isFinite(value) ? value : fallback;
    }

    function setPx(name, value) {
      page.style.setProperty(name, `${value}px`);
    }

    function buildCSS() {
      return `/* Final Petalia hint CSS */
body.petalia-race-page {
  --petalia-hint-x: ${numVar("--petalia-hint-x", 0)}px;
  --petalia-hint-y: ${numVar("--petalia-hint-y", 0)}px;
  --petalia-hint-scale: ${numVar("--petalia-hint-scale", 1)};
  --petalia-text-x: ${numVar("--petalia-text-x", 0)}px;
  --petalia-text-y: ${numVar("--petalia-text-y", 0)}px;
  --petalia-text-scale: ${numVar("--petalia-text-scale", 1)};
  --petalia-arrow-x: ${numVar("--petalia-arrow-x", 0)}px;
  --petalia-arrow-y: ${numVar("--petalia-arrow-y", 0)}px;
  --petalia-arrow-scale: ${numVar("--petalia-arrow-scale", 1)};
  --petalia-arrow-rotate: ${numVar("--petalia-arrow-rotate", 0)}deg;
  --petalia-arrow-flip-x: ${numVar("--petalia-arrow-flip-x", 1)};
}`;
    }

    function updateOutput() {
      output.value = buildCSS();
    }

    function setSelected(item) {
      active = item;
      select.value = item;
      ui.dataset.selected = item;

      const cfg = map[item];
      x.value = numVar(cfg.x, 0);
      y.value = numVar(cfg.y, 0);
      size.value = numVar(cfg.scale, 1);

      if (item === "arrow") {
        rotate.value = numVar(cfg.rotate, 0);
        flip.value = String(numVar(cfg.flip, 1));
      }

      [hint, text, arrow].forEach((el) => el.classList.remove("is-selected-hint"));
      cfg.el.classList.add("is-selected-hint");
      updateOutput();
    }

    function applyControls() {
      const cfg = map[active];
      setPx(cfg.x, x.value);
      setPx(cfg.y, y.value);
      page.style.setProperty(cfg.scale, size.value);

      if (active === "arrow") {
        page.style.setProperty(cfg.rotate, `${rotate.value}deg`);
        page.style.setProperty(cfg.flip, flip.value);
      }

      updateOutput();
    }

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      ui.classList.toggle("is-open");
      setSelected(select.value || "group");
    });

    select.addEventListener("change", function () {
      setSelected(select.value);
    });

    [x, y, size, rotate, flip].forEach((control) => {
      control.addEventListener("input", applyControls);
      control.addEventListener("change", applyControls);
    });

    function pickItem(target) {
      if (target.closest(".petalia-curved-arrow")) return "arrow";
      if (target.closest(".petalia-click-hint span")) return "text";
      if (target.closest(".petalia-click-hint")) return "group";
      return null;
    }

    function onPointerDown(event) {
      if (!document.body.classList.contains("petalia-hint-drag-mode")) return;
      if (ui.contains(event.target)) return;

      const item = pickItem(event.target);
      if (!item) return;

      event.preventDefault();
      event.stopPropagation();

      setSelected(item);
      dragging = true;
      startMouseX = event.clientX;
      startMouseY = event.clientY;
      startX = numVar(map[item].x, 0);
      startY = numVar(map[item].y, 0);

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }

    function onPointerMove(event) {
      if (!dragging) return;
      const nextX = Math.round(startX + event.clientX - startMouseX);
      const nextY = Math.round(startY + event.clientY - startMouseY);
      setPx(map[active].x, nextX);
      setPx(map[active].y, nextY);
      x.value = nextX;
      y.value = nextY;
      updateOutput();
    }

    function onPointerUp() {
      dragging = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      updateOutput();
    }

    dragBtn.addEventListener("click", function () {
      document.body.classList.toggle("petalia-hint-drag-mode");
      dragBtn.textContent = document.body.classList.contains("petalia-hint-drag-mode") ? "Finish Drag Mode" : "Start Drag Mode";
      setSelected(select.value || "group");
    });

    resetBtn.addEventListener("click", function () {
      const cfg = map[active];
      setPx(cfg.x, 0);
      setPx(cfg.y, 0);
      page.style.setProperty(cfg.scale, "1");

      if (active === "arrow") {
        page.style.setProperty(cfg.rotate, "0deg");
        page.style.setProperty(cfg.flip, "1");
      }

      setSelected(active);
    });

    copyBtn.addEventListener("click", async function () {
      updateOutput();
      output.select();
      try {
        await navigator.clipboard.writeText(output.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy CSS"), 1100);
      } catch (error) {
        document.execCommand("copy");
      }
    });

    document.addEventListener("pointerdown", onPointerDown);
    setSelected("group");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPetaliaHintAdjuster);
  } else {
    initPetaliaHintAdjuster();
  }
  window.addEventListener("load", initPetaliaHintAdjuster);
})();

// Musee d'Orsay 4-page race adjuster: image/title X, Y, scale, width and title size
(() => {
  const page = document.querySelector('.musee-four-stage-page');
  const ui = document.querySelector('.musee-adjuster');
  if (!page || !ui || ui.dataset.ready === 'true') return;
  ui.dataset.ready = 'true';

  const toggle = ui.querySelector('.musee-adjust-toggle');
  const panel = ui.querySelector('.musee-adjust-panel');
  const stageSelect = document.getElementById('museeAdjustStage');
  const itemSelect = document.getElementById('museeAdjustItem');
  const xInput = document.getElementById('museeAdjustX');
  const yInput = document.getElementById('museeAdjustY');
  const scaleInput = document.getElementById('museeAdjustScale');
  const widthInput = document.getElementById('museeAdjustWidth');
  const fontInput = document.getElementById('museeAdjustFont');
  const resetBtn = ui.querySelector('.musee-adjust-reset');
  const copyBtn = ui.querySelector('.musee-adjust-copy');
  const output = document.getElementById('museeAdjustOutput');

  if (!toggle || !panel || !stageSelect || !itemSelect || !xInput || !yInput || !scaleInput || !widthInput || !fontInput || !resetBtn || !copyBtn || !output) return;

  const storageKey = 'museeRaceAdjustValues_v2';
  const defaults = {
    'image-1': { x: 0, y: -143, scale: 0.9, width: 1280, font: 56 },
    'title-1': { x: 0, y: 0, scale: 1, width: 1280, font: 56 },
    'image-2': { x: 0, y: -140, scale: 0.9, width: 1152, font: 56 },
    'title-2': { x: 0, y: 0, scale: 1, width: 1280, font: 56 },
    'image-3': { x: 0, y: -170, scale: 0.77, width: 1280, font: 56 },
    'title-3': { x: 0, y: 0, scale: 1, width: 1280, font: 56 },
    'image-4': { x: 0, y: -160, scale: 0.9, width: 1280, font: 56 },
    'title-4': { x: 0, y: 0, scale: 1, width: 1280, font: 56 }
  };

  function loadValues() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return { ...defaults, ...saved };
    } catch (_) {
      return { ...defaults };
    }
  }

  let values = loadValues();

  function targetKey() {
    return `${itemSelect.value}-${stageSelect.value}`;
  }

  function targetElement(key = targetKey()) {
    return document.querySelector(`[data-musee-edit="${key}"]`);
  }

  function applyOne(key) {
    const el = targetElement(key);
    const v = values[key] || defaults[key];
    if (!el || !v) return;
    el.style.setProperty('--musee-x', `${v.x}px`);
    el.style.setProperty('--musee-y', `${v.y}px`);
    el.style.setProperty('--musee-scale', `${v.scale}`);
    if (key.startsWith('image-')) {
      el.style.setProperty('--musee-width', `${v.width}px`);
    }
    if (key.startsWith('title-')) {
      el.style.setProperty('--musee-font', `${v.font}px`);
    }
  }

  function applyAll() {
    Object.keys(defaults).forEach(applyOne);
  }

  function saveValues() {
    localStorage.setItem(storageKey, JSON.stringify(values));
  }

  function syncControls() {
    const key = targetKey();
    const v = values[key] || defaults[key];
    xInput.value = v.x;
    yInput.value = v.y;
    scaleInput.value = v.scale;
    widthInput.value = v.width;
    fontInput.value = v.font;
    ui.dataset.item = itemSelect.value;

    document.querySelectorAll('[data-musee-edit]').forEach((el) => el.classList.remove('musee-selected'));
    targetElement(key)?.classList.add('musee-selected');
  }

  function updateCurrent() {
    const key = targetKey();
    values[key] = {
      ...(values[key] || defaults[key]),
      x: Number(xInput.value),
      y: Number(yInput.value),
      scale: Number(scaleInput.value),
      width: Number(widthInput.value),
      font: Number(fontInput.value)
    };
    applyOne(key);
    saveValues();
  }

  function showSelectedStage() {
    const stageIndex = Number(stageSelect.value) - 1;
    document.querySelectorAll('.musee-stage-screen').forEach((screen, index) => {
      screen.classList.toggle('is-active', index === stageIndex);
    });
    const dots = [...document.querySelectorAll('.musee-four-stage-page .petalia-road-dots span')];
    const activeDotIndex = dots.length - 1 - stageIndex;
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeDotIndex);
      dot.classList.toggle('is-trail', index > activeDotIndex);
    });
    const car = document.querySelector('.musee-four-stage-page .petalia-car-btn');
    const positions = (page.dataset.racePositions || '88.2vw,59.6vw,31vw,1.8vw').split(',').map((pos) => pos.trim());
    if (car && positions[stageIndex]) car.style.setProperty('--race-step-x', positions[stageIndex]);
  }

  toggle.addEventListener('click', () => {
    ui.classList.toggle('is-open');
    page.classList.toggle('musee-adjusting', ui.classList.contains('is-open'));
    syncControls();
  });

  stageSelect.addEventListener('change', () => {
    showSelectedStage();
    syncControls();
  });

  itemSelect.addEventListener('change', syncControls);

  [xInput, yInput, scaleInput, widthInput, fontInput].forEach((input) => {
    input.addEventListener('input', updateCurrent);
  });

  resetBtn.addEventListener('click', () => {
    const key = targetKey();
    values[key] = { ...defaults[key] };
    applyOne(key);
    saveValues();
    syncControls();
  });

  copyBtn.addEventListener('click', async () => {
    const text = JSON.stringify(values, null, 2);
    output.value = text;
    try {
      await navigator.clipboard?.writeText(text);
    } catch (_) {
      // Text remains in the textarea if clipboard permissions are blocked.
    }
  });

  applyAll();
  syncControls();
})();






