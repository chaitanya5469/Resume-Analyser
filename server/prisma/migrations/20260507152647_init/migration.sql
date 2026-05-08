-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "parsedText" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "title" TEXT,
    "targetRole" TEXT,
    "targetCompany" TEXT,
    "status" "ResumeStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "parsedText" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "atsScore" DOUBLE PRECISION NOT NULL,
    "keywordScore" DOUBLE PRECISION NOT NULL,
    "formattingScore" DOUBLE PRECISION NOT NULL,
    "readabilityScore" DOUBLE PRECISION NOT NULL,
    "experienceScore" DOUBLE PRECISION NOT NULL,
    "skillsScore" DOUBLE PRECISION NOT NULL,
    "skills" TEXT[],
    "experience" JSONB NOT NULL DEFAULT '[]',
    "education" JSONB NOT NULL DEFAULT '[]',
    "certifications" TEXT[],
    "keywords" TEXT[],
    "missingKeywords" TEXT[],
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "summary" TEXT NOT NULL,
    "tailoredResume" TEXT,
    "jobDescription" TEXT,
    "matchScore" DOUBLE PRECISION,
    "interviewQuestions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");

-- CreateIndex
CREATE INDEX "resumes_createdAt_idx" ON "resumes"("createdAt");

-- CreateIndex
CREATE INDEX "resume_versions_resumeId_idx" ON "resume_versions"("resumeId");

-- CreateIndex
CREATE INDEX "analyses_resumeId_idx" ON "analyses"("resumeId");

-- CreateIndex
CREATE INDEX "analyses_atsScore_idx" ON "analyses"("atsScore");

-- CreateIndex
CREATE INDEX "analyses_createdAt_idx" ON "analyses"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
