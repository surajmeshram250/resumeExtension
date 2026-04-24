'use strict';

let isEditing = false;

const defaults = {
  fontFamily: 'Inter',
  fontSize: 13,
  lineHeight: 1.5,
  sectionSpacing: 16,
  textColor: '#333333',
  accentColor: '#1a1a2e',
  template: 'classic'
};

let settings = { ...defaults };
const EDITABLE_TAGS = ['p', 'li', 'h3', 'h4', 'span'];

function getResume() { return document.getElementById('mypdf'); }
function q(id) { return document.getElementById(id); }

function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  restoreResume();
  bindToolbar();
  bindUpload();
  applyTemplate(settings.template);
  applyAdjustments();
  syncToolbarUI();
  makeEditable(false);
});

function bindToolbar() {
  q('editBtn')?.addEventListener('click', toggleEdit);
  q('saveBtn')?.addEventListener('click', saveData);
  q('printBtn')?.addEventListener('click', printResume);
  q('templateClassicBtn')?.addEventListener('click', () => switchTemplate('classic'));
  q('templateAltBtn')?.addEventListener('click', () => switchTemplate('alt'));
  q('fontSelect')?.addEventListener('change', e => { settings.fontFamily = e.target.value; applyAdjustments(); persistSettings(); });
  q('fontDecBtn')?.addEventListener('click', () => { changeFontSize(-1); persistSettings(); });
  q('fontIncBtn')?.addEventListener('click', () => { changeFontSize(1); persistSettings(); });
  q('lineHeightSelect')?.addEventListener('change', e => { settings.lineHeight = parseFloat(e.target.value); applyAdjustments(); persistSettings(); });
  q('sectionSpacingSelect')?.addEventListener('change', e => { settings.sectionSpacing = parseInt(e.target.value, 10); applyAdjustments(); persistSettings(); });
  q('textColorPicker')?.addEventListener('input', e => { settings.textColor = e.target.value; applyAdjustments(); persistSettings(); });
  q('accentColorPicker')?.addEventListener('input', e => { settings.accentColor = e.target.value; applyAdjustments(); persistSettings(); });
}

function persistSettings() {
  safeStorageSet('resumeSettings', JSON.stringify(settings));
}

function loadSettings() {
  const raw = safeStorageGet('resumeSettings');
  if (!raw) return;
  try { settings = { ...defaults, ...JSON.parse(raw) }; } catch (e) { settings = { ...defaults }; }
}

function restoreResume() {
  const raw = safeStorageGet('resumeContent');
  if (!raw) return;
  getResume().innerHTML = raw;
  sanitizeDom();
}

function getCleanHtml() {
  const clone = getResume().cloneNode(true);
  clone.querySelectorAll('.edit-controls, .section-add-wrap, .item-remove-wrap').forEach(el => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  return clone.innerHTML;
}

function saveData() {
  sanitizeDom();
  safeStorageSet('resumeContent', getCleanHtml());
  persistSettings();
  if (isEditing) injectControls();
  flashStatus('✅ Saved');
}

function flashStatus(msg) {
  const el = q('status');
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => {
    el.textContent = isEditing ? 'Edit mode – click text to edit' : 'View mode';
  }, 1400);
}

function showToast(msg, type = 'info') {
  const el = q('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.className = ''; }, 3200);
}

function showLoader(on, msg) {
  const o = q('loadingOverlay');
  if (!o) return;
  if (msg) o.querySelector('.loading-text').textContent = msg;
  o.classList.toggle('visible', !!on);
}

function sanitizeDom() {
  getResume().querySelectorAll('.edit-controls, .section-add-wrap, .item-remove-wrap').forEach(el => el.remove());
}

function makeEditable(enable) {
  const resume = getResume();
  EDITABLE_TAGS.forEach(tag => {
    resume.querySelectorAll(tag).forEach(el => {
      if (el.closest('.edit-controls') || el.closest('.section-add-wrap')) return;
      el.contentEditable = enable ? 'true' : 'false';
      if (enable) el.setAttribute('spellcheck', 'false');
      else el.removeAttribute('spellcheck');
    });
  });
}

function toggleEdit() {
  isEditing = !isEditing;
  document.body.classList.toggle('editing', isEditing);
  q('editBtn').textContent = isEditing ? '✅ Done Editing' : '✏️ Edit';
  q('saveBtn').style.display = isEditing ? 'inline-flex' : 'none';
  q('status').textContent = isEditing ? 'Edit mode – click text to edit' : 'View mode';
  sanitizeDom();
  makeEditable(isEditing);
  if (isEditing) injectControls();
}

function switchTemplate(name) {
  settings.template = name;
  sanitizeDom();
  applyTemplate(name);
  applyAdjustments();
  makeEditable(isEditing);
  if (isEditing) injectControls();
  syncToolbarUI();
  persistSettings();
}

function applyTemplate(name) {
  const resume = getResume();
  resume.classList.remove('classic-template', 'template-alt');
  resume.classList.add(name === 'alt' ? 'template-alt' : 'classic-template');
}

function applyAdjustments() {
  let style = document.getElementById('resume-custom-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'resume-custom-style';
    document.head.appendChild(style);
  }

  const fontMap = {
    'Inter': "'Inter', sans-serif",
    'Open Sans': "'Open Sans', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'Roboto': "'Roboto', sans-serif",
    'Lato': "'Lato', sans-serif",
    'Georgia': "Georgia, serif"
  };
  const fontStack = fontMap[settings.fontFamily] || "'Inter', sans-serif";

  const scale = settings.fontSize / 13;
  const altName     = Math.round(35 * scale);
  const altDesig    = Math.round(16 * scale);
  const altDetail   = Math.round(16 * scale);
  const altHeading  = Math.round(18 * scale);
  const altBody     = Math.round(16 * scale);
  const altSkill    = Math.round(14 * scale);
  const altMeta     = Math.round(16 * scale);

  style.textContent = `
    #mypdf {
      --resume-text: ${settings.textColor};
      --resume-accent: ${settings.accentColor};
      color: ${settings.textColor};
      font-size: ${settings.fontSize}px;
      line-height: ${settings.lineHeight};
      font-family: ${fontStack};
    }
    #mypdf.classic-template, #mypdf.classic-template p, #mypdf.classic-template li,
    #mypdf.classic-template h3, #mypdf.classic-template h4, #mypdf.classic-template span,
    #mypdf.classic-template a { font-family: ${fontStack}; }
    #mypdf.template-alt, #mypdf.template-alt p, #mypdf.template-alt li,
    #mypdf.template-alt h3, #mypdf.template-alt h4, #mypdf.template-alt span,
    #mypdf.template-alt a { font-family: ${fontStack}; }
    #mypdf.template-alt .header .name h3     { font-size: ${altName}px; }
    #mypdf.template-alt .header .desgination h4 { font-size: ${altDesig}px; }
    #mypdf.template-alt .header .details p   { font-size: ${altDetail}px; }
    #mypdf.template-alt h3.work-heading, #mypdf.template-alt h3.project-heading,
    #mypdf.template-alt h3.education-heading, #mypdf.template-alt h3.add-heading,
    #mypdf.template-alt .body > * > h3 { font-size: ${altHeading}px; }
    #mypdf.template-alt .summary p, #mypdf.template-alt .work-desc ul li,
    #mypdf.template-alt .project-desc ul li, #mypdf.template-alt .edu-details p,
    #mypdf.template-alt .hobbies { font-size: ${altBody}px; }
    #mypdf.template-alt .skill-list span { font-size: ${altSkill}px; }
    #mypdf.template-alt .work-detail h3, #mypdf.template-alt .project-detail h3 { font-size: ${altMeta}px; }
    #mypdf.template-alt .work-detail p, #mypdf.template-alt .project-detail p,
    #mypdf.template-alt .education-sub p.right { font-size: ${altMeta}px; }
    #mypdf .summary, #mypdf .skills, #mypdf .work-exp,
    #mypdf .project, #mypdf .education, #mypdf .additional {
      margin-bottom: ${settings.sectionSpacing}px;
    }
    #mypdf p, #mypdf li { line-height: ${settings.lineHeight}; }
    #mypdf.classic-template .header { background: ${settings.accentColor}; }
    #mypdf.classic-template .body > * > h3, #mypdf.classic-template h3.work-heading,
    #mypdf.classic-template h3.project-heading, #mypdf.classic-template h3.education-heading,
    #mypdf.classic-template h3.add-heading {
      color: ${settings.accentColor};
      border-bottom-color: ${settings.accentColor};
    }
    #mypdf.classic-template .work-detail h3, #mypdf.classic-template .project-detail h3,
    #mypdf.classic-template .lang { color: ${settings.accentColor}; }
    #mypdf.template-alt .header .details a { color: ${settings.accentColor}; }
    #mypdf.template-alt .body > * > h3, #mypdf.template-alt h3.work-heading,
    #mypdf.template-alt h3.project-heading, #mypdf.template-alt h3.education-heading,
    #mypdf.template-alt h3.add-heading {
      background-color: color-mix(in srgb, ${settings.accentColor} 16%, white);
      border-color: color-mix(in srgb, ${settings.accentColor} 18%, white);
    }
    #mypdf.template-alt .skill-list span {
      background-color: color-mix(in srgb, ${settings.accentColor} 10%, white);
      border-color: color-mix(in srgb, ${settings.accentColor} 16%, white);
    }
  `;

  const fs = q('fontSizeDisplay');
  if (fs) fs.textContent = settings.fontSize;
}

function changeFontSize(delta) {
  settings.fontSize = Math.max(8, Math.min(20, settings.fontSize + delta));
  applyAdjustments();
}

function syncToolbarUI() {
  if (q('fontSelect')) q('fontSelect').value = settings.fontFamily;
  if (q('lineHeightSelect')) q('lineHeightSelect').value = String(settings.lineHeight);
  if (q('sectionSpacingSelect')) q('sectionSpacingSelect').value = String(settings.sectionSpacing);
  if (q('textColorPicker')) q('textColorPicker').value = settings.textColor;
  if (q('accentColorPicker')) q('accentColorPicker').value = settings.accentColor;
  if (q('fontSizeDisplay')) q('fontSizeDisplay').textContent = settings.fontSize;
  q('templateClassicBtn')?.classList.toggle('active', settings.template === 'classic');
  q('templateAltBtn')?.classList.toggle('active', settings.template === 'alt');
}

function printResume() {
  const wasEditing = isEditing;
  if (wasEditing) toggleEdit();
  sanitizeDom();
  setTimeout(() => {
    window.print();
    if (wasEditing) setTimeout(() => toggleEdit(), 300);
  }, 60);
}

function makeCE(el) {
  el.setAttribute('contenteditable', 'false');
  return el;
}

function injectControls() {
  sanitizeDom();
  addSectionBtn('.project', '+ Add Project', addProject);
  addSectionBtn('.work-exp', '+ Add Job', addWork);
  addSectionBtn('.education', '+ Add Education', addEducation);
  addSectionBtn('.skills', '+ Add Skill', addSkill);
  getResume().querySelectorAll('.project-info').forEach(block => attachRemove(block));
  getResume().querySelectorAll('.work-info').forEach(block => attachRemove(block));
  getResume().querySelectorAll('.education-section').forEach(block => attachRemove(block));
  getResume().querySelectorAll('.project-desc ul, .work-desc ul').forEach(ul => attachAddBullet(ul));
}

function addSectionBtn(selector, label, handler) {
  const section = getResume().querySelector(selector);
  if (!section) return;
  const wrap = document.createElement('div');
  wrap.className = 'section-add-wrap edit-controls';
  makeCE(wrap);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'add-btn';
  btn.textContent = label;
  makeCE(btn);
  btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); handler(); });
  wrap.appendChild(btn);
  section.appendChild(wrap);
}

function attachRemove(block) {
  if (block.querySelector(':scope > .item-remove-wrap')) return;
  block.style.position = 'relative';
  const wrap = document.createElement('span');
  wrap.className = 'item-remove-wrap edit-controls';
  makeCE(wrap);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'remove-btn';
  btn.textContent = '×';
  makeCE(btn);
  btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); block.remove(); });
  wrap.appendChild(btn);
  block.appendChild(wrap);
}

function attachAddBullet(ul) {
  if (ul.nextElementSibling && ul.nextElementSibling.classList.contains('edit-controls')) return;
  const wrap = document.createElement('span');
  wrap.className = 'edit-controls';
  makeCE(wrap);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'add-bullet-btn';
  btn.textContent = '＋ Add bullet';
  makeCE(btn);
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const li = document.createElement('li');
    li.textContent = 'New bullet point';
    li.contentEditable = 'true';
    ul.appendChild(li);
    li.focus();
    selectAll(li);
  });
  wrap.appendChild(btn);
  ul.after(wrap);
}

function selectAll(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function setEditableIn(node) {
  EDITABLE_TAGS.forEach(tag => {
    node.querySelectorAll(tag).forEach(el => {
      if (!el.closest('.edit-controls') && !el.closest('.section-add-wrap')) el.contentEditable = 'true';
    });
  });
}

function insertBeforeSectionAdd(container, node) {
  const addWrap = container.querySelector(':scope > .section-add-wrap');
  if (addWrap) container.insertBefore(node, addWrap);
  else container.appendChild(node);
}

function addProject() {
  const container = getResume().querySelector('.project');
  if (!container) return;
  const temp = document.createElement('div');
  temp.innerHTML = `<section class="project-info"><div class="project-detail"><h3>New Project</h3><p>Duration</p></div><div class="project-desc"><ul><li>Describe your contribution and impact here.</li></ul></div></section>`;
  const node = temp.firstElementChild;
  insertBeforeSectionAdd(container, node);
  setEditableIn(node); attachRemove(node);
  node.querySelectorAll('.project-desc ul').forEach(ul => attachAddBullet(ul));
  const t = node.querySelector('h3'); if (t) { t.focus(); selectAll(t); }
}

function addWork() {
  const container = getResume().querySelector('.work-exp');
  if (!container) return;
  const temp = document.createElement('div');
  temp.innerHTML = `<div class="work-info"><div class="work-detail"><h3>New Role – Company Name</h3><p>Start – End</p></div><div class="work-desc"><ul><li>Add one achievement with action and result.</li></ul></div></div>`;
  const node = temp.firstElementChild;
  insertBeforeSectionAdd(container, node);
  setEditableIn(node); attachRemove(node);
  node.querySelectorAll('.work-desc ul').forEach(ul => attachAddBullet(ul));
  const t = node.querySelector('h3'); if (t) { t.focus(); selectAll(t); }
}

function addEducation() {
  const container = getResume().querySelector('.education');
  if (!container) return;
  const temp = document.createElement('div');
  temp.innerHTML = `<section class="education-section"><div class="education-sub"><p class="right">Year</p></div><div class="edu-details"><p class="course-label">Degree / Course</p><p>Institution Name</p></div></section>`;
  const node = temp.firstElementChild;
  insertBeforeSectionAdd(container, node);
  setEditableIn(node); attachRemove(node);
  const t = node.querySelector('.course-label'); if (t) { t.focus(); selectAll(t); }
}

function addSkill() {
  const list = getResume().querySelector('.skill-list');
  if (!list) return;
  const skill = document.createElement('span');
  skill.textContent = 'New Skill';
  skill.contentEditable = 'true';
  list.appendChild(skill);
  skill.focus();
  selectAll(skill);
}

/* ══════════════════════════════════════════════════
   FILE UPLOAD + REGEX-BASED AUTO FILL (no AI)
══════════════════════════════════════════════════ */
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
}

function bindUpload() {
  q('uploadBtn')?.addEventListener('click', () => {
    if (!isEditing) {
      showToast('⚠️ Please click "✏️ Edit" first, then upload your resume.', 'error');
      return;
    }
    q('resumeUpload')?.click();
  });

  q('resumeUpload')?.addEventListener('change', () => {
    const input = q('resumeUpload');
    if (!input.files.length) return;
    if (!isEditing) {
      showToast('⚠️ Please click "✏️ Edit" first, then upload your resume.', 'error');
      input.value = '';
      return;
    }
    const file = input.files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    showLoader(true, `Parsing "${file.name}"…`);
    if (ext === 'pdf') parsePDF(file);
    else if (ext === 'docx' || ext === 'doc') parseDOCX(file);
    else if (ext === 'txt') parseTXT(file);
    else { showLoader(false); showToast('Unsupported file type. Use PDF, DOCX, or TXT.', 'error'); }
    input.value = '';
  });
}

function parsePDF(file) {
  if (typeof pdfjsLib === 'undefined') {
    showLoader(false); showToast('PDF.js failed to load.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    pdfjsLib.getDocument({ data: new Uint8Array(this.result) }).promise
      .then(async pdf => {
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent();
          let lastY = null;
          tc.items.forEach(it => {
            if (lastY !== null && Math.abs(it.transform[5] - lastY) > 2) text += '\n';
            text += it.str + ' ';
            lastY = it.transform[5];
          });
          text += '\n';
        }
        extractAndFill(text);
      })
      .catch(err => {
        console.error(err);
        showLoader(false);
        showToast('Could not read PDF — file may be scanned or protected.', 'error');
      });
  };
  reader.readAsArrayBuffer(file);
}

function parseDOCX(file) {
  if (typeof mammoth === 'undefined') {
    showLoader(false); showToast('Mammoth.js failed to load.', 'error'); return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    mammoth.extractRawText({ arrayBuffer: e.target.result })
      .then(r => extractAndFill(r.value))
      .catch(err => { console.error(err); showLoader(false); showToast('Could not read DOCX.', 'error'); });
  };
  reader.readAsArrayBuffer(file);
}

function parseTXT(file) {
  const reader = new FileReader();
  reader.onload = function () { extractAndFill(this.result); };
  reader.readAsText(file);
}

function extractAndFill(text) {
  try {
    const data = extractFields(text);
    applyToDOM(data);
    makeEditable(isEditing);
    if (isEditing) injectControls();
    saveData();
    showLoader(false);
    showToast('✅ Resume auto-filled. Review & edit as needed.', 'success');
  } catch (err) {
    console.error(err);
    showLoader(false);
    showToast('Could not extract fields from file.', 'error');
  }
}

function extractFields(raw) {
  const text = raw.replace(/\r/g, '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [''])[0];
  const phone = (text.match(/(\+?\d[\d\s().-]{7,}\d)/) || [''])[0].trim();
  const linkedin = (text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s)]+/i) || [''])[0];
  const portfolio = (text.match(/https?:\/\/(?!(?:www\.)?linkedin\.com)[^\s)]+/i) || [''])[0];

  let name = '';
  for (const l of lines.slice(0, 6)) {
    if (/@|http|\d{3}/.test(l)) continue;
    if (l.length > 2 && l.length < 60 && /^[A-Za-z][A-Za-z .'-]+$/.test(l)) { name = l; break; }
  }

  const sections = splitSections(lines);

  return {
    name, email, phone, linkedin, portfolio,
    summary: sections.summary || '',
    skills: parseSkills(sections.skills || ''),
    experience: parseBlocks(sections.experience || ''),
    projects: parseBlocks(sections.projects || ''),
    education: parseBlocks(sections.education || '')
  };
}

function splitSections(lines) {
  const headings = {
    summary:   /^(summary|profile|objective|about)\b/i,
    experience:/^(experience|work experience|employment|professional experience)\b/i,
    education: /^(education|academics|qualifications)\b/i,
    projects:  /^(projects|personal projects|academic projects)\b/i,
    skills:    /^(skills|technical skills|technologies|tools)\b/i
  };
  const out = {};
  let current = null;
  for (const line of lines) {
    let matched = null;
    for (const [k, re] of Object.entries(headings)) {
      if (re.test(line) && line.length < 50) { matched = k; break; }
    }
    if (matched) { current = matched; out[current] = out[current] || ''; continue; }
    if (current) out[current] += line + '\n';
  }
  return out;
}

function parseSkills(block) {
  return block.split(/[,;•·|\n]/).map(s => s.trim()).filter(s => s && s.length < 40);
}

function parseBlocks(block) {
  const chunks = block.split(/\n(?=[A-Z])/).map(c => c.trim()).filter(Boolean);
  return chunks.map(chunk => {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0] || '';
    const dateMatch = chunk.match(/((19|20)\d{2}).{0,15}((19|20)\d{2}|present|current)/i);
    const dates = dateMatch ? dateMatch[0] : (lines[1] || '');
    const bullets = lines.slice(1).filter(l => l !== dates && l.length > 5);
    return { title, dates, bullets };
  });
}

function applyToDOM(d) {
  const resume = getResume();
  const setText = (sel, val) => {
    if (!val) return;
    const el = resume.querySelector(sel);
    if (el) el.textContent = val;
  };

  setText('.header .name h3, .name h3', d.name);

  const details = resume.querySelector('.header .details, .details');
  if (details && (d.email || d.phone || d.linkedin)) {
    const parts = [];
    if (d.phone)    parts.push(`<p>${d.phone}</p>`);
    if (d.email)    parts.push(`<p><a href="mailto:${d.email}">${d.email}</a></p>`);
    if (d.linkedin) parts.push(`<p><a href="${d.linkedin.startsWith('http') ? d.linkedin : 'https://' + d.linkedin}">LinkedIn</a></p>`);
    if (d.portfolio) parts.push(`<p><a href="${d.portfolio}">Portfolio</a></p>`);
    details.innerHTML = parts.join('');
  }

  if (d.summary) {
    const sum = resume.querySelector('.summary p');
    if (sum) sum.textContent = d.summary.replace(/\n+/g, ' ').trim();
  }

  if (d.skills.length) {
    const list = resume.querySelector('.skill-list');
    if (list) {
      list.innerHTML = '';
      d.skills.forEach(s => {
        const span = document.createElement('span');
        span.textContent = s;
        list.appendChild(span);
      });
    }
  }

  fillBlocks('.work-exp', d.experience, 'work-info', 'work-detail', 'work-desc');
  fillBlocks('.project', d.projects, 'project-info', 'project-detail', 'project-desc');

  if (d.education.length) {
    const edu = resume.querySelector('.education');
    if (edu) {
      edu.querySelectorAll('.education-section').forEach(n => n.remove());
      d.education.forEach(item => {
        const section = document.createElement('section');
        section.className = 'education-section';
        section.innerHTML = `
          <div class="education-sub"><p class="right">${item.dates || ''}</p></div>
          <div class="edu-details">
            <p class="course-label">${item.title}</p>
            ${item.bullets.map(b => `<p>${b}</p>`).join('')}
          </div>`;
        edu.appendChild(section);
      });
    }
  }
}

function fillBlocks(sectionSel, items, wrapperCls, detailCls, descCls) {
  if (!items.length) return;
  const container = getResume().querySelector(sectionSel);
  if (!container) return;
  container.querySelectorAll('.' + wrapperCls).forEach(n => n.remove());
  const heading = container.querySelector('h3');
  items.forEach(item => {
    const wrap = document.createElement(wrapperCls === 'work-info' ? 'div' : 'section');
    wrap.className = wrapperCls;
    wrap.innerHTML = `
      <div class="${detailCls}"><h3>${item.title}</h3><p>${item.dates || ''}</p></div>
      <div class="${descCls}"><ul>${item.bullets.map(b => `<li>${b.replace(/^[•·\-*]\s*/, '')}</li>`).join('')}</ul></div>`;
    if (heading && heading.nextSibling) container.insertBefore(wrap, heading.nextSibling);
    else container.appendChild(wrap);
  });
}