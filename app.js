// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  storageKeys: {
    styles: 'gdoc_md_converter_styles',
    syntaxTheme: 'gdoc_syntax_theme',
  },
  defaults: {
    syntaxTheme: 'atom-one-dark.min.css',
    hljsFallbackColor: 'rgb(171, 178, 191)',   // One Dark base text
    hljsFallbackBg: '#282c34',                  // One Dark background
  },
  codeBlock: {
    tableBorder: '1px solid #444c56',
    cellPadding: '0.5rem 0.6rem',
    lineHeight: '1.5',
  },
  copy: {
    cloneWidth: '800px',
  },
  toast: {
    durationMs: 3000,
  },
};

// Default style configurations (user-adjustable via sidebar)
const DEFAULT_STYLES = {
  body: {
    fontFamily: 'Arial',
    fontSize: '13',
    color: '#333333',
    lineHeight: '1.5',
  },
  h1: {
    fontFamily: 'Arial',
    fontSize: '17',
    color: '#0f172a',
    marginTop: '1.2',
    marginBottom: '0.4',
  },
  h2: {
    fontFamily: 'Arial',
    fontSize: '15',
    color: '#1e293b',
    marginTop: '1.2',
    marginBottom: '0.4',
  },
  h3: {
    fontFamily: 'Arial',
    fontSize: '14',
    color: '#334155',
    marginTop: '1.2',
    marginBottom: '0.4',
  },
  inlineCode: {
    fontFamily: 'Courier New',
    fontSize: '10.5',
    color: '#505050',
    backgroundColor: '#e0e0e0',
  },
  codeBlock: {
    fontFamily: 'Courier New',
    fontSize: '10.5',
    padding: '1.0',
    borderRadius: '6',
  },
  blockquote: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    textColor: '#1e3a8a',
  },
  link: {
    color: '#2563eb',
    underline: true,
  },
};

// CSS properties to inline when copying for Google Docs compatibility
const INLINE_PROPERTIES = [
  'font-family', 'font-size', 'color', 'background-color',
  'font-weight', 'font-style',
  'text-decoration-line', 'text-decoration',
  'line-height',
  'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'border-left-width', 'border-left-style', 'border-left-color',
  'border-top-width', 'border-top-style', 'border-top-color',
  'border-right-width', 'border-right-style', 'border-right-color',
  'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
  'border-radius',
];

let styles = {};

// ============================================================================
// Style Management (load / save / reset / populate / bind)
// ============================================================================

function loadStyles() {
  const saved = localStorage.getItem(CONFIG.storageKeys.styles);
  if (saved) {
    try {
      styles = mergeDeep({}, DEFAULT_STYLES, JSON.parse(saved));
    } catch {
      styles = structuredClone(DEFAULT_STYLES);
    }
  } else {
    styles = structuredClone(DEFAULT_STYLES);
  }
}

function saveStyles() {
  localStorage.setItem(CONFIG.storageKeys.styles, JSON.stringify(styles));
}

function resetStyles() {
  styles = structuredClone(DEFAULT_STYLES);
  saveStyles();
  populateInputs();
  updateDynamicStyles();
  renderMarkdown();
  showToast('Đã khôi phục cài đặt gốc!');
}

// Deep merge helper
function mergeDeep(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (!isObject(target[key])) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// ============================================================================
// UI ↔ Style binding (populate inputs, listen for changes)
// ============================================================================

// Mapping: [inputId, getter, setter]
function getStyleBindings() {
  return [
    // Body
    ['body-font',    () => styles.body.fontFamily,             v => styles.body.fontFamily = v],
    ['body-size',    () => styles.body.fontSize,               v => styles.body.fontSize = v],
    ['body-color',   () => styles.body.color,                  v => styles.body.color = v],
    ['body-height',  () => styles.body.lineHeight,             v => styles.body.lineHeight = v],
    // H1
    ['h1-font',      () => styles.h1.fontFamily,               v => styles.h1.fontFamily = v],
    ['h1-size',      () => styles.h1.fontSize,                 v => styles.h1.fontSize = v],
    ['h1-color',     () => styles.h1.color,                    v => styles.h1.color = v],
    // H2
    ['h2-font',      () => styles.h2.fontFamily,               v => styles.h2.fontFamily = v],
    ['h2-size',      () => styles.h2.fontSize,                 v => styles.h2.fontSize = v],
    ['h2-color',     () => styles.h2.color,                    v => styles.h2.color = v],
    // H3
    ['h3-font',      () => styles.h3.fontFamily,               v => styles.h3.fontFamily = v],
    ['h3-size',      () => styles.h3.fontSize,                 v => styles.h3.fontSize = v],
    ['h3-color',     () => styles.h3.color,                    v => styles.h3.color = v],
    // Inline Code
    ['inline-font',  () => styles.inlineCode.fontFamily,       v => styles.inlineCode.fontFamily = v],
    ['inline-color', () => styles.inlineCode.color,            v => styles.inlineCode.color = v],
    ['inline-bg',    () => styles.inlineCode.backgroundColor,  v => styles.inlineCode.backgroundColor = v],
    // Code Block
    ['codeblock-font',    () => styles.codeBlock.fontFamily,   v => styles.codeBlock.fontFamily = v],
    ['codeblock-padding', () => styles.codeBlock.padding,      v => styles.codeBlock.padding = v],
    ['codeblock-radius',  () => styles.codeBlock.borderRadius, v => styles.codeBlock.borderRadius = v],
    // Blockquote
    ['quote-border', () => styles.blockquote.borderColor,      v => styles.blockquote.borderColor = v],
    ['quote-bg',     () => styles.blockquote.backgroundColor,  v => styles.blockquote.backgroundColor = v],
    ['quote-color',  () => styles.blockquote.textColor,        v => styles.blockquote.textColor = v],
    // Link
    ['link-color',     () => styles.link.color,                v => styles.link.color = v],
    ['link-underline', () => styles.link.underline,            v => styles.link.underline = v],
  ];
}

function populateInputs() {
  for (const [id, getter] of getStyleBindings()) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = getter();
    } else {
      el.value = getter();
    }
  }
}

function bindEvents() {
  // Bind all style inputs
  for (const [id, , setter] of getStyleBindings()) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', (e) => {
      setter(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
      updateDynamicStyles();
      saveStyles();
    });
  }

  // Markdown textarea
  document.getElementById('markdown-input')
    ?.addEventListener('input', renderMarkdown);

  // Syntax highlighting theme selection
  const themeSelect = document.getElementById('syntax-theme-select');
  if (themeSelect) {
    const savedTheme = localStorage.getItem(CONFIG.storageKeys.syntaxTheme)
      || CONFIG.defaults.syntaxTheme;
    themeSelect.value = savedTheme;
    document.getElementById('syntax-theme-link').href = savedTheme;

    themeSelect.addEventListener('change', (e) => {
      document.getElementById('syntax-theme-link').href = e.target.value;
      localStorage.setItem(CONFIG.storageKeys.syntaxTheme, e.target.value);
      setTimeout(renderMarkdown, 100);
    });
  }

  // Action buttons
  document.getElementById('copy-btn')
    ?.addEventListener('click', performCopy);
  document.getElementById('copy-html-btn')
    ?.addEventListener('click', performCopyHtml);
  document.getElementById('download-btn')
    ?.addEventListener('click', performDownloadHtml);
  document.getElementById('reset-btn')
    ?.addEventListener('click', resetStyles);
}

// ============================================================================
// Dynamic CSS (preview styling driven by user settings)
// ============================================================================

function updateDynamicStyles() {
  let tag = document.getElementById('dynamic-user-styles');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'dynamic-user-styles';
    document.head.appendChild(tag);
  }

  tag.innerHTML = `
    .gdoc-page {
      font-family: "${styles.body.fontFamily}", sans-serif;
      font-size: ${styles.body.fontSize}pt;
      color: ${styles.body.color};
      line-height: ${styles.body.lineHeight};
    }
    .gdoc-page h1 {
      font-family: "${styles.h1.fontFamily}", sans-serif;
      font-size: ${styles.h1.fontSize}pt;
      color: ${styles.h1.color};
      margin-top: ${styles.h1.marginTop}em;
      margin-bottom: ${styles.h1.marginBottom}em;
    }
    .gdoc-page h2 {
      font-family: "${styles.h2.fontFamily}", sans-serif;
      font-size: ${styles.h2.fontSize}pt;
      color: ${styles.h2.color};
      margin-top: ${styles.h2.marginTop}em;
      margin-bottom: ${styles.h2.marginBottom}em;
    }
    .gdoc-page h3 {
      font-family: "${styles.h3.fontFamily}", sans-serif;
      font-size: ${styles.h3.fontSize}pt;
      color: ${styles.h3.color};
      margin-top: ${styles.h3.marginTop}em;
      margin-bottom: ${styles.h3.marginBottom}em;
    }
    .gdoc-page code {
      font-family: "${styles.inlineCode.fontFamily}", monospace;
      color: ${styles.inlineCode.color};
      background-color: ${styles.inlineCode.backgroundColor};
    }
    .gdoc-page blockquote {
      border-left: 4px solid ${styles.blockquote.borderColor} !important;
      background-color: ${styles.blockquote.backgroundColor} !important;
      color: ${styles.blockquote.textColor} !important;
      padding: 0.8rem 1rem !important;
      margin: 1.5em 0 !important;
      font-style: italic;
    }
    .gdoc-page a {
      color: ${styles.link.color};
      text-decoration: ${styles.link.underline ? 'underline' : 'none'};
    }
  `;
}

// ============================================================================
// Code Block Processing (highlight → inline colors → line splitting)
// ============================================================================

/**
 * Read the hljs theme's base text color via a temporary off-screen element.
 * This bypasses the .gdoc-page code { color } CSS override.
 */
function getHljsBaseColor() {
  const temp = document.createElement('code');
  temp.className = 'hljs';
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  const color = window.getComputedStyle(temp).color || CONFIG.defaults.hljsFallbackColor;
  document.body.removeChild(temp);
  return color;
}

/**
 * Read the hljs theme's background color via a temporary off-screen element.
 */
function getHljsBaseBg() {
  const temp = document.createElement('code');
  temp.className = 'hljs';
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  const bg = window.getComputedStyle(temp).backgroundColor || CONFIG.defaults.hljsFallbackBg;
  document.body.removeChild(temp);
  return bg;
}

/**
 * Walk all child elements and text nodes inside a <code> element,
 * resolving their computed CSS colors into inline style attributes.
 * This is required because Google Docs ignores CSS classes.
 */
function inlineResolveColors(codeElement, baseColor) {
  // Override .gdoc-page code { color } on the element itself
  codeElement.style.color = baseColor;

  // Resolve color/weight/style for every highlighted span
  for (const span of codeElement.querySelectorAll('*')) {
    const cs = window.getComputedStyle(span);
    let s = `color: ${cs.color};`;
    if (cs.fontWeight !== '400' && cs.fontWeight !== 'normal') {
      s += ` font-weight: ${cs.fontWeight};`;
    }
    if (cs.fontStyle !== 'normal') {
      s += ` font-style: ${cs.fontStyle};`;
    }
    span.setAttribute('style', s);
  }

  // Wrap bare text nodes (not inside any span) with the base color
  for (const node of Array.from(codeElement.childNodes)) {
    if (node.nodeType === 3 && node.textContent.length > 0) {
      const span = document.createElement('span');
      span.style.color = baseColor;
      span.textContent = node.textContent;
      codeElement.replaceChild(span, node);
    }
  }
}

/**
 * Convert leading spaces in an HTML line to &nbsp; so that indentation
 * survives pasting into Google Docs / Quill (which strip white-space:pre).
 *
 * Strategy: find text content at the start of the line, count leading spaces,
 * replace them with &nbsp; in the actual HTML spans.
 */
function preserveLeadingSpaces(lineHtml) {
  // Quick bail: if no leading space, nothing to do
  // We need to check the *text* content, not the HTML tags
  const tmp = document.createElement('span');
  tmp.innerHTML = lineHtml;
  const text = tmp.textContent;

  if (!text || text[0] !== ' ') return lineHtml;

  // Count leading spaces in the text
  let leadingCount = 0;
  while (leadingCount < text.length && text[leadingCount] === ' ') {
    leadingCount++;
  }

  // Now walk through the HTML and replace the first `leadingCount` space chars
  // with &nbsp; inside each span/text node
  let spacesReplaced = 0;

  function replaceInNode(node) {
    if (spacesReplaced >= leadingCount) return;

    if (node.nodeType === 3) {
      // Text node
      let t = node.textContent;
      let newText = '';
      for (let i = 0; i < t.length; i++) {
        if (spacesReplaced < leadingCount && t[i] === ' ') {
          newText += '\u00A0'; // &nbsp; character
          spacesReplaced++;
        } else {
          newText += t.substring(i);
          break;
        }
      }
      node.textContent = newText;
    } else if (node.nodeType === 1) {
      for (const child of Array.from(node.childNodes)) {
        replaceInNode(child);
        if (spacesReplaced >= leadingCount) break;
      }
    }
  }

  replaceInNode(tmp);
  return tmp.innerHTML;
}

/**
 * Split highlighted code into per-line <p> tags for Google Docs compatibility.
 * - Uses innerHTML.split('\n') (safe because hljs tokens don't cross lines).
 * - Converts leading spaces to &nbsp; so indentation survives paste.
 * - white-space:pre handles remaining spaces for the live preview.
 */
function codeHtmlToLinePs(codeElement, fontFamily, fontSize, baseColor) {
  const htmlLines = codeElement.innerHTML.split('\n');

  const lineStyle = [
    'margin: 0',
    'padding: 0',
    `font-family: '${fontFamily}', monospace`,
    `font-size: ${fontSize}pt`,
    `line-height: ${CONFIG.codeBlock.lineHeight}`,
    `color: ${baseColor}`,
    'white-space: pre',
  ].join('; ') + ';';

  // Use a single <p> with <br> between lines instead of multiple <p> tags.
  // Google Docs adds its own paragraph spacing between <p> tags, causing
  // excessive vertical spacing in code blocks. <br> avoids this issue.
  const lineContents = htmlLines.map(html => {
    if (html.trim().length === 0) {
      return '\u00A0'; // &nbsp; for empty lines
    }
    return preserveLeadingSpaces(html);
  });

  return `<p style="${lineStyle}">${lineContents.join('<br>')}</p>`;
}

// ============================================================================
// Markdown Rendering
// ============================================================================

/**
 * Post-process lists that contain code-block tables.
 *
 * Google Docs cannot handle <table> elements inside <li> — it corrupts the
 * list numbering and indentation.  This function "explodes" such lists:
 *
 *   <ol>                              <ol>
 *     <li>plain</li>                    <li>plain</li>
 *     <li>                            </ol>
 *       text                          <p>6. text</p>
 *       <table>…</table>    →         <table>…</table>
 *       more text                     <p>more text</p>
 *     </li>                           <ol start="7">
 *     <li>next</li>                     <li>next</li>
 *   </ol>                             </ol>
 *
 * Plain items (no table inside) stay in the list; items with tables are
 * pulled out as standalone paragraphs between two list segments.
 */
function flattenListsWithTables(container) {
  for (const list of Array.from(container.querySelectorAll('ol, ul'))) {
    // Skip nested lists — we only process top-level lists.
    // (Nested lists inside an <li> are handled when we process that <li>'s
    // content below.)
    if (list.parentElement.tagName === 'LI') continue;

    const items = Array.from(list.children).filter(c => c.tagName === 'LI');
    const hasTableInAnyItem = items.some(li => li.querySelector('.gdoc-code-table'));
    if (!hasTableInAnyItem) continue;

    const isOrdered = list.tagName === 'OL';
    let startNum = parseInt(list.getAttribute('start'), 10) || 1;
    const fragment = document.createDocumentFragment();

    // Accumulate consecutive plain items into one list segment
    let pendingPlainItems = [];

    function flushPlainItems() {
      if (pendingPlainItems.length === 0) return;
      const seg = document.createElement(list.tagName);
      if (isOrdered) seg.setAttribute('start', String(startNum));
      for (const li of pendingPlainItems) {
        seg.appendChild(li);
        startNum++;
      }
      fragment.appendChild(seg);
      pendingPlainItems = [];
    }

    for (const li of items) {
      if (!li.querySelector('.gdoc-code-table')) {
        // Plain item — accumulate
        pendingPlainItems.push(li);
        continue;
      }

      // --- This <li> contains at least one table ---
      flushPlainItems();

      // Walk the <li>'s direct children and emit them as siblings
      const children = Array.from(li.childNodes);

      // Collect leading text/inline nodes as the "label" (the numbered line)
      let labelNodes = [];
      let idx = 0;
      for (; idx < children.length; idx++) {
        const child = children[idx];
        // Stop at the first block-level element (table, p, div, ul, ol, pre, blockquote)
        if (child.nodeType === 1 &&
            /^(TABLE|P|DIV|UL|OL|PRE|BLOCKQUOTE)$/i.test(child.tagName)) {
          break;
        }
        labelNodes.push(child);
      }

      // Build a <p> for the label, with the number prefix if ordered
      if (labelNodes.length > 0) {
        const p = document.createElement('p');
        if (isOrdered) {
          const numSpan = document.createElement('span');
          numSpan.textContent = `${startNum}. `;
          numSpan.style.fontWeight = 'bold';
          p.appendChild(numSpan);
        }
        for (const n of labelNodes) p.appendChild(n);
        fragment.appendChild(p);
      }

      // Emit remaining children (tables, trailing text, nested lists, etc.)
      for (; idx < children.length; idx++) {
        const child = children[idx];

        if (child.nodeType === 1 &&
            /^(TABLE|UL|OL|PRE|BLOCKQUOTE|DIV)$/i.test(child.tagName)) {
          // Block element — emit directly
          fragment.appendChild(child);
        } else if (child.nodeType === 1 && child.tagName === 'P') {
          fragment.appendChild(child);
        } else if (child.nodeType === 3 && child.textContent.trim().length > 0) {
          // Wrap stray text in a <p>
          const p = document.createElement('p');
          p.textContent = child.textContent;
          fragment.appendChild(p);
        } else if (child.nodeType === 1) {
          // Other inline elements (em, strong, code, a, etc.)
          const p = document.createElement('p');
          p.appendChild(child);
          fragment.appendChild(p);
        }
      }

      startNum++;
    }

    flushPlainItems();
    list.parentNode.replaceChild(fragment, list);
  }
}

function renderMarkdown() {
  const mdInput = document.getElementById('markdown-input');
  const preview = document.getElementById('preview');
  if (!mdInput || !preview) return;

  preview.innerHTML = marked.parse(mdInput.value);

  // Cache the hljs base color and background once per render (avoids repeated DOM work)
  const hljsBaseColor = getHljsBaseColor();
  const hljsBaseBg = getHljsBaseBg();

  for (const pre of Array.from(preview.querySelectorAll('pre'))) {
    const code = pre.querySelector('code');
    if (!code) continue;

    // Highlight & inline-resolve colors
    hljs.highlightElement(code);
    inlineResolveColors(code, hljsBaseColor);

    // Use theme background
    const bgColor = hljsBaseBg;

    // Build per-line <p> elements
    const fontSize = styles.codeBlock.fontSize || DEFAULT_STYLES.codeBlock.fontSize;
    const linesHtml = codeHtmlToLinePs(code, styles.codeBlock.fontFamily, fontSize, hljsBaseColor);

    // Wrap in a 1×1 table for Google Docs background compatibility
    const table = document.createElement('table');
    table.className = 'gdoc-code-table';
    table.setAttribute('style', [
      `background-color: ${bgColor}`,
      'width: 100%',
      'border-collapse: collapse',
      `border: ${CONFIG.codeBlock.tableBorder}`,
      'margin: 1em 0',
      `border-radius: ${styles.codeBlock.borderRadius}px`,
      'overflow: hidden',
    ].join('; ') + ';');

    const td = document.createElement('td');
    td.setAttribute('style', [
      `padding: ${CONFIG.codeBlock.cellPadding}`,
      'vertical-align: top',
      `background-color: ${bgColor}`,
    ].join('; ') + ';');

    td.innerHTML = linesHtml;

    const tr = document.createElement('tr');
    tr.appendChild(td);
    table.appendChild(tr);

    pre.parentNode.replaceChild(table, pre);
  }

  // After code blocks are converted to tables, break apart any lists
  // that now contain tables — Google Docs can't handle tables inside <li>.
  flattenListsWithTables(preview);
}

// ============================================================================
// Copy to Clipboard (inline all styles for Google Docs / Quill)
// ============================================================================

function getStyledHtmlContent() {
  const preview = document.getElementById('preview');
  if (!preview) return '';

  const clone = preview.cloneNode(true);
  clone.style.cssText = `position:absolute; left:-9999px; top:-9999px; width:${CONFIG.copy.cloneWidth};`;
  document.body.appendChild(clone);

  const cloneEls = [clone, ...clone.querySelectorAll('*')];
  const liveEls = [preview, ...preview.querySelectorAll('*')];

  cloneEls.forEach((el, i) => {
    const liveEl = liveEls[i];
    if (!liveEl) return;

    // Code block elements already have correct inline styles — keep them
    if (el.closest?.('.gdoc-code-table')) {
      el.removeAttribute('class');
      el.removeAttribute('id');
      return;
    }

    // Resolve computed styles → inline for everything else
    const cs = window.getComputedStyle(liveEl);
    let s = '';
    for (const prop of INLINE_PROPERTIES) {
      const val = cs.getPropertyValue(prop);
      if (val) s += `${prop}: ${val}; `;
    }

    // Explicit list styling for Google Docs
    if (el.tagName === 'UL') s += 'list-style-type: disc; margin-left: 1.5rem; ';
    else if (el.tagName === 'OL') s += 'list-style-type: decimal; margin-left: 1.5rem; ';
    else if (el.tagName === 'LI') s += 'display: list-item; ';

    el.setAttribute('style', s);
    el.removeAttribute('class');
    el.removeAttribute('id');
  });

  const finalHtml = clone.innerHTML;
  document.body.removeChild(clone);
  return finalHtml;
}

function performCopy() {
  const preview = document.getElementById('preview');
  if (!preview) return;
  const html = getStyledHtmlContent();
  copyRichText(html, preview.innerText);
}

function getWrappedHtmlDocument(html) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Exported Document</title>
  <style>
    body {
      padding: 2rem;
      background-color: #f1f5f9;
      display: flex;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .container {
      background-color: #ffffff;
      max-width: 800px;
      width: 100%;
      padding: 3.5rem 4rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}
  </div>
</body>
</html>`;
}

async function performCopyHtml() {
  const html = getStyledHtmlContent();
  if (!html) return;
  const wrapped = getWrappedHtmlDocument(html);

  try {
    await navigator.clipboard.writeText(wrapped);
    showToast('Đã copy mã HTML thô vào bộ nhớ tạm!');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = wrapped;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Đã copy mã HTML thô (chế độ tương thích)!');
    } catch {
      alert('Không thể copy mã HTML. Vui lòng thử lại.');
    }
    document.body.removeChild(textarea);
  }
}

function performDownloadHtml() {
  const html = getStyledHtmlContent();
  if (!html) return;
  const wrapped = getWrappedHtmlDocument(html);

  const blob = new Blob([wrapped], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Đã tải xuống file HTML thành công!');
}

async function copyRichText(html, plainText) {
  const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

  // Prefer modern Clipboard API
  if (navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([wrapped], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
      showToast('Đã copy vào bộ nhớ tạm! Hãy paste (Ctrl+V) vào Google Docs.');
      return;
    } catch (e) {
      console.warn('Clipboard API failed, using fallback', e);
    }
  }

  // Fallback: execCommand
  try {
    const handler = (e) => {
      e.clipboardData.setData('text/html', wrapped);
      e.clipboardData.setData('text/plain', plainText);
      e.preventDefault();
    };
    document.addEventListener('copy', handler);
    document.execCommand('copy');
    document.removeEventListener('copy', handler);
    showToast('Đã copy thành công (chế độ tương thích)!');
  } catch {
    alert('Không thể copy tự động. Vui lòng chọn văn bản trong Preview và nhấn Ctrl+C.');
  }
}

// ============================================================================
// Utilities
// ============================================================================

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>✓</span> ${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), CONFIG.toast.durationMs);
}

// ============================================================================
// Bootstrap
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  loadStyles();
  populateInputs();
  updateDynamicStyles();
  bindEvents();
  renderMarkdown();
});
