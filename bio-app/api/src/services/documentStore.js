const { prisma } = require('./db');
const {
  stripHtmlTags,
  extractSummaryFromHtml,
  normalizeLegacyContentHtml,
} = require('../utils/documentContent');

const DEFAULT_PAGE_ID = 'resources';

async function getTree() {
  const sections = await prisma.documentSection.findMany({
    orderBy: { sort_order: 'asc' },
    include: {
      pages: {
        orderBy: { sort_order: 'asc' },
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return {
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      expanded: section.expanded_default,
      items: section.pages.map((page) => ({
        id: page.id,
        title: page.title,
      })),
    })),
    defaultPageId: DEFAULT_PAGE_ID,
  };
}

async function getPage(pageId) {
  const page = await prisma.documentPage.findUnique({
    where: { id: pageId || DEFAULT_PAGE_ID },
    include: {
      section: true,
    },
  });

  if (!page) {
    const fallback = await prisma.documentPage.findUnique({
      where: { id: DEFAULT_PAGE_ID },
      include: { section: true },
    });

    if (!fallback) {
      return null;
    }

    return buildPageResponse(fallback);
  }

  return buildPageResponse(page);
}

function buildPageResponse(page) {
  const contentHtml = normalizeLegacyContentHtml(page.content_html);

  return {
    breadcrumb: [
      { label: page.section.title, sectionId: page.section.id },
      { label: page.title },
    ],
    title: page.title,
    intro: page.intro,
    heroImage: page.hero_image,
    contentHtml,
    summary: extractSummaryFromHtml(contentHtml),
  };
}

function pickMatchedDocumentText(page, query, contentHtml) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return page.intro || '';
  }

  const plainContent = stripHtmlTags(contentHtml);
  const candidates = [
    page.title,
    page.intro,
    plainContent,
  ].filter(Boolean);

  return candidates.find((item) =>
    String(item).toLowerCase().includes(normalizedQuery)
  ) || page.intro || candidates[0] || '';
}

function matchesDocumentPage(page, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return false;
  }

  const contentHtml = normalizeLegacyContentHtml(page.content_html);
  const searchable = [
    page.title,
    page.intro,
    stripHtmlTags(contentHtml),
  ].filter(Boolean).join(' ').toLowerCase();

  return searchable.includes(normalizedQuery);
}

async function searchDocuments(query, { limit = 5 } = {}) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    return { items: [], total: 0 };
  }

  const pages = await prisma.documentPage.findMany({
    include: { section: true },
    orderBy: [
      { section: { sort_order: 'asc' } },
      { sort_order: 'asc' },
    ],
  });
  const matchedPages = pages.filter((page) => matchesDocumentPage(page, normalizedQuery));
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 5);

  return {
    total: matchedPages.length,
    items: matchedPages.slice(0, safeLimit).map((page) => {
      const contentHtml = normalizeLegacyContentHtml(page.content_html);
      return {
        id: page.id,
        title: page.title,
        subtitle: page.section?.title || 'Document',
        description: pickMatchedDocumentText(page, normalizedQuery, contentHtml),
        route: `/document?pageId=${encodeURIComponent(page.id)}`,
      };
    }),
  };
}

module.exports = {
  getPage,
  getTree,
  searchDocuments,
};
