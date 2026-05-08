import prisma from '../config/prisma.js';

export async function getUserAnalytics(userId) {
  const [resumes, analyses] = await Promise.all([
    prisma.resume.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        originalName: true,
        createdAt: true,
        status: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            atsScore: true,
            keywordScore: true,
            formattingScore: true,
            readabilityScore: true,
            experienceScore: true,
            skillsScore: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.analysis.findMany({
      where: { resume: { userId } },
      select: {
        atsScore: true,
        keywordScore: true,
        skills: true,
        missingKeywords: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Aggregate stats
  const totalResumes = resumes.length;
  const completedAnalyses = resumes.filter(r => r.status === 'COMPLETED').length;
  const avgAtsScore = analyses.length
    ? analyses.reduce((sum, a) => sum + a.atsScore, 0) / analyses.length
    : 0;

  const latestScore = analyses.at(-1)?.atsScore ?? 0;
  const previousScore = analyses.at(-2)?.atsScore ?? latestScore;
  const scoreImprovement = latestScore - previousScore;

  // Score over time
  const scoreHistory = analyses.map(a => ({
    date: a.createdAt,
    atsScore: a.atsScore,
    keywordScore: a.keywordScore,
  }));

  // Skill frequency
  const skillFreq = {};
  analyses.forEach(a => {
    (a.skills || []).forEach(skill => {
      skillFreq[skill] = (skillFreq[skill] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  return {
    stats: {
      totalResumes,
      completedAnalyses,
      avgAtsScore: Math.round(avgAtsScore),
      latestScore,
      scoreImprovement,
    },
    scoreHistory,
    topSkills,
    resumes: resumes.map(r => ({
      ...r,
      latestAnalysis: r.analyses[0] ?? null,
    })),
  };
}
