import * as analysisService from '../services/analysis.service.js';

export async function analyze(req, res, next) {
  try {
    const { resumeId } = req.params;
    const analysis = await analysisService.runAnalysis(resumeId, req.user.id);
    res.status(201).json(analysis);
  } catch (err) { next(err); }
}

export async function tailor(req, res, next) {
  try {
    const { resumeId } = req.params;
    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description required' });
    const result = await analysisService.runTailoring(resumeId, req.user.id, jobDescription);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const analysis = await analysisService.getAnalysisById(req.params.id, req.user.id);
    res.json(analysis);
  } catch (err) { next(err); }
}

export async function getPublic(req, res, next) {
  try {
    const analysis = await analysisService.getPublicAnalysis(req.params.id);
    res.json(analysis);
  } catch (err) { next(err); }
}

export async function exportReport(req, res, next) {
  try {
    const pdf = await analysisService.exportAnalysisReport(req.params.id, req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resume-analysis-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err) { next(err); }
}

export async function coverLetter(req, res, next) {
  try {
    const result = await analysisService.createCoverLetter(req.params.resumeId, req.user.id, req.body);
    res.json(result);
  } catch (err) { next(err); }
}
