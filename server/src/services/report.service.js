import PDFDocument from 'pdfkit';

export function buildAnalysisPdf({ resume, analysis }) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(22).fillColor('#111827').text('Resume ATS Report', { continued: false });
    doc.moveDown(0.4).fontSize(11).fillColor('#64748b').text(resume.title || resume.originalName);
    doc.moveDown();

    doc.fontSize(36).fillColor('#4f46e5').text(`${Math.round(analysis.atsScore)}%`);
    doc.fontSize(12).fillColor('#334155').text('Overall ATS score');
    doc.moveDown();

    const rows = [
      ['Keywords', analysis.keywordScore],
      ['Formatting', analysis.formattingScore],
      ['Readability', analysis.readabilityScore],
      ['Experience', analysis.experienceScore],
      ['Skills', analysis.skillsScore],
    ];

    rows.forEach(([label, value]) => {
      doc.fontSize(11).fillColor('#0f172a').text(`${label}: ${Math.round(value)}%`);
    });

    doc.moveDown().fontSize(14).fillColor('#111827').text('Summary');
    doc.fontSize(10).fillColor('#334155').text(analysis.summary || 'No summary available.', { lineGap: 4 });

    doc.moveDown().fontSize(14).fillColor('#111827').text('Detected Skills');
    doc.fontSize(10).fillColor('#334155').text((analysis.skills || []).join(', ') || 'No skills detected.', { lineGap: 4 });

    doc.moveDown().fontSize(14).fillColor('#111827').text('Top Suggestions');
    (analysis.suggestions || []).slice(0, 8).forEach((item) => {
      doc.fontSize(10).fillColor('#334155').text(`- ${item.category || 'General'}: ${item.text}`, { lineGap: 4 });
    });

    doc.end();
  });
}
