let stream = null;
let facingMode = 'environment';
let cameraDataUrl = null;
let uploadDataUrl = null;

function switchMode(mode) {
  document.getElementById('panelCamera').classList.toggle('active', mode === 'camera');
  document.getElementById('panelUpload').classList.toggle('active', mode === 'upload');
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', (i===0&&mode==='camera')||(i===1&&mode==='upload')));
  if (mode !== 'camera') stopStream();
  document.getElementById('resultSection').style.display = 'none';
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
    const v = document.getElementById('video');
    v.srcObject = stream; v.style.display = 'block';
    document.getElementById('placeholder').style.display = 'none';
    document.getElementById('liveBadge').classList.add('visible');
    document.getElementById('btnCapture').disabled = false;
    document.getElementById('btnFlip').disabled = false;
    document.getElementById('btnStart').disabled = true;
    toast('Camera started');
  } catch(e) { toast('Camera access denied'); }
}

function stopStream() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

async function flipCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  stopStream(); await startCamera();
}

function capturePhoto() {
  const v = document.getElementById('video');
  const c = document.getElementById('canvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  cameraDataUrl = c.toDataURL('image/jpeg', 0.92);
  const snap = document.getElementById('snapshot');
  snap.src = cameraDataUrl; snap.style.display = 'block';
  v.style.display = 'none';
  document.getElementById('liveBadge').classList.remove('visible');
  document.getElementById('btnCapture').disabled = true;
  document.getElementById('btnRetake').disabled = false;
  document.getElementById('btnUseCamera').disabled = false;
  toast('Photo captured');
}

function retakePhoto() {
  document.getElementById('snapshot').style.display = 'none';
  document.getElementById('video').style.display = 'block';
  document.getElementById('liveBadge').classList.add('visible');
  document.getElementById('btnCapture').disabled = false;
  document.getElementById('btnRetake').disabled = true;
  document.getElementById('btnUseCamera').disabled = true;
  cameraDataUrl = null;
}

function handleFile(e) { if (e.target.files[0]) loadFile(e.target.files[0]); }

const zone = document.getElementById('uploadZone');
zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
zone.addEventListener('drop', e => {
  e.preventDefault(); zone.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) loadFile(f);
});

function loadFile(file) {
  const r = new FileReader();
  r.onload = e => {
    uploadDataUrl = e.target.result;
    const prev = document.getElementById('uploadPreview');
    prev.src = uploadDataUrl; prev.style.display = 'block';
    zone.style.display = 'none';
    document.getElementById('uploadActions').style.display = 'flex';
    toast('Photo loaded');
  };
  r.readAsDataURL(file);
}

function clearUpload() {
  uploadDataUrl = null;
  document.getElementById('uploadPreview').style.display = 'none';
  zone.style.display = 'block';
  document.getElementById('uploadActions').style.display = 'none';
  document.getElementById('fileInput').value = '';
}

function usePhoto(source) {
  const dataUrl = source === 'camera' ? cameraDataUrl : uploadDataUrl;
  if (!dataUrl) return;
  if (source === 'camera') stopStream();
  const size = Math.round((dataUrl.length * 3) / 4);
  document.getElementById('resultThumb').src = dataUrl;
  document.getElementById('metaSource').textContent = source === 'camera' ? 'Camera' : 'Upload';
  document.getElementById('metaTime').textContent = new Date().toLocaleTimeString();
  document.getElementById('metaSize').textContent = size > 1048576 ? (size/1048576).toFixed(1)+' MB' : Math.round(size/1024)+' KB';
  document.getElementById('resultSection').style.display = 'block';
  document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

function resetAll() {
  cameraDataUrl = null; uploadDataUrl = null; stopStream();
  document.getElementById('video').style.display = 'none';
  document.getElementById('snapshot').style.display = 'none';
  document.getElementById('placeholder').style.display = 'block';
  document.getElementById('liveBadge').classList.remove('visible');
  document.getElementById('btnStart').disabled = false;
  ['btnCapture','btnRetake','btnFlip','btnUseCamera'].forEach(id => document.getElementById(id).disabled = true);
  clearUpload();
  document.getElementById('resultSection').style.display = 'none';
  switchMode('camera');
  window.scrollTo({ top: 0 });
}

function submitLook() {
  const dataUrl = document.getElementById('resultThumb').src;
  toast('Sending to backend…');

  fetch('/outfit/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl })
  })
  .then(r => r.json())
  .then(data => {
    console.log('Saved:', data);
    toast('Outfit saved!');
  })
  .catch(() => toast('Error — check console'));
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}