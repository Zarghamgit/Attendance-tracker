/**
 * Google Apps Script for Student Attendance Tracker (v2)
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any code in Code.gs and paste this code.
 * 4. Click 'Deploy' > 'New Deployment' > 'Web App'.
 * 5. Paste the URL into the app's Settings.
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const type = (e && e.parameter) ? e.parameter.type : 'students';
  
  if (type === 'history') {
    const sheet = ss.getSheetByName('Attendance') || ss.insertSheet('Attendance');
    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove headers
    
    // Sort by timestamp descending
    const history = data.reverse().map(row => ({
      timestamp: row[0],
      studentId: row[1],
      name: row[2],
      status: row[3]
    }));
    
    return ContentService.createTextOutput(JSON.stringify(history))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    // Default: Get Students
    const sheet = ss.getSheetByName('Students') || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    
    const students = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let key = h.toString().trim();
        if (key.toLowerCase().includes('id')) key = 'id';
        else if (key.toLowerCase().includes('name')) key = 'name';
        else if (key.toLowerCase().includes('required')) key = 'required_percentage';
        obj[key] = row[i];
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(students))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Attendance') || ss.insertSheet('Attendance');
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Student ID', 'Student Name', 'Status']);
    }
    
    // Add date and time separately or as a single timestamp
    const now = new Date();
    
    sheet.appendRow([
      Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd HH:mm:ss"),
      params.id,
      params.name || 'Unknown',
      params.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Setup dummy data (Run this once from Script Editor)
 */
function setupDummyData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Students');
  if (!sheet) {
    sheet = ss.insertSheet('Students');
    sheet.appendRow(['ID', 'Name', 'Required Attendance (%)']);
    sheet.appendRow(['ST001', 'Alex Johnson', 75]);
    sheet.appendRow(['ST002', 'Sarah Miller', 80]);
    sheet.appendRow(['ST003', 'James Wilson', 75]);
    sheet.appendRow(['ST004', 'Emily Davis', 85]);
    sheet.appendRow(['ST005', 'Michael Chen', 70]);
    sheet.appendRow(['ST006', 'Jessica Taylor', 75]);
  }
}
