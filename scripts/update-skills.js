#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skillsRoot = process.env.OPENCLAW_SKILLS_DIR || '/usr/lib/node_modules/openclaw/skills';
const webOutPath = path.join(root, 'web', 'skills.json');
const docsOutPath = path.join(root, 'docs', 'skills.json');

function safeRead(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readDescription(mdContent) {
  const lines = mdContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const firstParagraphLine = lines.find((l) =>
    !l.startsWith('#') &&
    !l.startsWith('```') &&
    !l.startsWith('- ') &&
    !l.startsWith('* ') &&
    l.length > 20
  );
  return firstParagraphLine || 'No description available.';
}

function scoreQuality(mdContent) {
  const checks = [
    { key: 'hasTitle', ok: /^#\s+/m.test(mdContent), points: 20, note: 'Title/header present' },
    { key: 'hasUsage', ok: /(usage|example|how to|quick start)/i.test(mdContent), points: 20, note: 'Usage/examples present' },
    { key: 'hasStructure', ok: /^##\s+/m.test(mdContent), points: 15, note: 'Structured sections present' },
    { key: 'hasConstraints', ok: /(constraint|do not|must|never|required)/i.test(mdContent), points: 20, note: 'Behavior constraints documented' },
    { key: 'hasCommands', ok: /```[\s\S]*?```/m.test(mdContent), points: 15, note: 'Command/code snippets included' },
    { key: 'hasLength', ok: mdContent.length > 400, points: 10, note: 'Sufficient depth/detail' }
  ];

  let score = 0;
  const strengths = [];
  const gaps = [];

  for (const c of checks) {
    if (c.ok) {
      score += c.points;
      strengths.push(c.note);
    } else {
      gaps.push(c.note);
    }
  }

  return { score, strengths, gaps };
}

function scoreSecurity(mdContent) {
  // start high, subtract risk penalties
  let score = 100;
  const findings = [];

  const riskyPatterns = [
    { re: /\brm\s+-rf\b/i, penalty: 25, note: 'Contains destructive delete command pattern (rm -rf)' },
    { re: /\bcurl\b.*\|\s*(sh|bash)\b/i, penalty: 25, note: 'Contains remote shell execution pattern (curl | sh)' },
    { re: /\bsudo\b/i, penalty: 10, note: 'Uses elevated privileges (sudo)' },
    { re: /\b(eval|exec)\b/i, penalty: 8, note: 'Mentions dynamic execution keywords (eval/exec)' },
    { re: /\b(token|secret|password|api key)\b/i, penalty: 6, note: 'References sensitive credentials; verify safe handling' },
    { re: /\bexternal|internet|network|http(s)?:\/\//i, penalty: 6, note: 'Uses external/network resources; verify trust boundaries' }
  ];

  for (const p of riskyPatterns) {
    if (p.re.test(mdContent)) {
      score -= p.penalty;
      findings.push(p.note);
    }
  }

  const hasSafetyLanguage = /(safety|safe|ask first|confirm|permission|non-destructive|read-only)/i.test(mdContent);
  if (hasSafetyLanguage) {
    score += 8;
  } else {
    findings.push('No explicit safety/permission language detected');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    findings: findings.slice(0, 6),
    riskLevel: score >= 85 ? 'low' : score >= 65 ? 'medium' : 'high'
  };
}

function summarizeOverall(qualityScore, securityScore) {
  const overallScore = Math.round(qualityScore * 0.6 + securityScore * 0.4);
  const band = overallScore >= 85 ? 'excellent' : overallScore >= 70 ? 'good' : overallScore >= 50 ? 'fair' : 'needs-work';
  return { overallScore, band };
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
    const skillMdPath = path.join(location, 'SKILL.md');
    const md = safeRead(skillMdPath);

    const quality = scoreQuality(md);
    const security = scoreSecurity(md);
    const summary = summarizeOverall(quality.score, security.score);

    return {
      name,
      location,
      description: md ? readDescription(md) : 'No description available.',
      hasSkillFile: fs.existsSync(skillMdPath),
      qualityScore: quality.score,
      securityScore: security.score,
      overallScore: summary.overallScore,
      band: summary.band,
      securityRisk: security.riskLevel,
      strengths: quality.strengths.slice(0, 4),
      qualityGaps: quality.gaps.slice(0, 4),
      securityFindings: security.findings
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    sourceDir: skillsRoot,
    count: skills.length,
    summary: {
      avgOverall: skills.length ? Math.round(skills.reduce((a, s) => a + s.overallScore, 0) / skills.length) : 0,
      avgQuality: skills.length ? Math.round(skills.reduce((a, s) => a + s.qualityScore, 0) / skills.length) : 0,
      avgSecurity: skills.length ? Math.round(skills.reduce((a, s) => a + s.securityScore, 0) / skills.length) : 0
    },
    skills
  };
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function main() {
  const payload = collectSkills();
  writeJson(webOutPath, payload);
  console.log(`Updated ${webOutPath} with ${payload.count} skills`);

  writeJson(docsOutPath, payload);
  console.log(`Updated ${docsOutPath}`);
}

main();
