const { prisma } = require('./db');
const { sectionsJsonToHtml } = require('../utils/documentContent');

const APPS = [
  {
    id: 't-pro',
    title: 'T-Pro',
    description:
      'This is a brief description of the T-Pro application.\nThis is a brief description of the T-Pro application.',
    icon: '/images/logo.png',
    route: '/t-pro',
    author: 'Tz Wang',
    app_color: '#26c0e2',
    sort_order: 0,
  },
  {
    id: 'tplot',
    title: 'TPlot',
    description:
      'This is a brief description of the TPlot application.\nThis is a brief description of the TPlot application.',
    icon: '/images/logo.png',
    route: '/tplot',
    author: 'Vivian',
    app_color: '#ff8d28',
    sort_order: 1,
  },
  {
    id: 'assembly-tool',
    title: 'Assembly Tool',
    description: 'Design and run Golden Gate assemblies from database records, saved repositories, or Excel batch plans.',
    icon: '/images/logo-dna.png',
    route: '/assembly-tool',
    author: 'Bio App',
    app_color: '#605bff',
    sort_order: 2,
  },
  {
    id: 'lab-database',
    title: 'Lab Database',
    description: 'Internal task category for Lab Database dataset uploads.',
    icon: '/images/logo.png',
    route: '',
    author: 'Bio App',
    app_color: '#ff8d28',
    sort_order: 99,
  },
];

const DOC_SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    sort_order: 0,
    expanded_default: true,
    pages: [
      { id: 'overview', title: 'Overview', sort_order: 0 },
      { id: 'resources', title: 'Resources', sort_order: 1 },
      { id: 'feedback', title: 'Feedback', sort_order: 2 },
      { id: 'troubleshooting', title: 'Troubleshooting', sort_order: 3 },
    ],
  },
  {
    id: 'get-started',
    title: 'Get Started',
    sort_order: 1,
    expanded_default: false,
    pages: [
      { id: 'quick-start', title: 'Quick Start', sort_order: 0 },
      { id: 'installation', title: 'Installation', sort_order: 1 },
      { id: 'first-project', title: 'Your First Project', sort_order: 2 },
    ],
  },
  {
    id: 'send-requests',
    title: 'Send Requests',
    sort_order: 2,
    expanded_default: false,
    pages: [
      { id: 'create-request', title: 'Create a Request', sort_order: 0 },
      { id: 'request-headers', title: 'Request Headers', sort_order: 1 },
      { id: 'request-body', title: 'Request Body', sort_order: 2 },
    ],
  },
  {
    id: 'tests-scripts',
    title: 'Tests & Scripts',
    sort_order: 3,
    expanded_default: false,
    pages: [
      { id: 'write-tests', title: 'Write Tests', sort_order: 0 },
      { id: 'pre-request-scripts', title: 'Pre-request Scripts', sort_order: 1 },
      { id: 'test-scripts', title: 'Test Scripts', sort_order: 2 },
    ],
  },
  {
    id: 'collections',
    title: 'Collections',
    sort_order: 4,
    expanded_default: false,
    pages: [
      { id: 'manage-collections', title: 'Manage Collections', sort_order: 0 },
      { id: 'share-collections', title: 'Share Collections', sort_order: 1 },
    ],
  },
  {
    id: 'flows',
    title: 'Flows',
    sort_order: 5,
    expanded_default: false,
    pages: [
      { id: 'create-flow', title: 'Create a Flow', sort_order: 0 },
      { id: 'flow-variables', title: 'Flow Variables', sort_order: 1 },
    ],
  },
  {
    id: 'collaborate',
    title: 'Collaborate',
    sort_order: 6,
    expanded_default: false,
    pages: [
      { id: 'team-workspaces', title: 'Team Workspaces', sort_order: 0 },
      { id: 'roles-permissions', title: 'Roles & Permissions', sort_order: 1 },
    ],
  },
];

const RESOURCES_SUMMARY = [
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

const RESOURCES_SECTIONS = [
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

function makePlaceholderContent(title) {
  return {
    summary: [],
    sections: [],
    pageTitle: title,
  };
}

function getPageContent(pageId, sectionTitle, pageTitle) {
  if (pageId === 'resources') {
    return {
      summary: RESOURCES_SUMMARY,
      sections: RESOURCES_SECTIONS,
      pageTitle: 'slothAPI Documentation overview',
    };
  }

  const intros = {
    overview: 'Bio-Apps is a unified platform for biological data analysis, computation tasks, and collaborative workflows.',
    feedback: 'Share feedback about Bio-Apps documentation, features, or usability to help us improve the platform.',
    troubleshooting: 'Find solutions to common issues when using Bio-Apps, including login, task execution, and data upload problems.',
    'quick-start': 'Get up and running with Bio-Apps in minutes by creating an account and launching your first computation task.',
    installation: 'Learn how to install and configure Bio-Apps tools for local development and batch processing.',
    'first-project': 'Walk through creating your first project, uploading data, and running an analysis pipeline.',
    'create-request': 'Learn how to construct and send API requests to Bio-Apps services.',
    'request-headers': 'Configure authentication tokens, content types, and custom headers for your requests.',
    'request-body': 'Format JSON, form data, and file uploads in request bodies for Bio-Apps endpoints.',
    'write-tests': 'Write automated tests to validate API responses and ensure workflow reliability.',
    'pre-request-scripts': 'Run scripts before sending requests to set variables, generate tokens, or prepare payloads.',
    'test-scripts': 'Execute test scripts after receiving responses to assert status codes, schemas, and data values.',
    'manage-collections': 'Organize related requests into collections for easier reuse and version control.',
    'share-collections': 'Share collections with teammates and control access through workspace permissions.',
    'create-flow': 'Build multi-step API workflows by chaining requests and logic in visual flows.',
    'flow-variables': 'Pass data between flow steps using variables and environment scopes.',
    'team-workspaces': 'Set up team workspaces to collaborate on projects, datasets, and computation tasks.',
    'roles-permissions': 'Assign roles and permissions to control who can view, edit, or run resources in your workspace.',
  };

  const content = makePlaceholderContent(pageTitle);
  content.pageTitle = pageTitle;
  content.introOverride = intros[pageId]
    || `This page provides documentation for ${pageTitle}. Content will be expanded in future releases.`;

  return content;
}

async function seedApps() {
  for (const app of APPS) {
    await prisma.app.upsert({
      where: { id: app.id },
      update: {
        title: app.title,
        description: app.description,
        icon: app.icon,
        route: app.route,
        author: app.author,
        app_color: app.app_color,
        sort_order: app.sort_order,
      },
      create: app,
    });
  }
}

async function seedDocuments() {
  for (const section of DOC_SECTIONS) {
    await prisma.documentSection.upsert({
      where: { id: section.id },
      update: {
        title: section.title,
        sort_order: section.sort_order,
        expanded_default: section.expanded_default,
      },
      create: {
        id: section.id,
        title: section.title,
        sort_order: section.sort_order,
        expanded_default: section.expanded_default,
      },
    });

    for (const page of section.pages) {
      const content = getPageContent(page.id, section.title, page.title);
      const intro = content.introOverride
        || (page.id === 'resources'
          ? 'Welcome to the Postman Learning Center docs! This is the place to find official information on how to use Postman in your API projects. If you\'re learning to carry out a specific task or workflow in Postman, check out the following topics to find resources:'
          : `This page provides documentation for ${page.title}. Content will be expanded in future releases.`);

      const contentHtml = page.id === 'resources'
        ? sectionsJsonToHtml(RESOURCES_SECTIONS)
        : '';

      await prisma.documentPage.upsert({
        where: { id: page.id },
        update: {
          section_id: section.id,
          title: content.pageTitle || page.title,
          intro,
          hero_image: page.id === 'resources' ? '/images/document-hero.jpg' : null,
          content_html: contentHtml,
          sort_order: page.sort_order,
        },
        create: {
          id: page.id,
          section_id: section.id,
          title: content.pageTitle || page.title,
          intro,
          hero_image: page.id === 'resources' ? '/images/document-hero.jpg' : null,
          content_html: contentHtml,
          sort_order: page.sort_order,
        },
      });
    }
  }
}

async function seedUserData(userId) {
  const [taskCount, todoCount, notificationCount, favoriteCount, storage] = await Promise.all([
    prisma.task.count({ where: { user_id: userId } }),
    prisma.todo.count({ where: { user_id: userId } }),
    prisma.notification.count({ where: { user_id: userId } }),
    prisma.userAppFavorite.count({ where: { user_id: userId } }),
    prisma.userStorage.findUnique({ where: { user_id: userId } }),
  ]);

  if (taskCount > 0 && todoCount > 0 && notificationCount > 0 && favoriteCount > 0 && storage) {
    return;
  }

  const otherUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    take: 2,
  });

  const sharingUser = otherUsers[0] || null;

  const taskSeeds = [
    {
      app_id: 't-pro',
      name: 'Task Name',
      status: 'completed',
      scope: 'sharing',
      user_id: sharingUser ? sharingUser.id : userId,
      shared_with_user_id: sharingUser ? userId : null,
      created_at: new Date('2020-12-12T10:00:00'),
    },
    {
      app_id: 't-pro',
      name: 'Task Name',
      status: 'pending',
      scope: 'mine',
      user_id: userId,
      created_at: new Date('2020-12-12T11:00:00'),
    },
    {
      app_id: 't-pro',
      name: 'Task Name',
      status: 'completed',
      scope: 'mine',
      user_id: userId,
      created_at: new Date('2020-12-12T12:00:00'),
    },
    {
      app_id: 'tplot',
      name: 'Expression heatmap analysis',
      status: 'running',
      scope: 'sharing',
      user_id: sharingUser ? sharingUser.id : userId,
      shared_with_user_id: sharingUser ? userId : null,
      created_at: new Date('2021-12-04T09:00:00'),
    },
    {
      app_id: 't-pro',
      name: 'Promoter library design',
      status: 'pending',
      scope: 'mine',
      user_id: userId,
      created_at: new Date('2021-11-28T14:00:00'),
    },
  ];

  if (taskCount === 0) {
    await prisma.task.createMany({ data: taskSeeds });
  }

  const legacySharedTasks = await prisma.task.findMany({
    where: {
      OR: [
        { shared_with_user_id: userId },
        {
          user_id: userId,
          shared_with_user_id: { not: null },
        },
      ],
    },
  });

  for (const task of legacySharedTasks) {
    if (!task.shared_with_user_id || task.user_id === task.shared_with_user_id) {
      continue;
    }

    await prisma.taskShare.upsert({
      where: {
        task_id_target_user_id: {
          task_id: task.id,
          target_user_id: task.shared_with_user_id,
        },
      },
      update: {
        owner_user_id: task.user_id,
        permission: 'read',
      },
      create: {
        task_id: task.id,
        owner_user_id: task.user_id,
        target_user_id: task.shared_with_user_id,
        permission: 'read',
      },
    });
  }

  if (notificationCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          user_id: userId,
          tag: 'T-Pro',
          tag_color: '#26c0e2',
          task_id: '0001',
          message: 'The computation task has been completed.',
          created_at: new Date('2021-12-04T11:15:00'),
          read: false,
        },
        {
          user_id: userId,
          tag: 'T-Pro',
          tag_color: '#26c0e2',
          task_id: '0001',
          message: 'The computation task has been completed.',
          created_at: new Date('2021-12-04T11:15:00'),
          read: false,
        },
        {
          user_id: userId,
          tag: 'Dataset',
          tag_color: '#ff8d28',
          from_user: 'AbandonCode',
          message: 'has shared a dataset with you.',
          created_at: new Date('2021-12-04T11:15:00'),
          read: false,
        },
        {
          user_id: userId,
          tag: 'T-Pro',
          tag_color: '#26c0e2',
          task_id: '0001',
          message: 'The computation task has been completed.',
          created_at: new Date('2021-12-04T11:15:00'),
          read: true,
        },
        {
          user_id: userId,
          tag: 'T-Pro',
          tag_color: '#26c0e2',
          task_id: '0002',
          message: 'The computation task has been completed.',
          created_at: new Date('2021-12-03T09:30:00'),
          read: true,
        },
        {
          user_id: userId,
          tag: 'T-Pro',
          tag_color: '#26c0e2',
          task_id: '0003',
          message: 'The computation task has failed.',
          created_at: new Date('2021-12-02T16:20:00'),
          read: true,
        },
        {
          user_id: userId,
          tag: 'Dataset',
          tag_color: '#ff8d28',
          from_user: 'ResearchLab',
          message: 'has shared a dataset with you.',
          created_at: new Date('2021-12-01T14:00:00'),
          read: true,
        },
        {
          user_id: userId,
          tag: 'T-Pro',
          tag_color: '#26c0e2',
          task_id: '0004',
          message: 'The computation task has been completed.',
          created_at: new Date('2021-11-30T10:45:00'),
          read: true,
        },
      ],
    });
  }

  if (todoCount === 0) {
    await prisma.todo.createMany({
      data: [
        { user_id: userId, text: 'Complete your basic information.', done: false, sort_order: 0 },
        { user_id: userId, text: 'Start a new T-Pro computation task.', highlight: 'T-Pro', done: false, sort_order: 1 },
        { user_id: userId, text: 'Start a new TPlot computation task.', highlight: 'TPlot', done: false, sort_order: 2 },
        { user_id: userId, text: 'Share a computation task.', done: false, sort_order: 3 },
        { user_id: userId, text: 'Share a datasets.', done: true, sort_order: 4 },
      ],
    });
  }

  if (favoriteCount === 0) {
    await prisma.userAppFavorite.create({
      data: {
        user_id: userId,
        app_id: 't-pro',
      },
    });
  }

  await prisma.userStorage.upsert({
    where: { user_id: userId },
    update: {},
    create: {
      user_id: userId,
      used_mb: 307,
      total_mb: 1024,
    },
  });
}

module.exports = {
  seedApps,
  seedDocuments,
  seedUserData,
};
