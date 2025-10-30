
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
  });
});

// LocalStorage setup
const STORAGE_KEY = 'climate_pledges_v1';
function uid() { return 'P' + Date.now().toString(36).toUpperCase().slice(-8); }
function getPledges() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function savePledges(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

// Seed demo data if empty
function seedDemo() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const demo = [
      { id: uid(), name: 'Asha', date: new Date().toISOString(), state: 'State A', profile: 'Student', commits: 2 },
      { id: uid(), name: 'Rahul', date: new Date().toISOString(), state: 'State B', profile: 'Working Professional', commits: 4 }
    ];
    savePledges(demo);
  }
}
seedDemo();

// Update KPI counts
function updateKPIs() {
  const pledges = getPledges();
  document.getElementById('achieved').textContent = pledges.length;
  document.getElementById('studentsCount').textContent = pledges.filter(p => p.profile === 'Student').length;
  document.getElementById('proCount').textContent = pledges.filter(p => p.profile === 'Working Professional').length;
}

// Render pledge table
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function renderTable() {
  const tbody = document.querySelector('#pledgeTable tbody');
  tbody.innerHTML = '';
  getPledges().slice().reverse().forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${new Date(p.date).toLocaleString()}</td>
      <td>${escapeHtml(p.state || '—')}</td>
      <td>${escapeHtml(p.profile)}</td>
      <td>${'⭐'.repeat(Math.min(5, p.commits))}</td>
    `;
    tbody.appendChild(tr);
  });
}
updateKPIs();
renderTable();

// Form submission
const form = document.getElementById('form');
form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get('name').trim();
  const email = data.get('email').trim();
  const mobile = data.get('mobile').trim();
  const state = data.get('state');
  const profile = data.get('profile');
  const commits = [...form.querySelectorAll('input[name="commit"]:checked')].map(i => i.value);

  if (!name || !email || !mobile) {
    alert('Please fill required fields');
    return;
  }

  const pledge = {
    id: uid(),
    name, email, mobile, state, profile,
    commitsCount: commits.length,
    commits,
    date: new Date().toISOString()
  };

  const stored = getPledges();
  stored.push({
    id: pledge.id,
    name: pledge.name,
    date: pledge.date,
    state: pledge.state,
    profile: pledge.profile,
    commits: pledge.commitsCount
  });

  savePledges(stored);
  updateKPIs();
  renderTable();
  generateCertificate(pledge.name, pledge.commitsCount);
  form.reset();
  document.getElementById('downloadCert').disabled = false;
  document.getElementById('shareCert').disabled = false;
  document.getElementById('certificate').scrollIntoView({ behavior: 'smooth' });
});

// Certificate logic
const canvas = document.getElementById('certCanvas');
const ctx = canvas.getContext('2d');

function generateCertificate(name, commitCount) {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#e6fcf6');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#06323a';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Climate Action Pledge', w / 2, 80);

  ctx.font = '700 28px Arial';
  ctx.fillText(name, w / 2, 150);
  ctx.font = '18px Arial';
  ctx.fillText('is Cool Enough to Care!', w / 2, 185);

  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0b7a6b';
  ctx.fillText(`Commitments chosen: ${commitCount}`, 50, 240);

  const stars = Math.min(5, commitCount);
  ctx.textAlign = 'center';
  ctx.font = '28px Arial';
  ctx.fillText('❤️ '.repeat(stars), w / 2, 320);

  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6b7280';
  ctx.fillText('Verified by Climate Action Pledge', w - 20, h - 30);
}

// Download certificate
document.getElementById('downloadCert').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'climate-pledge-certificate.png';
  link.click();
});

// Copy share link (data URL)
document.getElementById('shareCert').addEventListener('click', async () => {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    await navigator.clipboard.writeText(dataUrl);
    alert('Certificate copied to clipboard (data URL). Paste it in chat or share.');
  } catch {
    alert('Could not copy to clipboard.');
  }
});
