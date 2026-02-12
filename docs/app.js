const listEl = document.getElementById('skillsList');
const searchEl = document.getElementById('search');
const countEl = document.getElementById('count');
const generatedAtEl = document.getElementById('generatedAt');
const avgOverallEl = document.getElementById('avgOverall');
const avgQualityEl = document.getElementById('avgQuality');
const avgSecurityEl = document.getElementById('avgSecurity');
const refreshBtn = document.getElementById('refreshBtn');

const communityStatusEl = document.getElementById('communityStatus');
const communityCountEl = document.getElementById('communityCount');
const communityListEl = document.getElementById('communityList');

let state = { skills: [], summary: {} };

function badgeClass(score) {
  if (score >= 85) return 'score great';
  if (score >= 70) return 'score good';
  if (score >= 50) return 'score fair';
  return 'score bad';
}

function render(skills) {
  countEl.textContent = `Skills: ${skills.length}`;
  listEl.innerHTML = '';

  for (const skill of skills) {
    const li = document.createElement('li');
    li.className = 'card';

    const findings = (skill.securityFindings || []).slice(0, 2).map((f) => `<li>${f}</li>`).join('');
    const gaps = (skill.qualityGaps || []).slice(0, 2).map((g) => `<li>${g}</li>`).join('');

    li.innerHTML = `
      <div class="row">
        <h3>${skill.name}</h3>
        <span class="pill ${skill.securityRisk || 'medium'}">${(skill.securityRisk || 'medium').toUpperCase()} risk</span>
      </div>
      <p class="desc">${skill.description}</p>
      <div class="score-row">
        <span class="${badgeClass(skill.overallScore)}">Overall ${skill.overallScore}</span>
        <span class="${badgeClass(skill.qualityScore)}">Quality ${skill.qualityScore}</span>
        <span class="${badgeClass(skill.securityScore)}">Security ${skill.securityScore}</span>
      </div>
      <div class="path">${skill.location}</div>
      <span class="badge">${skill.hasSkillFile ? 'SKILL.md found' : 'No SKILL.md'}</span>
      ${findings ? `<div class="section"><strong>Security findings:</strong><ul>${findings}</ul></div>` : ''}
      ${gaps ? `<div class="section"><strong>Quality gaps:</strong><ul>${gaps}</ul></div>` : ''}
    `;
    listEl.appendChild(li);
  }
}

function renderCommunity(items) {
  if (!communityListEl) return;
  if (!items?.length) {
    communityListEl.innerHTML = '<li class="muted">No community skills preview available yet. Open ClawHub for full catalog.</li>';
    return;
  }

  communityListEl.innerHTML = items.slice(0, 8).map((item) => {
    const name = item.name || item.title || 'Unnamed skill';
    const desc = item.description || item.summary || '';
    const url = item.url || item.link || 'https://clawhub.ai';
    return `<li><a href="${url}" target="_blank" rel="noopener">${name}</a>${desc ? ` — ${desc}` : ''}</li>`;
  }).join('');
}

async function loadCommunity() {
  if (!communityStatusEl) return;

  const candidates = [
    'https://clawhub.ai/skills.json',
    'https://clawhub.ai/api/skills.json',
    'https://clawhub.ai/community-skills.json'
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.skills || data.items || []);
      communityStatusEl.textContent = `Community source: ${url}`;
      communityCountEl.textContent = `Community skills: ${items.length}`;
      renderCommunity(items);
      return;
    } catch (_) {}
  }

  communityStatusEl.textContent = 'Community source: clawhub.ai (directory link mode)';
  communityCountEl.textContent = 'Community skills: external catalog';
  renderCommunity([]);
}

function applyFilter() {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return render(state.skills);

  const filtered = state.skills.filter((s) =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.location.toLowerCase().includes(q) ||
    String(s.overallScore).includes(q) ||
    (s.securityRisk || '').toLowerCase().includes(q)
  );
  render(filtered);
}

async function load() {
  const res = await fetch('./skills.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load skills.json');
  const data = await res.json();

  state = data;
  generatedAtEl.textContent = `Generated: ${new Date(data.generatedAt).toLocaleString()}`;
  avgOverallEl.textContent = `Avg overall: ${data.summary?.avgOverall ?? '-'}`;
  avgQualityEl.textContent = `Avg quality: ${data.summary?.avgQuality ?? '-'}`;
  avgSecurityEl.textContent = `Avg security: ${data.summary?.avgSecurity ?? '-'}`;
  render(state.skills || []);
  await loadCommunity();
}

searchEl.addEventListener('input', applyFilter);
refreshBtn.addEventListener('click', () => load().catch((e) => alert(e.message)));

load().catch((e) => {
  listEl.innerHTML = `<li class="card">Error: ${e.message}</li>`;
});
