import express from 'express';
import cors from 'cors';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Setup Multer for imports
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, __dirname),
  filename: (req, file, cb) => cb(null, 'Students.xlsx')
});
const upload = multer({ storage });

const STUDENTS_FILE = path.join(__dirname, 'Students.xlsx');
const ATTENDANCE_FILE = path.join(__dirname, 'Attendance.xlsx');

// Helper to read Excel
function readExcel(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return [];
  }
}

// Helper to write Excel
function writeExcel(filePath, data) {
  try {
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Records');
    
    // Use buffer approach which is more reliable in some Node environments
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buf);
    console.log(`Successfully saved to ${filePath}`);
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
    throw e;
  }
}

// API: Get Students
app.get('/api/students', (req, res) => {
  try {
    if (!fs.existsSync(STUDENTS_FILE)) {
      return res.status(404).json({ error: 'Students.xlsx not found in project folder' });
    }

    const workbook = xlsx.readFile(STUDENTS_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Find the header row (contains 'Name')
    let headerRowIndex = rawData.findIndex(row => 
      Array.isArray(row) && row.some(cell => cell && cell.toString().toLowerCase().includes('name'))
    );
    
    if (headerRowIndex === -1) {
      console.log('Could not find header row with "Name", using first row');
      headerRowIndex = 0;
    }

    const headerRow = rawData[headerRowIndex];
    // Find all columns that look like 'Name'
    const nameIndices = headerRow.reduce((acc, cell, i) => {
      if (cell && cell.toString().toLowerCase().includes('name')) acc.push(i);
      return acc;
    }, []);

    const students = [];
    // Process rows after the header
    rawData.slice(headerRowIndex + 1).forEach((row, rowIndex) => {
      nameIndices.forEach(nameIdx => {
        const name = row[nameIdx];
        if (name && name.toString().trim() && name !== 'Name') {
          // Try to find an ID to the left of the name
          const id = row[nameIdx - 1] || `S${students.length + 1}`;
          // Try to find "Required" column index
          const requiredIdx = headerRow.findIndex(h => h && h.toString().toLowerCase().includes('required'));
          
          students.push({
            id: id.toString().trim(),
            name: name.toString().trim(),
            requiredPercentage: requiredIdx !== -1 ? (row[requiredIdx] || 75) : 75,
            row: headerRowIndex + 1 + rowIndex,
            col: nameIdx
          });
        }
      });
    });

    console.log(`Loaded ${students.length} students from ${nameIndices.length} column sets`);
    res.json(students);
  } catch (err) {
    console.error('Error loading students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Mark Attendance (Direct Writing to Students.xlsx)
app.post('/api/attendance', (req, res) => {
  try {
    const { id, name, status, row, col } = req.body;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`Marking: ${name} - ${status} on ${dateStr} at Row ${row}`);
    
    if (row === undefined) {
      return res.status(400).json({ error: 'Position info missing' });
    }

    const workbook = xlsx.readFile(STUDENTS_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Get headers
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const headerRow = rawData[0]; // Assuming headers are on the first row for simplicity, or we find it
    
    // Find or create date column
    let dateColIdx = headerRow.findIndex(h => h === dateStr);
    if (dateColIdx === -1) {
      dateColIdx = headerRow.length;
      const headerCell = xlsx.utils.encode_cell({ r: 0, c: dateColIdx });
      sheet[headerCell] = { t: 's', v: dateStr };
      
      // Update range if necessary
      const range = xlsx.utils.decode_range(sheet['!ref']);
      if (dateColIdx > range.e.c) range.e.c = dateColIdx;
      sheet['!ref'] = xlsx.utils.encode_range(range);
    }
    
    // Write status
    const cellAddress = xlsx.utils.encode_cell({ r: row, c: dateColIdx });
    sheet[cellAddress] = { t: 's', v: status };
    
    xlsx.writeFile(workbook, STUDENTS_FILE);
    
    // Also log to history
    try {
      const historyData = readExcel(ATTENDANCE_FILE);
      historyData.push({
        Timestamp: now.toLocaleString(),
        'Student ID': id,
        'Student Name': name,
        Status: status
      });
      writeExcel(ATTENDANCE_FILE, historyData);
    } catch (e) {
      console.warn('History log failed, but attendance saved.');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Failed to save attendance', details: err.message });
  }
});

// API: Get Student Stats for Graph
app.get('/api/student-stats/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workbook = xlsx.readFile(STUDENTS_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const headerRow = rawData[0];
    const idIdx = headerRow.findIndex(h => h && h.toString().toLowerCase().includes('id'));
    const requiredIdx = headerRow.findIndex(h => h && h.toString().toLowerCase().includes('required'));
    
    // Find student row
    const studentRow = rawData.find(row => row[idIdx] && row[idIdx].toString() === id);
    if (!studentRow) return res.status(404).json({ error: 'Student not found' });
    
    const stats = [];
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    
    headerRow.forEach((header, idx) => {
      if (header && datePattern.test(header.toString())) {
        stats.push({
          date: header.toString(),
          status: studentRow[idx] || 'N/A'
        });
      }
    });
    
    res.json({
      id: id,
      name: studentRow[idIdx + 1], // Assuming Name is next to ID
      requiredPercentage: studentRow[requiredIdx] || 75,
      history: stats
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// API: Import Excel
app.post('/api/import', upload.single('file'), (req, res) => {
  try {
    console.log('File imported successfully');
    res.json({ success: true, message: 'Students list updated' });
  } catch (err) {
    res.status(500).json({ error: 'Import failed' });
  }
});

// API: Get History
app.get('/api/history', (req, res) => {
  try {
    const data = readExcel(ATTENDANCE_FILE);
    const history = data.reverse().map(row => ({
      timestamp: row.Timestamp,
      studentId: row['Student ID'],
      name: row['Student Name'],
      status: row.Status
    }));
    res.json(history);
  } catch (err) {
    res.json([]);
  }
});

// API: Export Excel with Date
app.get('/api/export', (req, res) => {
  try {
    if (!fs.existsSync(STUDENTS_FILE)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `Attendance_Report_${dateStr}.xlsx`;
    
    res.download(STUDENTS_FILE, fileName);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
