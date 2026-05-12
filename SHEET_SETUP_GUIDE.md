# How to Set Up Your Google Sheet & Dummy Data

Since I cannot create the Google Sheet for you directly, follow these simple steps to get your app running with real data!

## 1. Create the Sheet
1.  Go to [sheets.new](https://sheets.new) to create a new spreadsheet.
2.  Name it "Attendance Tracker".

## 2. Add Dummy Data (Automatic Way)
1.  In your Google Sheet, go to **Extensions > Apps Script**.
2.  Paste the code from [google_apps_script.js](file:///c:/Users/HP/Desktop/attendance/google_apps_script.js).
3.  In the toolbar at the top of the Script Editor, click the dropdown that says `doGet` or `doPost` and select **setupDummyData**.
4.  Click **Run**.
5.  Go back to your Google Sheet—you will see a "Students" tab with dummy data!

## 3. Deploy the Web App
1.  In the Script Editor, click **Deploy > New Deployment**.
2.  Select type: **Web App**.
3.  Set "Execute as" to **Me**.
4.  Set "Who has access" to **Anyone**.
5.  Click **Deploy** (you may need to authorize permissions).
6.  Copy the **Web App URL**.

## 4. Connect the App
1.  Open Attendance Pro in your browser.
2.  Click the **⚙️ (Settings)** icon.
3.  Paste the **Web App URL** and click **Save & Connect**.
4.  The app will now load the students from your sheet!

## 5. View History
-   Mark some students as Present or Absent.
-   Click the **📜 (History)** icon in the top right.
-   You will see the dashboard with exact date, time, and student records.
