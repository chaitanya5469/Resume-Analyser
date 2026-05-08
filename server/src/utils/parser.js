import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

const SECTION_ALIASES = {
  skills: ['skills', 'technical skills', 'core skills', 'technologies', 'tools', 'tools technologies', 'tech stack', 'technical proficiencies'],
  education: ['education', 'academic background', 'academics', 'education and certifications', 'qualification', 'qualifications'],
  projects: ['projects', 'experience projects', 'projects experience', 'personal projects', 'academic projects', 'portfolio'],
  experience: ['experience', 'work experience', 'professional experience', 'employment history', 'career history'],
};

const ALL_SECTION_NAMES = Object.values(SECTION_ALIASES).flat();

export async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  const err = new Error('Unsupported file type. Upload a PDF or DOCX resume.');
  err.statusCode = 400;
  throw err;
}

export function cleanParsedText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeHeading(line) {
  return line
    .toLowerCase()
    .replace(/[:|/&]/g, ' ')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalSectionName(line) {
  const normalized = normalizeHeading(line);
  return Object.entries(SECTION_ALIASES).find(([, aliases]) => (
    aliases.includes(normalized) ||
    aliases.some((alias) => normalized.startsWith(`${alias} `) || normalized.endsWith(` ${alias}`))
  ))?.[0] || null;
}

function isAnySectionHeading(line) {
  return ALL_SECTION_NAMES.includes(normalizeHeading(line));
}

function splitItems(sectionText, { commaSeparated = false } = {}) {
  const separators = commaSeparated ? /\n|[;,\u2022]|(?:\s+-\s+)/ : /\n|[;\u2022]|(?:\s+-\s+)/;

  return sectionText
    .split(separators)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter((item) => item && /[a-z0-9]/i.test(item));
}

export function detectResumeSections(text) {
  const lines = cleanParsedText(text).split('\n');
  const sections = {
    skills: [],
    education: [],
    projects: [],
    experience: [],
  };

  let activeSection = null;

  for (const line of lines) {
    const inlineSection = line.match(/^([^:|]{2,40})[:|]\s*(.+)$/);
    if (inlineSection) {
      const heading = canonicalSectionName(inlineSection[1]);
      if (heading) {
        sections[heading].push(inlineSection[2].trim());
        continue;
      }
    }

    const heading = canonicalSectionName(line);
    if (heading) {
      activeSection = heading;
      continue;
    }

    if (isAnySectionHeading(line)) {
      activeSection = null;
      continue;
    }

    if (activeSection && line.trim()) {
      sections[activeSection].push(line.trim());
    }
  }

  return {
    skills: splitItems(sections.skills.join('\n'), { commaSeparated: true }),
    education: splitItems(sections.education.join('\n')),
    projects: splitItems(sections.projects.join('\n')),
    experience: splitItems(sections.experience.join('\n')),
  };
}

export async function parseResumeFile(filePath) {
  const rawText = await extractTextFromFile(filePath);
  const normalizedText = cleanParsedText(rawText);

  return {
    rawText,
    normalizedText,
    sections: detectResumeSections(normalizedText),
  };
}
