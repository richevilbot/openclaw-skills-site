#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skillsRoot = process.env.OPENCLAW_SKILLS_DIR || '/usr/lib/node_modules/openclaw/skills';
const outPath = path.join(root, 'web', 'skills.json');
const docsOutPath = path.join(root, 'docs', 'skills.json');

function readDescription(skillDir) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return 'No description available.';

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const firstParagraphLine = lines.find((l) =>
    !l.startsWith('#') &&
    !l.startsWith('```') &&
    !l.startsWith('- ') &&
    !l.startsWith('* ') &&
    l.length > 20
  );

  return firstParagraphLine || 'No description available.';
}

function collectSkills() {
  if (!fs.existsSync(skillsRoot)) {
    throw new Error(`Skills directory not found: ${skillsRoot}`);
  }

  const dirs = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  const skills = dirs.map((name) => {
    const location = path.join(skillsRoot, name);
    return {
      name,
      location,
      description: readDescription(location),
      hasSkillFile: fs.existsSync(path.join(location, 'SKILL.md'))
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceDir: skillsRoot,
    count: skills.length,
    skills
  };
}

function main() {
  const payload = collectSkills();
  const body = JSON.stringify(payload, null, 2);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, body);
  console.log(`Updated ${outPath} with ${payload.count} skills from ${payload.sourceDir}`);

  // Keep GitHub Pages docs/ in sync when present.
  fs.mkdirSync(path.dirname(docsOutPath), { recursive: true });
  fs.writeFileSync(docsOutPath, body);
  console.log(`Updated ${docsOutPath}`);
}

main();
