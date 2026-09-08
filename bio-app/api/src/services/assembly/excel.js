const XLSX = require('xlsx');

const COLUMNS = ['AssemblyName', 'Alias', 'Level', 'Backbone', 'Plasmid', 'Part', 'Part Start Scar', 'Part End Scar', 'Note'];

function value(row, key) {
  const found = Object.keys(row).find((column) => column.trim().toLowerCase() === key.toLowerCase());
  return found ? String(row[found] ?? '').trim() : '';
}

function splitNames(input) {
  return String(input || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function parseAssemblyWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (!rows.length) throw new Error('Assembly workbook contains no data');
  const headings = Object.keys(rows[0]).map((item) => item.trim().toLowerCase());
  for (const required of ['AssemblyName', 'Level']) {
    if (!headings.includes(required.toLowerCase())) throw new Error(`Assembly workbook is missing ${required}`);
  }
  let inherited = {};
  const groups = new Map();
  rows.forEach((row, index) => {
    for (const column of COLUMNS) {
      const current = value(row, column);
      if (current) inherited[column] = current;
    }
    const name = inherited.AssemblyName;
    if (!name) throw new Error(`Row ${index + 2} has no AssemblyName`);
    if (!groups.has(name)) groups.set(name, {
      name, alias: inherited.Alias || '', note: inherited.Note || '', level: Number(inherited.Level) || null,
      parts: [], backbones: [], plasmids: [], part_start_scar: [], part_end_scar: [],
    });
    const group = groups.get(name);
    const part = value(row, 'Part');
    if (part) {
      group.parts.push(...splitNames(part));
      group.part_start_scar.push(value(row, 'Part Start Scar'));
      group.part_end_scar.push(value(row, 'Part End Scar'));
    }
    group.backbones.push(...splitNames(value(row, 'Backbone')));
    group.plasmids.push(...splitNames(value(row, 'Plasmid')));
  });
  return [...groups.values()].sort((a, b) => (a.level || 0) - (b.level || 0));
}

module.exports = { COLUMNS, parseAssemblyWorkbook };
