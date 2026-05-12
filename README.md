# 📋 Attendance Pro

Attendance Pro is a modern, professional full-stack attendance tracking application. It features a sleek, responsive UI, real-time analytics, and seamless integration with both local Excel files and Google Sheets.

---

## ✨ Features

- **🚀 Fast Workflow**: Card-based student carousel for quick attendance marking.
- **⌨️ Keyboard Shortcuts**: Mark attendance using keys (1/P for Present, 2/A for Absent, 3/L for Leave).
- **📊 Real-time Analytics**: Built-in Chart.js graphs to track student attendance trends vs. required percentages.
- **📂 Excel Integration**: Directly reads from and writes to `Students.xlsx` and `Attendance.xlsx`.
- **☁️ Google Sheets Support**: Optional integration with Google Sheets via Apps Script.
- **📱 Mobile Responsive**: Designed to work perfectly on phones, tablets, and desktops.
- **🔄 Optimistic UI**: Instant transitions between students with background server synchronization.
- **📑 History & Export**: Detailed history logs and one-click Excel report exports.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Modern UI/Glassmorphism), JavaScript (ES6+), Vite, Chart.js.
- **Backend**: Node.js, Express.js.
- **Data Handling**: `xlsx` (Excel processing), `multer` (File uploads).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm (installed with Node.js)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Running the Project
You need to run both the backend server and the frontend development server.

**Start the Backend:**
```bash
npm run server
```
The server will run on `http://localhost:3000`.

**Start the Frontend:**
```bash
npm run dev
```
Open the provided URL (usually `http://localhost:5173`) in your browser.

---

## 📖 Usage Guide

### Marking Attendance
1. The app loads students from `Students.xlsx`.
2. Use the **Present**, **Absent**, or **Leave** buttons.
3. You can also use keyboard shortcuts:
   - `1` or `P` : Present
   - `2` or `A` : Absent
   - `3` or `L` : Leave

### Viewing Analytics
Click on any student's name/card while it is active to view their attendance history graph and percentage stats.

### Settings & Integration
- **Google Sheets**: To use Google Sheets, deploy the provided `google_apps_script.js` as a Web App, copy the URL, and paste it into the **Settings** modal in the app.
- **Import Students**: You can upload a new `Students.xlsx` file via the Settings modal to update your student roster.

---

## 📁 Project Structure

```text
├── src/                # Frontend source code (JavaScript & CSS)
├── public/             # Static assets
├── server.js           # Express backend server
├── google_apps_script.js # Integration script for Google Sheets
├── Students.xlsx       # Main student database
├── Attendance.xlsx     # Attendance logs history
├── index.html          # Main application entry point
├── package.json        # Project dependencies and scripts
└── SHEET_SETUP_GUIDE.md # Detailed guide for Google Sheets setup
```

---

## 📄 License

This project is open-source and available for customization.

---

*Built with ❤️ for efficient classroom management.*
