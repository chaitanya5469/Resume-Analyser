import { getGeminiModel } from '../config/gemini.js';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_RESUME_CHARS = 7000;
const MAX_JOB_CHARS = 3000;

const model = () => getGeminiModel(DEFAULT_MODEL);

const promptTemplates = {
  improvements: ({ parsedText, scoring }) => `
You are a resume editor. Use the deterministic ATS signals below for context, but do not produce or alter numeric scores.

Resume:
"""
${limitText(parsedText, MAX_RESUME_CHARS)}
"""

Deterministic ATS signals:
${JSON.stringify(scoring)}

Return ONLY valid compact JSON with this shape:
{
  "summary": "2 sentence resume assessment",
  "strengths": ["specific strength"],
  "weaknesses": ["specific weakness"],
  "suggestions": [
    { "category": "Keywords|Formatting|Experience|Skills|Summary|Projects", "priority": "high|medium|low", "text": "actionable suggestion" }
  ],
  "projectDescriptions": [
    { "original": "brief existing project description or title", "improved": "stronger quantified project bullet" }
  ],
  "enhancedSummary": "improved resume summary paragraph"
}`,

  tailoring: ({ parsedText, jobDescription }) => `
You are a professional resume writer. Tailor the resume below to the job description without inventing experience.

Resume:
"""
${limitText(parsedText, 6000)}
"""

Job Description:
"""
${limitText(jobDescription, MAX_JOB_CHARS)}
"""

Return ONLY valid compact JSON:
{
  "tailoredResume": "full tailored resume as plain text, preserving sections",
  "addedKeywords": ["keyword added or emphasized"],
  "changes": ["short change summary"]
}`,

  interviewQuestions: ({ parsedText, targetRole }) => `
Generate 15 targeted interview questions for the role: "${targetRole || 'Software Engineer'}".

Resume:
"""
${limitText(parsedText, 5000)}
"""

Return ONLY valid compact JSON:
{
  "questions": [
    { "type": "behavioral|technical|situational", "question": "question text", "hint": "brief tip" }
  ]
}`,

  coverLetter: ({ parsedText, jobDescription, company }) => `
Write a concise, premium-quality cover letter using only facts present in the resume.

Resume:
"""
${limitText(parsedText, 5000)}
"""

Job Description:
"""
${limitText(jobDescription, MAX_JOB_CHARS)}
"""

Company: ${company || 'the company'}

Return ONLY valid compact JSON:
{
  "coverLetter": "cover letter text with greeting, 3 body paragraphs, and closing",
  "highlights": ["resume strength emphasized"],
  "tone": "professional"
}`,
};

function limitText(text, maxChars) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars);
}

function stripJsonFences(text) {
  return text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
}

/**
 * Attempt to repair truncated JSON by closing open strings, arrays, and objects.
 * This handles the case where Gemini hits the maxOutputTokens limit mid-response.
 */
function repairTruncatedJson(text) {
  let repaired = text.trim();

  // Remove trailing comma that would make JSON invalid
  repaired = repaired.replace(/,\s*$/, '');

  // Track open brackets/braces to know what needs closing
  let inString = false;
  let escaped = false;
  const stack = [];

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' || ch === ']') stack.pop();
  }

  // If we're inside a string, close it
  if (inString) repaired += '"';

  // Remove any trailing partial key-value like `"key": ` or `, "key":`
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*$/, '');

  // Close all open brackets/braces
  while (stack.length) {
    const open = stack.pop();
    repaired += open === '{' ? '}' : ']';
  }

  return repaired;
}

function parseJsonResponse(text) {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting the JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch { /* fall through to repair */ }
    }

    // Attempt to repair truncated JSON
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const repaired = repairTruncatedJson(cleaned.slice(jsonStart));
        return JSON.parse(repaired);
      } catch { /* give up */ }
    }

    throw new Error('Gemini returned an invalid JSON response');
  }
}

async function generateJSON(prompt, { retries = 2 } = {}) {
  let lastError;

  const fullPrompt = `
Return ONLY valid JSON.
No markdown.
No explanation text.
Ensure the JSON is syntactically correct.

${prompt}
`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let rawText = '';

    try {
      const result = await model().generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      });

      rawText = result.response.text();

      // Use the robust parseJsonResponse which can handle truncation
      return parseJsonResponse(rawText);
    } catch (err) {
      err.rawText = rawText;
      lastError = err;

      console.error('INVALID JSON RESPONSE:\n', rawText);

      if (attempt < retries) {
        await new Promise((r) =>
          setTimeout(r, 400 * 2 ** attempt)
        );
      }
    }
  }

  console.error('All Gemini retries exhausted. Last error:', lastError?.message);
  if (lastError?.rawText) {
    console.error('Last raw response (first 500 chars):', lastError.rawText.slice(0, 500));
  }

  const error = new Error(
    'AI analysis is temporarily unavailable. Please try again in a moment.'
  );

  error.statusCode = 502;

  throw error;
}

export async function generateResumeImprovements(parsedText, scoring) {
  return generateJSON(promptTemplates.improvements({ parsedText, scoring }));
}

export async function tailorResume(parsedText, jobDescription) {
  return generateJSON(promptTemplates.tailoring({ parsedText, jobDescription }));
}

export async function generateInterviewQuestions(parsedText, targetRole) {
  const result = await generateJSON(promptTemplates.interviewQuestions({ parsedText, targetRole }));
  return result.questions || [];
}

export async function generateCoverLetter(parsedText, jobDescription, company) {
  return generateJSON(promptTemplates.coverLetter({ parsedText, jobDescription, company }));
}
