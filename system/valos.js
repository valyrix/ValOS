// ValOS Simple Engine
// Objectif : rester facile à lire, modifier et améliorer.

let calcValue = "";

function toggleMenu() {
  document.getElementById("menu").classList.toggle("hidden");
}

async function openApp(path) {
  document.getElementById("menu")?.classList.add("hidden");

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("App introuvable");
    const source = await response.text();
    renderValMark(source);
  } catch (error) {
    renderHTML(`<div class="val-card"><h2>Erreur</h2><p>Impossible d'ouvrir : ${escapeHTML(path)}</p></div>`);
  }
}

function renderValMark(source) {
  const app = parseValMark(source);

  const content = app.blocks.map(block => {
    const renderer = ValBlocks[block.type];
    return renderer ? renderer(block.props) : unknownBlock(block.type);
  }).join("");

  renderHTML(`
    <section class="val-page">
      <h1>${escapeHTML(app.name)}</h1>
      ${content}
    </section>
  `);
}

function renderHTML(html) {
  document.getElementById("app").innerHTML = html;
}

function parseValMark(source) {
  const app = { name: "Application", blocks: [] };
  const lines = source.split("\n");
  let currentBlock = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    if (line.startsWith("@App")) {
      app.name = getQuotedText(line) || "Application";
      continue;
    }

    if (line.startsWith("#")) {
      currentBlock = { type: line.slice(1).trim(), props: {} };
      app.blocks.push(currentBlock);
      continue;
    }

    if (currentBlock && line.includes(":")) {
      const index = line.indexOf(":");
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      currentBlock.props[key] = cleanValue(value);
    }
  }

  return app;
}

const ValBlocks = {
  Hero(props) {
    return `
      <div class="val-hero">
        <h2>${escapeHTML(props.title || "Titre")}</h2>
        <p>${escapeHTML(props.text || "")}</p>
      </div>
    `;
  },

  Text(props) {
    return `<p class="val-text">${escapeHTML(props.value || "")}</p>`;
  },

  Card(props) {
    return `
      <div class="val-card">
        <h2>${escapeHTML(props.title || "Carte")}</h2>
        <p>${escapeHTML(props.text || "")}</p>
      </div>
    `;
  },

  Button(props) {
    return `
      <button onclick="runAction('${escapeAttr(props.action || "")}')">
        ${escapeHTML(props.text || "Bouton")}
      </button>
    `;
  },

  Calculator() {
    return `
      <div class="val-card">
        <div id="calc-display" class="calc-display">0</div>
        <div class="calc-buttons">
          ${["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].map(key => `
            <button onclick="calcPress('${key}')">${key}</button>
          `).join("")}
          <button onclick="calcClear()">Effacer</button>
        </div>
      </div>
    `;
  },

  Editor() {
    const starter = `@App "Nouvelle app"\n\n#Hero\n  title: "Mon app"\n  text: "Créée avec ValOS"\n\n#Text\n  value: "Bonjour ValMark"`;

    return `
      <div class="val-editor">
        <h2>Créer une app ValMark</h2>
        <textarea id="editor-source">${escapeHTML(starter)}</textarea>
        <div class="val-actions">
          <button onclick="previewEditorApp()">Prévisualiser</button>
          <button onclick="downloadEditorApp()">Télécharger .val</button>
        </div>
        <div id="editor-preview"></div>
      </div>
    `;
  }
};

function runAction(action) {
  if (!action) return;

  if (action.startsWith("open(")) {
    const path = getQuotedText(action);
    if (path) openApp(path);
    return;
  }

  if (action.startsWith("alert(")) {
    alert(getQuotedText(action) || "ValOS");
    return;
  }

  alert("Action inconnue : " + action);
}

function calcPress(key) {
  if (key === "=") {
    calcCalculate();
    return;
  }

  calcValue += key;
  updateCalcDisplay();
}

function calcCalculate() {
  try {
    if (!/^[0-9+\-*/. ()]+$/.test(calcValue)) throw new Error("Expression invalide");
    calcValue = String(Function(`"use strict"; return (${calcValue})`)());
  } catch (error) {
    calcValue = "Erreur";
  }

  updateCalcDisplay();
}

function calcClear() {
  calcValue = "";
  updateCalcDisplay();
}

function updateCalcDisplay() {
  const display = document.getElementById("calc-display");
  if (display) display.textContent = calcValue || "0";
}

function previewEditorApp() {
  const source = document.getElementById("editor-source").value;
  const app = parseValMark(source);
  const html = app.blocks.map(block => {
    const renderer = ValBlocks[block.type];
    return renderer ? renderer(block.props) : unknownBlock(block.type);
  }).join("");

  document.getElementById("editor-preview").innerHTML = `
    <div class="val-card">
      <h2>${escapeHTML(app.name)}</h2>
      ${html}
    </div>
  `;
}

function downloadEditorApp() {
  const source = document.getElementById("editor-source").value;
  const blob = new Blob([source], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "my-app.val";
  link.click();
  URL.revokeObjectURL(url);
}

function unknownBlock(type) {
  return `<div class="val-card"><strong>ValBlock inconnu :</strong> ${escapeHTML(type)}</div>`;
}

function cleanValue(value) {
  return value.replace(/^"|"$/g, "");
}

function getQuotedText(value) {
  const match = value.match(/"(.*?)"/);
  return match ? match[1] : null;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

openApp("apps/home.val");
