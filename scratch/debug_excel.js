import xlsx from 'xlsx';
import fs from 'fs';

const STUDENTS_FILE = 'Students.xlsx';
if (fs.existsSync(STUDENTS_FILE)) {
    const workbook = xlsx.readFile(STUDENTS_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Read as raw arrays
    console.log('First 5 rows:');
    data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
} else {
    console.log('File not found.');
}
