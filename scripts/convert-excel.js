import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXCEL_PATH = path.join(ROOT, '22.08.2026 genel liste.xlsx');
const OUTPUT_PATH = path.join(ROOT, 'public', 'data.json');

function cleanDistrict(d) {
  if (!d) return '';
  d = String(d).trim().toUpperCase();
  if (d.includes('GEBZE')) return 'GEBZE';
  if (d.includes('DARICA') || d.includes('DAR')) return 'DARICA';
  if (d.includes('AYIROVA') || d.includes('CAYIROVA')) return 'ÇAYIROVA';
  if (d.includes('LOVASI') || d.includes('DILOVASI')) return 'DİLOVASI';
  return d;
}

async function convert() {
  console.log('[*] Reading Excel file...');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.worksheets[0];

  const members = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const vals = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      vals[colNumber] = cell.value != null ? String(cell.value).trim() : '';
    });

    const uyeSicil = vals[1] || '';
    const ticaretSicil = vals[2] || '';
    const unvan = vals[3] || '';
    const adres = vals[4] || '';
    const ilce = vals[5] || '';
    const cleanIlce = cleanDistrict(ilce);
    const telefon = vals[6] || '';
    const yetkili = vals[7] || '';
    const meslekGrubu = vals[8] || '';
    const yetkiBelgesi = vals[9] || '';
    const durum = vals[11] || '';
    const belgeyiAlan = vals[12] || '';
    const referans = vals[13] || '';
    const notlar = vals[14] || '';

    members.push({
      i: rowNumber - 1, // row index (1-based from Excel data rows)
      u: uyeSicil,
      t: ticaretSicil,
      n: unvan,
      a: adres,
      l: ilce,
      cl: cleanIlce,
      p: telefon,
      y: yetkili,
      m: meslekGrubu,
      yb: yetkiBelgesi,
      d: durum,
      b: belgeyiAlan,
      r: referans,
      nt: notlar
    });
  });

  // Ensure public directory exists
  const publicDir = path.join(ROOT, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(members));
  const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`[+] Generated data.json with ${members.length} records (${sizeMB} MB)`);
}

convert().catch(err => {
  console.error('[!] Error converting Excel:', err);
  process.exit(1);
});
