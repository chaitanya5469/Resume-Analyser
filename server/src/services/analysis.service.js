import prisma from '../config/prisma.js';
import { generateResumeImprovements, tailorResume, generateInterviewQuestions, generateCoverLetter } from './gemini.service.js';
import { scoreResumeDeterministically } from '../utils/atsScoring.js';
import { buildAnalysisPdf } from './report.service.js';

export async function runAnalysis(resumeId, userId) {
  // Verify ownership
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  // Mark processing
  await prisma.resume.update({ where: { id: resumeId }, data: { status: 'PROCESSING' } });

  try {
    const scoring = scoreResumeDeterministically(resume.parsedText, {
      targetRole: resume.targetRole,
    });

    const aiResult = await generateResumeImprovements(resume.parsedText, {
      atsScore: scoring.atsScore,
      keywordScore: scoring.keywordScore,
      skillsScore: scoring.skillsScore,
      missingKeywords: scoring.missingKeywords,
      actionVerbAnalysis: scoring.actionVerbAnalysis,
      weights: scoring.weights,
    });

    const interviewQuestions = await generateInterviewQuestions(
      resume.parsedText,
      resume.targetRole
    );

    const analysis = await prisma.analysis.create({
      data: {
        resumeId,
        atsScore: scoring.atsScore,
        keywordScore: scoring.keywordScore,
        formattingScore: scoring.formattingScore,
        readabilityScore: scoring.readabilityScore,
        experienceScore: scoring.experienceScore,
        skillsScore: scoring.skillsScore,
        skills: scoring.skills || [],
        keywords: scoring.keywords || [],
        missingKeywords: scoring.missingKeywords || [],
        experience: scoring.sections.experience || [],
        education: scoring.sections.education || [],
        certifications: aiResult.certifications || [],
        strengths: aiResult.strengths || [],
        weaknesses: aiResult.weaknesses || [],
        summary: aiResult.summary || '',
        suggestions: [
          ...(aiResult.suggestions || []),
          ...(aiResult.projectDescriptions || []).map((project) => ({
            category: 'Projects',
            priority: 'medium',
            text: project.improved || project.original,
          })),
          ...(aiResult.enhancedSummary ? [{
            category: 'Summary',
            priority: 'medium',
            text: aiResult.enhancedSummary,
          }] : []),
        ],
        interviewQuestions,
      },
    });

    await prisma.resume.update({ where: { id: resumeId }, data: { status: 'COMPLETED' } });

    return analysis;
  } catch (err) {
    await prisma.resume.update({ where: { id: resumeId }, data: { status: 'FAILED' } });
    throw err;
  }
}

export async function runTailoring(resumeId, userId, jobDescription) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  const latestAnalysis = await prisma.analysis.findFirst({
    where: { resumeId },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestAnalysis) {
    const err = new Error('Please run ATS analysis first');
    err.statusCode = 400;
    throw err;
  }

  const tailoredResult = await tailorResume(resume.parsedText, jobDescription);
  const matchScore = scoreResumeDeterministically(
    tailoredResult.tailoredResume || resume.parsedText,
    { jobDescription }
  ).atsScore;

  return prisma.analysis.update({
    where: { id: latestAnalysis.id },
    data: {
      tailoredResume: tailoredResult.tailoredResume,
      jobDescription,
      matchScore,
    },
  });
}

export async function getAnalysisById(id, userId) {
  const analysis = await prisma.analysis.findFirst({
    where: { id },
    include: { resume: { select: { userId: true, title: true, originalName: true } } },
  });

  if (!analysis || analysis.resume.userId !== userId) {
    const err = new Error('Analysis not found');
    err.statusCode = 404;
    throw err;
  }

  return analysis;
}

export async function getPublicAnalysis(id) {
  const analysis = await prisma.analysis.findUnique({
    where: { id },
    include: { resume: { select: { title: true, originalName: true, targetRole: true } } },
  });

  if (!analysis) {
    const err = new Error('Analysis not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    id: analysis.id,
    resume: analysis.resume,
    atsScore: analysis.atsScore,
    keywordScore: analysis.keywordScore,
    formattingScore: analysis.formattingScore,
    readabilityScore: analysis.readabilityScore,
    experienceScore: analysis.experienceScore,
    skillsScore: analysis.skillsScore,
    skills: analysis.skills,
    keywords: analysis.keywords,
    missingKeywords: analysis.missingKeywords,
    summary: analysis.summary,
    suggestions: analysis.suggestions,
    createdAt: analysis.createdAt,
  };
}

export async function exportAnalysisReport(id, userId) {
  const analysis = await getAnalysisById(id, userId);
  return buildAnalysisPdf({ resume: analysis.resume, analysis });
}

export async function createCoverLetter(resumeId, userId, { jobDescription, company }) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  return generateCoverLetter(resume.parsedText, jobDescription, company);
}
