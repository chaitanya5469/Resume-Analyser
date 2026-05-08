import prisma from '../config/prisma.js';
import { parseResumeFile } from '../utils/parser.js';
import fs from 'fs';

export async function uploadResume(userId, file, body) {
  const { title, targetRole, targetCompany } = body;

  const parsedDocument = await parseResumeFile(file.path);

  const resume = await prisma.resume.create({
    data: {
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size,
      parsedText: parsedDocument.normalizedText,
      title: title || file.originalname,
      targetRole,
      targetCompany,
      status: 'PENDING',
    },
  });

  return { ...resume, parsedSections: parsedDocument.sections };
}

export async function getUserResumes(userId, { page, limit } = {}) {
  const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const skip = Math.max(((Number(page) || 1) - 1) * take, 0);
  const paginated = page || limit;

  const [items, total] = await Promise.all([
    prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    ...(paginated ? { skip, take } : {}),
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { atsScore: true, createdAt: true, id: true },
      },
    },
    }),
    paginated ? prisma.resume.count({ where: { userId } }) : Promise.resolve(null),
  ]);

  if (!paginated) return items;

  return {
    items,
    pagination: {
      page: Number(page) || 1,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function getResumeById(id, userId) {
  const resume = await prisma.resume.findFirst({
    where: { id, userId },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
      },
      versions: {
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  return resume;
}

export async function deleteResume(id, userId) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete file from disk
  if (resume.fileName) {
    const filePath = `uploads/${resume.fileName}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await prisma.resume.delete({ where: { id } });
}

export async function updateResumeMeta(id, userId, data) {
  const resume = await prisma.resume.findFirst({ where: { id, userId } });
  if (!resume) {
    const err = new Error('Resume not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.resume.update({
    where: { id },
    data: { title: data.title, targetRole: data.targetRole, targetCompany: data.targetCompany },
  });
}
