const { prisma } = require('../src/services/db');

const columns = {
  parttable: [['external_source', 'VARCHAR(50) NULL'], ['external_id', 'VARCHAR(100) NULL'], ['external_version', 'INT NULL'], ['external_updated_at', 'DATETIME(6) NULL'], ['sync_status', 'VARCHAR(20) NULL'], ['deleted_at', 'DATETIME(6) NULL']],
  backbonetable: [['sync_status', 'VARCHAR(20) NULL'], ['deleted_at', 'DATETIME(6) NULL']],
  plasmidneed: [['sync_status', 'VARCHAR(20) NULL'], ['deleted_at', 'DATETIME(6) NULL']],
};

async function exists(kind, table, name) {
  const source = kind === 'column' ? 'information_schema.columns' : 'information_schema.statistics';
  const field = kind === 'column' ? 'column_name' : 'index_name';
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM ${source} WHERE table_schema = DATABASE() AND table_name = ? AND ${field} = ? LIMIT 1`, table, name,
  );
  return rows.length > 0;
}

async function apply() {
  for (const [table, definitions] of Object.entries(columns)) {
    for (const [column, definition] of definitions) {
      if (!await exists('column', table, column)) {
        await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`added ${table}.${column}`);
      }
    }
  }
  const indexes = [
    ['parttable', 'uk_parttable_external_source_id', 'UNIQUE ', '`external_source`, `external_id`'],
    ['parttable', 'idx_parttable_deleted_at', '', '`deleted_at`'],
    ['backbonetable', 'idx_backbonetable_deleted_at', '', '`deleted_at`'],
    ['plasmidneed', 'idx_plasmidneed_deleted_at', '', '`deleted_at`'],
  ];
  for (const [table, name, unique, fields] of indexes) {
    if (!await exists('index', table, name)) {
      await prisma.$executeRawUnsafe(`CREATE ${unique}INDEX \`${name}\` ON \`${table}\` (${fields})`);
      console.log(`added index ${name}`);
    }
  }
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS external_sync_state (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, source VARCHAR(50) NOT NULL, \`cursor\` VARCHAR(500) NULL,
    last_sync_at DATETIME(6) NULL, last_success_at DATETIME(6) NULL, last_error LONGTEXT NULL,
    consecutive_fail INT NOT NULL DEFAULT 0, UNIQUE KEY external_sync_state_source_key (source)
  )`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS external_sync_log (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, source VARCHAR(50) NOT NULL, external_id VARCHAR(100) NULL,
    action VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, message LONGTEXT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_external_sync_log_source_id (source, external_id), KEY idx_external_sync_log_created_at (created_at)
  )`);
  console.log('component sync schema is ready');
}

apply().finally(() => prisma.$disconnect());
