export const defaultPageId = 'resources';

export const docSections = [
  {
    id: 'introduction',
    title: 'Introduction',
    expanded: true,
    items: [
      { id: 'overview', title: 'Overview' },
      { id: 'resources', title: 'Resources' },
      { id: 'feedback', title: 'Feedback' },
      { id: 'troubleshooting', title: 'Troubleshooting' },
    ],
  },
  {
    id: 'get-started',
    title: 'Get Started',
    expanded: false,
    items: [
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'installation', title: 'Installation' },
      { id: 'first-project', title: 'Your First Project' },
    ],
  },
  {
    id: 'send-requests',
    title: 'Send Requests',
    expanded: false,
    items: [
      { id: 'create-request', title: 'Create a Request' },
      { id: 'request-headers', title: 'Request Headers' },
      { id: 'request-body', title: 'Request Body' },
    ],
  },
  {
    id: 'tests-scripts',
    title: 'Tests & Scripts',
    expanded: false,
    items: [
      { id: 'write-tests', title: 'Write Tests' },
      { id: 'pre-request-scripts', title: 'Pre-request Scripts' },
      { id: 'test-scripts', title: 'Test Scripts' },
    ],
  },
  {
    id: 'collections',
    title: 'Collections',
    expanded: false,
    items: [
      { id: 'manage-collections', title: 'Manage Collections' },
      { id: 'share-collections', title: 'Share Collections' },
    ],
  },
  {
    id: 'flows',
    title: 'Flows',
    expanded: false,
    items: [
      { id: 'create-flow', title: 'Create a Flow' },
      { id: 'flow-variables', title: 'Flow Variables' },
    ],
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    expanded: false,
    items: [
      { id: 'team-workspaces', title: 'Team Workspaces' },
      { id: 'roles-permissions', title: 'Roles & Permissions' },
    ],
  },
];

function makePlaceholderPage(id, sectionId, sectionTitle, title, intro) {
  return {
    breadcrumb: [
      { label: sectionTitle, sectionId },
      { label: title },
    ],
    title,
    intro: intro || `This page provides documentation for ${title}. Content will be expanded in future releases.`,
    heroImage: null,
    summary: [],
    sections: [],
  };
}

const resourcesSummary = [
  { id: 'access-vault', label: 'Access vault secrets' },
  { id: 'manage-key', label: 'Manage your vault key' },
  { id: 'add-edit-key', label: 'Add, edit, and use vault key' },
  { id: 'feature-availability', label: 'Feature availability' },
  { id: 'troubleshoot-vault', label: 'Troubleshoot vault secret' },
  { id: 'vault-integrations', label: 'Postman vault integrations' },
  { id: 'vault-salt-hash', label: 'Vault key salt & hash' },
  { id: 'cryptographic-key', label: 'Cryptographic key' },
  { id: 'security-compliance', label: 'Security & Compliance' },
  { id: 'other-security', label: 'Other security issues' },
];

const resourcesSections = [
  {
    id: 'access-vault',
    heading: 'Access vault secrets',
    body: 'Vault secrets let you store sensitive values securely and reference them across your API workflows without exposing credentials in plain text.',
  },
  {
    id: 'manage-key',
    heading: 'Manage your vault key',
    body: 'Your vault key encrypts and decrypts secrets stored in the vault. Keep it safe and never share it with unauthorized team members.',
  },
  {
    id: 'add-edit-key',
    heading: 'Add, edit, and use vault key',
    body: 'You can add new secrets, update existing ones, and reference them in requests using the vault variable syntax.',
  },
  {
    id: 'feature-availability',
    heading: 'Feature availability',
    body: 'Vault features are available on select plans. Check your workspace settings to confirm availability for your organization.',
  },
  {
    id: 'troubleshoot-vault',
    heading: 'Troubleshoot vault secret',
    body: 'If a secret fails to resolve, verify the vault key, secret name, and workspace permissions before retrying the request.',
  },
  {
    id: 'vault-integrations',
    heading: 'Postman vault integrations',
    body: 'Integrate vault secrets with CI/CD pipelines and third-party tools using supported API endpoints and environment sync.',
  },
  {
    id: 'vault-salt-hash',
    heading: 'Vault key salt & hash',
    body: 'Secrets are protected using industry-standard salting and hashing algorithms to ensure data integrity at rest.',
  },
  {
    id: 'cryptographic-key',
    heading: 'Cryptographic key',
    body: 'Cryptographic keys are generated locally and used to encrypt vault data before it is stored on the server.',
  },
  {
    id: 'security-compliance',
    heading: 'Security & Compliance',
    body: 'The platform follows common security best practices and supports compliance requirements for enterprise deployments.',
  },
  {
    id: 'other-security',
    heading: 'Other security issues',
    body: 'Report security concerns through the official channel. Do not disclose vulnerabilities in public forums.',
  },
];

export const docPages = {
  overview: makePlaceholderPage(
    'overview',
    'introduction',
    'Introduction',
    'Bio-Apps Overview',
    'Bio-Apps is a unified platform for biological data analysis, computation tasks, and collaborative workflows.'
  ),
  resources: {
    breadcrumb: [
      { label: 'Introduction', sectionId: 'introduction' },
      { label: 'Resources' },
    ],
    title: 'slothAPI Documentation overview',
    intro:
      'Welcome to the Postman Learning Center docs! This is the place to find official information on how to use Postman in your API projects. If you\'re learning to carry out a specific task or workflow in Postman, check out the following topics to find resources:',
    heroImage: '/images/document-hero.jpg',
    summary: resourcesSummary,
    sections: resourcesSections,
  },
  feedback: makePlaceholderPage(
    'feedback',
    'introduction',
    'Introduction',
    'Feedback',
    'Share feedback about Bio-Apps documentation, features, or usability to help us improve the platform.'
  ),
  troubleshooting: makePlaceholderPage(
    'troubleshooting',
    'introduction',
    'Introduction',
    'Troubleshooting',
    'Find solutions to common issues when using Bio-Apps, including login, task execution, and data upload problems.'
  ),
  'quick-start': makePlaceholderPage(
    'quick-start',
    'get-started',
    'Get Started',
    'Quick Start',
    'Get up and running with Bio-Apps in minutes by creating an account and launching your first computation task.'
  ),
  installation: makePlaceholderPage(
    'installation',
    'get-started',
    'Get Started',
    'Installation',
    'Learn how to install and configure Bio-Apps tools for local development and batch processing.'
  ),
  'first-project': makePlaceholderPage(
    'first-project',
    'get-started',
    'Get Started',
    'Your First Project',
    'Walk through creating your first project, uploading data, and running an analysis pipeline.'
  ),
  'create-request': makePlaceholderPage(
    'create-request',
    'send-requests',
    'Send Requests',
    'Create a Request',
    'Learn how to construct and send API requests to Bio-Apps services.'
  ),
  'request-headers': makePlaceholderPage(
    'request-headers',
    'send-requests',
    'Send Requests',
    'Request Headers',
    'Configure authentication tokens, content types, and custom headers for your requests.'
  ),
  'request-body': makePlaceholderPage(
    'request-body',
    'send-requests',
    'Send Requests',
    'Request Body',
    'Format JSON, form data, and file uploads in request bodies for Bio-Apps endpoints.'
  ),
  'write-tests': makePlaceholderPage(
    'write-tests',
    'tests-scripts',
    'Tests & Scripts',
    'Write Tests',
    'Write automated tests to validate API responses and ensure workflow reliability.'
  ),
  'pre-request-scripts': makePlaceholderPage(
    'pre-request-scripts',
    'tests-scripts',
    'Tests & Scripts',
    'Pre-request Scripts',
    'Run scripts before sending requests to set variables, generate tokens, or prepare payloads.'
  ),
  'test-scripts': makePlaceholderPage(
    'test-scripts',
    'tests-scripts',
    'Tests & Scripts',
    'Test Scripts',
    'Execute test scripts after receiving responses to assert status codes, schemas, and data values.'
  ),
  'manage-collections': makePlaceholderPage(
    'manage-collections',
    'collections',
    'Collections',
    'Manage Collections',
    'Organize related requests into collections for easier reuse and version control.'
  ),
  'share-collections': makePlaceholderPage(
    'share-collections',
    'collections',
    'Collections',
    'Share Collections',
    'Share collections with teammates and control access through workspace permissions.'
  ),
  'create-flow': makePlaceholderPage(
    'create-flow',
    'flows',
    'Flows',
    'Create a Flow',
    'Build multi-step API workflows by chaining requests and logic in visual flows.'
  ),
  'flow-variables': makePlaceholderPage(
    'flow-variables',
    'flows',
    'Flows',
    'Flow Variables',
    'Pass data between flow steps using variables and environment scopes.'
  ),
  'team-workspaces': makePlaceholderPage(
    'team-workspaces',
    'collaborate',
    'Collaborate',
    'Team Workspaces',
    'Set up team workspaces to collaborate on projects, datasets, and computation tasks.'
  ),
  'roles-permissions': makePlaceholderPage(
    'roles-permissions',
    'collaborate',
    'Collaborate',
    'Roles & Permissions',
    'Assign roles and permissions to control who can view, edit, or run resources in your workspace.'
  ),
};

export function getPageById(pageId) {
  return docPages[pageId] || docPages[defaultPageId];
}

export function findSectionForPage(pageId) {
  return docSections.find((section) =>
    section.items.some((item) => item.id === pageId)
  );
}
