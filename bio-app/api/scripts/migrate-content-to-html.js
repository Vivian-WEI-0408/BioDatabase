const { prisma } = require('../src/services/db');
const { sectionsJsonToHtml } = require('../src/utils/documentContent');

async function migrateDocumentContentToHtml() {
  const pages = await prisma.$queryRawUnsafe(
    'SELECT id, content_json FROM document_pages'
  );

  for (const page of pages) {
    const raw = page.content_json || '';
    let contentHtml = '';

    if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.sections)) {
          contentHtml = sectionsJsonToHtml(parsed.sections);
        }
      } catch {
        contentHtml = raw;
      }
    } else {
      contentHtml = raw;
    }

    await prisma.$executeRawUnsafe(
      'UPDATE document_pages SET content_html = ? WHERE id = ?',
      contentHtml,
      page.id
    );
  }

  console.log(`Migrated ${pages.length} document pages to content_html.`);
}

migrateDocumentContentToHtml()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
