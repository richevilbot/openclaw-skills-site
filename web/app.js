const listEl = document.getElementById('skillsList');
const searchEl = document.getElementById('search');
const countEl = document.getElementById('count');
const generatedAtEl = document.getElementById('generatedAt');
const refreshBtn = document.getElementById('refreshBtn');

let state = { skills: [] };

function render(skills) {
  countEl.textContent = `Skills: ${skills.length}`;

  listEl.innerHTML = '';
  for (const skill of skills) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <h3>${skill.name}</h3>
      <p class="desc">${skill.description}</p>
      <div class="path">${skill.location}</div>
      <span class="badge">${skill.hasSkillFile ? 'SKILL.md found' : 'No SKILL.md'}</span>
    `;
    listEl.appendChild(li);
  }
}

function applyFilter() {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return render(state.skills);

  const filtered = state.skills.filter((s) =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.location.toLowerCase().includes(q)
  );
  render(filtered);
}

async function load() {
  const res = await fetch('./skills.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load skills.json');
  const data = await res.json();
  state = data;
  generatedAtEl.textContent = `Generated: ${new Date(data.generatedAt).toLocaleString()}`;
  render(state.skills || []);
}

searchEl.addEventListener('input', applyFilter);
refreshBtn.addEventListener('click', () => load().catch((e) => alert(e.message)));

load().catch((e) => {
  listEl.innerHTML = `<li class="card">Error: ${e.message}</li>`;
});
