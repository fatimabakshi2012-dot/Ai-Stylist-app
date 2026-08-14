// ---- tab switching ----
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ---- photo upload preview ----
const photoInput = document.getElementById('photoInput');
const dropzone = document.getElementById('dropzone');
const dropzoneInner = document.getElementById('dropzoneInner');
const photoPreview = document.getElementById('photoPreview');
let photoBase64 = null;

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    photoBase64 = reader.result; // data:image/...;base64,....
    photoPreview.src = photoBase64;
    photoPreview.hidden = false;
    dropzoneInner.hidden = true;
  };
  reader.readAsDataURL(file);
});

// ---- submit ----
const submitBtn = document.getElementById('submitBtn');
const btnLabel = submitBtn.querySelector('.btn-label');
const btnLoading = submitBtn.querySelector('.btn-loading');
const errorMsg = document.getElementById('errorMsg');
const resultsSection = document.getElementById('results');

submitBtn.addEventListener('click', async () => {
  errorMsg.hidden = true;

  const text = document.getElementById('textInput').value.trim();
  const undertone = document.getElementById('q-undertone').value;
  const shape = document.getElementById('q-shape').value;
  const style = document.getElementById('q-style').value.trim();
  const context = document.getElementById('q-context').value.trim();

  const hasAnything = photoBase64 || text || undertone || shape || style || context;
  if (!hasAnything) {
    errorMsg.textContent = "Share at least one thing — a photo, a description, or an answer — so there's something to work with.";
    errorMsg.hidden = false;
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/style', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoBase64,
        text,
        questionnaire: { undertone, shape, style, context }
      })
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed (${res.status})`);
    }

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    errorMsg.textContent = "Something went wrong reading your style: " + err.message;
    errorMsg.hidden = false;
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnLabel.hidden = isLoading;
  btnLoading.hidden = !isLoading;
}

function renderResults(data) {
  document.getElementById('summary').textContent = data.summary || '';
  document.getElementById('undertoneValue').textContent = data.undertone || '—';

  const chipsWrap = document.getElementById('colorChips');
  chipsWrap.innerHTML = '';
  (data.best_colors || []).forEach(name => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    const swatch = document.createElement('div');
    swatch.className = 'chip-swatch';
    swatch.style.background = colorNameToHex(name);
    const label = document.createElement('span');
    label.textContent = name;
    chip.appendChild(swatch);
    chip.appendChild(label);
    chipsWrap.appendChild(chip);
  });

  const cutsList = document.getElementById('cutsList');
  cutsList.innerHTML = '';
  (data.flattering_cuts || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    cutsList.appendChild(li);
  });

  const stylesList = document.getElementById('stylesList');
  stylesList.innerHTML = '';
  (data.style_directions || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    stylesList.appendChild(li);
  });

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Rough color-name -> hex fallback so swatches render even if Gemini
// returns plain-language color names instead of hex codes.
function colorNameToHex(name) {
  const probe = document.createElement('div');
  probe.style.color = name.toLowerCase().split(' ').pop(); // try last word e.g. "deep olive" -> "olive"
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return computed === 'rgba(0, 0, 0, 0)' ? '#B98A2E' : computed;
}

document.getElementById('againBtn').addEventListener('click', () => {
  resultsSection.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
