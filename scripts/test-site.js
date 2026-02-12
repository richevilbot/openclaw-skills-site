#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'web/index.html',
  'web/styles.css',
  'web/app.js',
  'web/skills.json',
  'scripts/update-skills.js'
];

for (const rel of requiredFiles) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required file: ${rel}`);
    process.exit(1);
  }
}

const raw = fs.readFileSync(path.join(root, 'web', 'skills.json'), 'utf8');
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error('skills.json is not valid JSON');
  process.exit(1);
}

if (!Array.isArray(json.skills)) {
  console.error('skills.json: "skills" must be an array');
  process.exit(1);
}

const invalid = json.skills.find((s) => !s.name || !s.description || !s.location);
if (invalid) {
  console.error('skills.json contains invalid skill entry');
  process.exit(1);
}

console.log(`OK: validated ${json.skills.length} skills`);
