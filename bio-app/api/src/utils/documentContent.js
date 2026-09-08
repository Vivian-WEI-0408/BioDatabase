function stripHtmlTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHeading(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sectionsJsonToHtml(sections) {
  return (sections || []).map((section) => {
    const heading = section.heading || '';
    const body = section.body || '';
    const bodyHtml = body.includes('<') ? body : `<p>${body}</p>`;
    return `<h2>${heading}</h2>${bodyHtml}`;
  }).join('');
}

function normalizeLegacyContentHtml(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (!raw.startsWith('{') && !raw.startsWith('[')) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sections)) {
      return sectionsJsonToHtml(parsed.sections);
    }
  } catch {
    return raw;
  }

  return raw;
}

function extractSummaryFromHtml(html) {
  const items = [];
  const regex = /<h([2-3])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  let match;
  let index = 0;

  while ((match = regex.exec(html)) !== null) {
    const label = stripHtmlTags(match[2]);
    if (!label) {
      continue;
    }

    const id = slugifyHeading(label) || `heading-${index + 1}`;
    items.push({ id, label });
    index += 1;
  }

  return items;
}

function parseDocumentContentHtml(value, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error('页面内容不能为空');
    }

    return undefined;
  }

  const html = normalizeLegacyContentHtml(value);
  if (required && !html.trim()) {
    throw new Error('页面内容不能为空');
  }

  return html;
}

module.exports = {
  stripHtmlTags,
  extractSummaryFromHtml,
  normalizeLegacyContentHtml,
  parseDocumentContentHtml,
  sectionsJsonToHtml,
};
