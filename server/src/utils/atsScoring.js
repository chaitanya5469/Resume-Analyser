import { detectResumeSections } from './parser.js';

export const ACTION_VERBS = [
  'achieved', 'architected', 'automated', 'built', 'collaborated', 'created',
  'delivered', 'designed', 'developed', 'drove', 'enhanced', 'implemented',
  'improved', 'increased', 'launched', 'led', 'managed', 'optimized',
  'reduced', 'shipped', 'streamlined',
];

export const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'react', 'node.js', 'express', 'postgresql',
  'mongodb', 'sql', 'python', 'java', 'aws', 'docker', 'kubernetes', 'git',
  'rest api', 'graphql', 'html', 'css', 'tailwind', 'redux', 'prisma',
  'testing', 'ci/cd', 'agile', 'microservices', 'data analysis', 'next.js',
  'vue', 'angular', 'nestjs', 'spring boot', 'mysql', 'redis', 'firebase',
  'azure', 'gcp', 'linux', 'figma', 'jest', 'cypress', 'playwright',
  'machine learning', 'excel', 'power bi', 'tableau',
];

export const ROLE_KEYWORDS = {
  frontend: ['react', 'javascript', 'typescript', 'html', 'css', 'accessibility', 'performance'],
  backend: ['node.js', 'express', 'postgresql', 'api', 'database', 'microservices', 'authentication'],
  fullstack: ['react', 'node.js', 'express', 'postgresql', 'api', 'typescript', 'testing'],
  data: ['python', 'sql', 'analytics', 'dashboard', 'statistics', 'machine learning', 'etl'],
  default: ['communication', 'collaboration', 'leadership', 'problem solving', 'ownership', 'testing'],
};

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqCaseInsensitive(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalize(text) {
  return String(text || '').toLowerCase();
}

function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, 'i').test(text);
}

export function getExpectedKeywords(targetRole = '') {
  const role = normalize(targetRole);
  const roleSet = Object.entries(ROLE_KEYWORDS).find(([key]) => role.includes(key))?.[1] || ROLE_KEYWORDS.default;
  return uniq([...roleSet, ...ROLE_KEYWORDS.default]);
}

export function extractKeywords(text, sourceKeywords = SKILL_KEYWORDS) {
  const normalized = normalize(text);
  return sourceKeywords.filter((keyword) => hasKeyword(normalized, keyword));
}

export function analyzeActionVerbs(text) {
  const normalized = normalize(text);
  const found = ACTION_VERBS.filter((verb) => hasKeyword(normalized, verb));

  return {
    found,
    missing: ACTION_VERBS.filter((verb) => !found.includes(verb)).slice(0, 8),
    score: clamp((found.length / 8) * 100),
  };
}

export function scoreResumeDeterministically(text, { targetRole = '', jobDescription = '' } = {}) {
  const normalized = normalize(text);
  const sections = detectResumeSections(text);
  const expectedKeywords = jobDescription
    ? extractJobKeywords(jobDescription)
    : getExpectedKeywords(targetRole);
  const resumeKeywords = extractKeywords(text, uniq([...SKILL_KEYWORDS, ...expectedKeywords]));
  const matchedExpected = expectedKeywords.filter((keyword) => hasKeyword(normalized, keyword));
  const missingKeywords = expectedKeywords.filter((keyword) => !matchedExpected.includes(keyword)).slice(0, 10);
  const actionVerbAnalysis = analyzeActionVerbs(text);
  const detectedSkillCount = uniqCaseInsensitive([...sections.skills, ...resumeKeywords]).length;

  const keywordScore = expectedKeywords.length
    ? clamp(45 + (matchedExpected.length / expectedKeywords.length) * 55)
    : 35;
  const skillsScore = detectedSkillCount
    ? clamp(50 + (Math.min(detectedSkillCount, 10) / 10) * 50)
    : 35;
  const experienceScore = sections.experience.length
    ? clamp(45 + Math.min(sections.experience.length, 8) / 8 * 35 + actionVerbAnalysis.score * 0.2)
    : clamp(25 + actionVerbAnalysis.score * 0.25);
  const educationScore = sections.education.length ? 100 : 45;
  const formattingScore = clamp(
    (detectedSkillCount ? 25 : 0) +
    (sections.education.length ? 25 : 0) +
    (sections.projects.length ? 20 : 0) +
    (sections.experience.length ? 30 : 0)
  );
  const readabilityScore = scoreReadability(text);

  const weights = {
    keywordScore: 0.25,
    skillsScore: 0.2,
    experienceScore: 0.2,
    formattingScore: 0.15,
    readabilityScore: 0.1,
    educationScore: 0.1,
  };

  const atsScore = clamp(
    keywordScore * weights.keywordScore +
    skillsScore * weights.skillsScore +
    experienceScore * weights.experienceScore +
    formattingScore * weights.formattingScore +
    readabilityScore * weights.readabilityScore +
    educationScore * weights.educationScore
  );

  return {
    atsScore,
    keywordScore,
    formattingScore,
    readabilityScore,
    experienceScore,
    skillsScore,
    educationScore,
    weights,
    skills: uniqCaseInsensitive([...sections.skills, ...resumeKeywords]).slice(0, 30),
    keywords: resumeKeywords,
    missingKeywords,
    actionVerbAnalysis,
    sections,
  };
}

export function extractJobKeywords(jobDescription) {
  const words = normalize(jobDescription)
    .replace(/[^a-z0-9+#.\s/-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const counts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const frequentWords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .filter((word) => !STOP_WORDS.has(word))
    .slice(0, 20);

  return uniq([...extractKeywords(jobDescription), ...frequentWords]).slice(0, 25);
}

function scoreReadability(text) {
  const sentences = String(text || '').split(/[.!?]+/).filter((sentence) => sentence.trim().length > 20);
  const words = String(text || '').split(/\s+/).filter(Boolean);
  if (!words.length) return 0;

  const averageSentenceLength = sentences.length ? words.length / sentences.length : words.length;
  const sentenceScore = averageSentenceLength <= 24 ? 100 : Math.max(45, 100 - (averageSentenceLength - 24) * 3);
  const bulletScore = /^[\s*-]/m.test(text) ? 100 : 65;

  return clamp(sentenceScore * 0.7 + bulletScore * 0.3);
}

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'you', 'our', 'are', 'that', 'this', 'will',
  'from', 'have', 'has', 'your', 'about', 'into', 'using', 'their', 'they',
  'team', 'work', 'role', 'job', 'candidate', 'experience',
]);
