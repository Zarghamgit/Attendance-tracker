import './style.css'

class AttendanceApp {
  constructor() {
    this.students = [];
    this.currentIndex = 0;
    // Default to local Express server
    this.apiUrl = localStorage.getItem('attendance_api_url') || 'http://localhost:3000/api';
    
    // UI Elements
    this.cardContainer = document.getElementById('student-card-container');
    this.progressBar = document.getElementById('progress-bar');
    this.statsLabel = document.getElementById('stats');
    this.btnPresent = document.getElementById('btn-present');
    this.btnAbsent = document.getElementById('btn-absent');
    this.btnLeave = document.getElementById('btn-leave');
    
    // Modals
    this.completionScreen = document.getElementById('completion-screen');
    this.settingsModal = document.getElementById('settings-modal');
    this.historyModal = document.getElementById('history-screen');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnHistory = document.getElementById('btn-history');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
    this.btnCloseSettings = document.getElementById('btn-close-settings');
    this.btnCloseHistory = document.getElementById('btn-close-history');
    this.inputScriptUrl = document.getElementById('script-url');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnResetLocal = document.getElementById('btn-reset-local');
    
    // History
    this.historyBody = document.getElementById('history-body');
    this.historyLoader = document.getElementById('history-loader');
    
    // Export buttons
    this.btnExportHistory = document.getElementById('btn-export-history');
    this.btnExportComplete = document.getElementById('btn-export-complete');
    
    // Analytics Modal
    this.statsModal = document.getElementById('stats-modal');
    this.btnCloseStats = document.getElementById('btn-close-stats');
    this.chartCanvas = document.getElementById('attendance-chart');
    this.attendanceChart = null;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.inputScriptUrl.value = this.apiUrl;
    await this.fetchStudents();
  }

  setupEventListeners() {
    this.btnPresent.onclick = () => this.markAttendance('Present');
    this.btnAbsent.onclick = () => this.markAttendance('Absent');
    this.btnLeave.onclick = () => this.markAttendance('Leave');
    this.btnRestart.onclick = () => this.reset();
    
    // Modals
    this.btnSettings.onclick = () => this.settingsModal.classList.remove('hidden');
    this.btnCloseSettings.onclick = () => this.settingsModal.classList.add('hidden');
    this.btnSaveSettings.onclick = () => this.saveSettings();
    
    this.btnHistory.onclick = () => this.openHistory();
    this.btnCloseHistory.onclick = () => this.historyModal.classList.add('hidden');
    this.btnCloseStats.onclick = () => this.statsModal.classList.add('hidden');
    
    this.btnResetLocal.onclick = () => {
      this.apiUrl = 'http://localhost:3000/api';
      this.inputScriptUrl.value = this.apiUrl;
      this.saveSettings();
    };

    if (this.btnExportHistory) this.btnExportHistory.onclick = () => this.exportToExcel();
    if (this.btnExportComplete) this.btnExportComplete.onclick = () => this.exportToExcel();
    
    if (this.btnImportTrigger) {
      this.btnImportTrigger.onclick = () => this.inputImportFile.click();
    }
    
    if (this.inputImportFile) {
      this.inputImportFile.onchange = (e) => this.handleImport(e);
    }
    
    // Keyboard shortcuts
    document.onkeydown = (e) => {
      if (this.currentIndex >= this.students.length) return;
      if (!this.settingsModal.classList.contains('hidden') || !this.historyModal.classList.contains('hidden')) return;
      if (e.key === 'p' || e.key === '1') this.markAttendance('Present');
      if (e.key === 'a' || e.key === '2') this.markAttendance('Absent');
      if (e.key === 'l' || e.key === '3') this.markAttendance('Leave');
    };
  }

  saveSettings() {
    this.apiUrl = this.inputScriptUrl.value.trim();
    localStorage.setItem('attendance_api_url', this.apiUrl);
    this.settingsModal.classList.add('hidden');
    this.fetchStudents();
  }

  async fetchStudents() {
    this.cardContainer.innerHTML = '<div class="loader"><div class="spinner"></div><p>Loading Students...</p></div>';
    try {
      const isGoogleScript = this.apiUrl.includes('script.google.com');
      const url = isGoogleScript ? `${this.apiUrl}?type=students` : `${this.apiUrl}/students`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Server not responding');
      this.students = await response.json();
      this.renderInitialCards();
    } catch (error) {
      console.error('Fetch students error:', error);
      this.cardContainer.innerHTML = `
        <div class="error-state">
          <p>⚠️ Connection Error</p>
          <p class="error-detail">Ensure your backend server is running or your Google Script URL is correct.</p>
          <button onclick="location.reload()" class="btn-secondary">Retry</button>
        </div>
      `;
    }
  }

  async openHistory() {
    this.historyModal.classList.remove('hidden');
    this.historyBody.innerHTML = '';
    this.historyLoader.classList.remove('hidden');
    
    try {
      const isGoogleScript = this.apiUrl.includes('script.google.com');
      const url = isGoogleScript ? `${this.apiUrl}?type=history` : `${this.apiUrl}/history`;
      
      const response = await fetch(url);
      const history = await response.json();
      this.renderHistory(history);
    } catch (error) {
      this.historyBody.innerHTML = '<tr><td colspan="3">Error loading history. Check your connection.</td></tr>';
    } finally {
      this.historyLoader.classList.add('hidden');
    }
  }

  renderHistory(history) {
    if (!history || history.length === 0) {
      this.historyBody.innerHTML = '<tr><td colspan="3">No records found</td></tr>';
      return;
    }

    this.historyBody.innerHTML = history.map(record => `
      <tr>
        <td>${record.timestamp}</td>
        <td>${record.name}</td>
        <td><span class="status-tag status-${record.status.toLowerCase()}">${record.status}</span></td>
      </tr>
    `).join('');
  }

  renderInitialCards() {
    this.cardContainer.innerHTML = '';
    this.currentIndex = 0;
    this.students.forEach((student, index) => {
      const card = document.createElement('div');
      card.className = 'student-card';
      card.id = `card-${index}`;
      const initials = student.name ? student.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
      card.innerHTML = `
        <div class="avatar">${initials}</div>
        <div class="name">${student.name || 'Unknown'}</div>
        <div class="id-label">${student.id || 'N/A'}</div>
        <div class="target-label" style="font-size: 0.7rem; margin-top: 5px; color: var(--text-secondary)">Target: ${student.requiredPercentage || 75}%</div>
      `;
      card.onclick = () => {
        if (card.classList.contains('active')) {
          this.openStudentStats(student.id);
        }
      };
      this.cardContainer.appendChild(card);
    });
    this.updateCardPositions();
    this.updateUI();
  }

  updateCardPositions() {
    this.students.forEach((_, index) => {
      const card = document.getElementById(`card-${index}`);
      if (!card) return;
      card.classList.remove('active', 'prev', 'next', 'hidden-left', 'hidden-right');
      if (index === this.currentIndex) card.classList.add('active');
      else if (index === this.currentIndex - 1) card.classList.add('prev');
      else if (index === this.currentIndex + 1) card.classList.add('next');
      else if (index < this.currentIndex) card.classList.add('hidden-left');
      else card.classList.add('hidden-right');
    });
  }

  updateUI() {
    const total = this.students.length;
    
    // Progress
    const progress = total > 0 ? (this.currentIndex / total) * 100 : 0;
    this.progressBar.style.width = `${progress}%`;
    this.statsLabel.innerText = `${this.currentIndex} / ${total} Students`;

    // Buttons state
    const isDone = total > 0 && this.currentIndex >= total;
    this.btnPresent.disabled = isDone || total === 0;
    this.btnAbsent.disabled = isDone || total === 0;
    this.btnLeave.disabled = isDone || total === 0;

    if (isDone) {
      setTimeout(() => {
        if (this.currentIndex >= this.students.length) {
          this.completionScreen.classList.remove('hidden');
        }
      }, 600);
    }
  }

  markAttendance(status) {
    if (this.currentIndex >= this.students.length) return;
    const currentStudent = this.students[this.currentIndex];
    
    // OPTIMISTIC UI: Update immediately for speed
    const isGoogleScript = this.apiUrl.includes('script.google.com');
    const url = isGoogleScript ? this.apiUrl : `${this.apiUrl}/attendance`;
    
    // Move to next student first
    this.currentIndex++;
    this.updateCardPositions();
    this.updateUI();

    // Perform sync in background (fire and forget)
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: currentStudent.id, 
        name: currentStudent.name, 
        status: status,
        row: currentStudent.row,
        col: currentStudent.col
      })
    }).catch(e => {
      console.warn('Background sync failed:', e);
    });
  }

  async handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const btn = this.btnImportTrigger;
    const originalText = btn.innerText;
    btn.innerText = 'Importing...';
    btn.disabled = true;

    try {
      const isGoogleScript = this.apiUrl.includes('script.google.com');
      if (isGoogleScript) throw new Error('Import only works with Local Server');

      const url = `${this.apiUrl}/import`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      alert('Students list updated successfully! The app will now reload.');
      location.reload();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
      this.inputImportFile.value = '';
    }
  }

  exportToExcel() {
    const isGoogleScript = this.apiUrl.includes('script.google.com');
    if (isGoogleScript) {
      alert('Export to local Excel is only available when using the Local Server. For Google Sheets, please export directly from your spreadsheet.');
      return;
    }

    const exportUrl = `${this.apiUrl.replace('/api', '')}/api/export`;
    window.location.href = exportUrl;
  }

  async openStudentStats(studentId) {
    this.statsModal.classList.remove('hidden');
    const nameEl = document.getElementById('stats-student-name');
    const attPctEl = document.getElementById('stat-attendance-pct');
    const targetPctEl = document.getElementById('stat-target-pct');
    const statusEl = document.getElementById('stat-status');
    
    nameEl.innerText = 'Loading...';
    
    try {
      const url = `${this.apiUrl}/student-stats/${studentId}`;
      const response = await fetch(url);
      const data = await response.json();
      
      nameEl.innerText = `${data.name}'s Analytics`;
      targetPctEl.innerText = `${data.requiredPercentage}%`;
      
      this.renderChart(data);
    } catch (error) {
      nameEl.innerText = 'Error loading stats';
    }
  }

  renderChart(data) {
    if (this.attendanceChart) {
      this.attendanceChart.destroy();
    }

    const history = data.history.filter(h => h.status !== 'N/A');
    if (history.length === 0) {
      // No data yet
      return;
    }

    let presentCount = 0;
    const labels = history.map(h => h.date);
    const achievedData = [];
    const requiredData = history.map(() => data.requiredPercentage);
    const pointStyles = history.map(h => h.status === 'Leave' ? 'rectRot' : 'circle');
    const pointColors = history.map(h => {
      if (h.status === 'Present') return '#10b981';
      if (h.status === 'Absent') return '#ef4444';
      return '#f59e0b'; // Leave
    });

    history.forEach((h, i) => {
      if (h.status === 'Present' || h.status === 'Leave') presentCount++;
      const pct = Math.round((presentCount / (i + 1)) * 100);
      achievedData.push(pct);
    });

    const currentPct = achievedData[achievedData.length - 1];
    document.getElementById('stat-attendance-pct').innerText = `${currentPct}%`;
    const statusEl = document.getElementById('stat-status');
    if (currentPct >= data.requiredPercentage) {
      statusEl.innerText = 'On Track';
      statusEl.className = 'summary-value on-track';
    } else {
      statusEl.innerText = 'At Risk';
      statusEl.className = 'summary-value at-risk';
    }

    this.attendanceChart = new Chart(this.chartCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Achieved Attendance %',
            data: achievedData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.4,
            fill: true,
            pointStyle: pointStyles,
            pointRadius: 6,
            pointBackgroundColor: pointColors,
          },
          {
            label: 'Required %',
            data: requiredData,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#94a3b8', boxWidth: 10 }
          },
          tooltip: {
            callbacks: {
              footer: (items) => {
                const idx = items[0].dataIndex;
                return `Status: ${history[idx].status}`;
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  reset() {
    this.completionScreen.classList.add('hidden');
    this.renderInitialCards();
  }
}

window.addEventListener('DOMContentLoaded', () => new AttendanceApp());
