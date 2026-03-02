const blockTypes = [
  {
    type: 'header',
    name: 'Заголовок',
    defaults: { text: 'Добро пожаловать!', align: 'center', color: '#1e2630' },
    fields: [
      { key: 'text', label: 'Текст', kind: 'text' },
      { key: 'align', label: 'Выравнивание', kind: 'select', options: ['left', 'center', 'right'] },
      { key: 'color', label: 'Цвет текста', kind: 'color' },
    ],
  },
  {
    type: 'text',
    name: 'Текст',
    defaults: {
      text: 'Добавьте описание предложения или новости компании.',
      align: 'left',
      color: '#3f4a5a',
    },
    fields: [
      { key: 'text', label: 'Текст', kind: 'textarea' },
      { key: 'align', label: 'Выравнивание', kind: 'select', options: ['left', 'center', 'right'] },
      { key: 'color', label: 'Цвет текста', kind: 'color' },
    ],
  },
  {
    type: 'image',
    name: 'Изображение',
    defaults: { url: 'https://via.placeholder.com/600x240', alt: 'Превью', width: '100%' },
    fields: [
      { key: 'url', label: 'URL изображения', kind: 'text' },
      { key: 'alt', label: 'ALT-текст', kind: 'text' },
      { key: 'width', label: 'Ширина (например: 100% или 560px)', kind: 'text' },
    ],
  },
  {
    type: 'button',
    name: 'Кнопка',
    defaults: { text: 'Открыть предложение', href: 'https://example.com', bg: '#275efe', color: '#ffffff' },
    fields: [
      { key: 'text', label: 'Текст кнопки', kind: 'text' },
      { key: 'href', label: 'Ссылка', kind: 'text' },
      { key: 'bg', label: 'Фон кнопки', kind: 'color' },
      { key: 'color', label: 'Цвет текста', kind: 'color' },
    ],
  },
];

const state = {
  blocks: [],
  selectedId: null,
};

const palette = document.getElementById('blockPalette');
const canvas = document.getElementById('canvas');
const settingsForm = document.getElementById('settingsForm');
const noSelection = document.getElementById('noSelection');
const codeOutput = document.getElementById('codeOutput');
const emailPreview = document.getElementById('emailPreview');

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getDef(type) {
  return blockTypes.find((item) => item.type === type);
}

function initPalette() {
  blockTypes.forEach((def) => {
    const button = document.createElement('button');
    button.className = 'palette-item';
    button.draggable = true;
    button.textContent = def.name;
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('blockType', def.type);
    });
    button.addEventListener('click', () => addBlock(def.type));
    palette.append(button);
  });
}

function addBlock(type) {
  const def = getDef(type);
  state.blocks.push({ id: uid(), type, data: { ...def.defaults } });
  render();
}

function removeBlock(id) {
  state.blocks = state.blocks.filter((item) => item.id !== id);
  if (state.selectedId === id) {
    state.selectedId = null;
  }
  render();
}

function selectBlock(id) {
  state.selectedId = id;
  render();
}

function updateBlock(id, key, value) {
  const block = state.blocks.find((item) => item.id === id);
  if (!block) return;
  block.data[key] = value;
  render(false);
}

function canvasItemPreview(block) {
  const { type, data } = block;
  if (type === 'header') {
    return `<h2 style="margin:8px 0;text-align:${data.align};color:${data.color}">${escapeHtml(data.text)}</h2>`;
  }
  if (type === 'text') {
    return `<p style="margin:8px 0;text-align:${data.align};color:${data.color}">${escapeHtml(data.text)}</p>`;
  }
  if (type === 'image') {
    return `<img src="${escapeHtml(data.url)}" alt="${escapeHtml(data.alt)}" style="max-width:${data.width};width:${data.width};border-radius:8px"/>`;
  }
  if (type === 'button') {
    return `<div style="margin:8px 0"><span style="display:inline-block;background:${data.bg};color:${data.color};padding:10px 16px;border-radius:6px">${escapeHtml(data.text)}</span></div>`;
  }
  return '';
}

function renderCanvas() {
  canvas.innerHTML = '';
  if (state.blocks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'canvas-empty';
    empty.textContent = 'Добавьте блоки из левой панели.';
    canvas.append(empty);
    return;
  }

  state.blocks.forEach((block) => {
    const def = getDef(block.type);
    const item = document.createElement('div');
    item.className = `canvas-item ${state.selectedId === block.id ? 'selected' : ''}`;
    item.innerHTML = `
      <div class="canvas-item-title">${def.name}</div>
      <div>${canvasItemPreview(block)}</div>
      <div class="canvas-item-actions">
        <button class="remove" type="button">Удалить</button>
      </div>
    `;
    item.addEventListener('click', () => selectBlock(block.id));
    item.querySelector('.remove').addEventListener('click', (event) => {
      event.stopPropagation();
      removeBlock(block.id);
    });
    canvas.append(item);
  });
}

function renderSettings() {
  const block = state.blocks.find((item) => item.id === state.selectedId);
  if (!block) {
    noSelection.classList.remove('hidden');
    settingsForm.classList.add('hidden');
    settingsForm.innerHTML = '';
    return;
  }

  const def = getDef(block.type);
  noSelection.classList.add('hidden');
  settingsForm.classList.remove('hidden');
  settingsForm.innerHTML = '';

  def.fields.forEach((field) => {
    const wrapper = document.createElement('label');
    wrapper.textContent = field.label;

    let input;
    if (field.kind === 'select') {
      input = document.createElement('select');
      field.options.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        input.append(opt);
      });
    } else if (field.kind === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = field.kind;
    }

    input.value = block.data[field.key];
    input.addEventListener('input', (event) => updateBlock(block.id, field.key, event.target.value));

    wrapper.append(input);
    settingsForm.append(wrapper);
  });
}

function toEmailHtml() {
  const rows = state.blocks
    .map((block) => {
      const { type, data } = block;
      if (type === 'header') {
        return `<tr><td style="padding:12px 24px;text-align:${data.align};color:${data.color};font-family:Arial,sans-serif;font-size:28px;font-weight:bold;">${escapeHtml(data.text)}</td></tr>`;
      }
      if (type === 'text') {
        return `<tr><td style="padding:8px 24px;text-align:${data.align};color:${data.color};font-family:Arial,sans-serif;font-size:16px;line-height:1.6;">${escapeHtml(data.text)}</td></tr>`;
      }
      if (type === 'image') {
        return `<tr><td style="padding:8px 24px;"><img src="${escapeHtml(data.url)}" alt="${escapeHtml(data.alt)}" style="display:block;width:${data.width};max-width:100%;height:auto;border:0;" /></td></tr>`;
      }
      if (type === 'button') {
        return `<tr><td style="padding:16px 24px;"><a href="${escapeHtml(data.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;background:${data.bg};color:${data.color};text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">${escapeHtml(data.text)}</a></td></tr>`;
      }
      return '';
    })
    .join('\n');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5fb;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;border:1px solid #d6deeb;">
${rows}
    </table>
  </body>
</html>`;
}

function updatePreview(html) {
  emailPreview.srcdoc = html;
}

function openPreviewInNewTab(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function render(refreshCode = true) {
  renderCanvas();
  renderSettings();
  const html = toEmailHtml();
  if (refreshCode) {
    codeOutput.value = html;
  }
  updatePreview(html);
}

canvas.addEventListener('dragover', (event) => {
  event.preventDefault();
});

canvas.addEventListener('drop', (event) => {
  event.preventDefault();
  const type = event.dataTransfer.getData('blockType');
  if (type) {
    addBlock(type);
  }
});

document.getElementById('clearCanvas').addEventListener('click', () => {
  state.blocks = [];
  state.selectedId = null;
  render();
});

document.getElementById('generateCode').addEventListener('click', () => {
  const html = toEmailHtml();
  codeOutput.value = html;
  updatePreview(html);
});

document.getElementById('copyCode').addEventListener('click', async () => {
  await navigator.clipboard.writeText(codeOutput.value);
});

document.getElementById('openPreview').addEventListener('click', () => {
  openPreviewInNewTab(toEmailHtml());
});

initPalette();
render();
