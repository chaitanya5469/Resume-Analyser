import * as resumeService from '../services/resume.service.js';

export async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const resume = await resumeService.uploadResume(req.user.id, req.file, req.body);
    res.status(201).json(resume);
  } catch (err) { next(err); }
}

export async function getAll(req, res, next) {
  try {
    const resumes = await resumeService.getUserResumes(req.user.id, req.query);
    res.json(resumes);
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const resume = await resumeService.getResumeById(req.params.id, req.user.id);
    res.json(resume);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    await resumeService.deleteResume(req.params.id, req.user.id);
    res.json({ message: 'Resume deleted' });
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const resume = await resumeService.updateResumeMeta(req.params.id, req.user.id, req.body);
    res.json(resume);
  } catch (err) { next(err); }
}
