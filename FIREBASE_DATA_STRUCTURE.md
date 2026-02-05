# Firebase Data Structure Guide

This document explains the data structure required in Firebase Firestore for the application to work properly.

## Collections

### 1. `users` Collection
User accounts and their roles.

**Document Structure:**
```javascript
{
  email: "user@example.com",
  name: "User Name",
  phone: "+1234567890",        // Optional
  parentPhone: "+1234567890",  // Optional; for students only - parent/guardian phone
  qrCodeNumber: "STU001",      // Optional; for students - number on printed card, encoded in QR for scan at attendance
  role: "admin" | "student" | "teacher",
  status: "active" | "inactive",
  classIds: ["course-id"],     // For students - classes they are enrolled in
  organizationId: "org-id",    // For org admins/teachers/students
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Document ID:** Firebase Auth UID (or Firestore auto-ID if created without Auth)

**Note:** For students, set **Card / QR Number** when registering or editing. That number is printed on the student card and encoded in the QR code. At attendance, scan the QR (or enter the number) to mark the student present.

---

### 2. `recordings` Collection
Session recordings stored on Google Drive.

**Document Structure:**
```javascript
{
  title: "Session Title",
  description: "Session description",
  month: "2025-November", // Format: YYYY-MonthName
  date: "2025-11-15", // Format: YYYY-MM-DD
  duration: "1h 30m",
  videoUrl: "https://drive.google.com/file/d/...", // Google Drive link
  topics: ["Topic 1", "Topic 2", "Topic 3"], // Array of topics
  week: "Week 04", // Optional
  type: "Session Recording", // Optional
  status: "active" | "inactive",
  youtubeVideoId: "Paxsh-y8I9w", // Optional: for YouTube videos on homepage
  level: "Beginner", // Optional
  category: "Development", // Optional
  views: "12.5K", // Optional
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Important Notes:**
- `videoUrl` should contain the Google Drive link
- `month` format: "YYYY-MonthName" (e.g., "2025-November", "2026-January")
- `topics` should be an array of strings
- For YouTube videos on homepage, include `youtubeVideoId`

---

### 3. `tasks` Collection
Student tasks and assignments.

**Document Structure:**
```javascript
{
  title: "Task Title",
  description: "Task description",
  userId: "firebase-auth-uid", // User who the task is assigned to
  status: "not-started" | "in-progress" | "completed",
  progress: 0-100, // Percentage
  assignedDate: Timestamp,
  dueDate: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 4. `blogPosts` Collection
Blog posts and articles.

**Document Structure:**
```javascript
{
  title: "Blog Post Title",
  excerpt: "Short excerpt",
  description: "Full content or description",
  author: "Author Name",
  image: "https://...", // Image URL
  category: "Development", // Optional
  readTime: "8 min read", // Optional
  likes: 0, // Optional
  status: "published" | "draft",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Note:** Only posts with `status: "published"` will appear on the homepage and user dashboard.

---

### 5. `zoomSessions` Collection
Zoom meeting sessions.

**Document Structure:**
```javascript
{
  title: "Session Title",
  description: "Session description",
  status: "upcoming" | "ongoing" | "ended",
  date: "Sunday, January 4, 2026", // Formatted date string
  time: "09:00 AM - 12:00 PM", // Time range
  meetingId: "892 7779 3060", // Zoom meeting ID
  passcode: "770861", // Zoom passcode
  meetingUrl: "https://zoom.us/j/...", // Optional: Direct join link
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 6. `courses` Collection
Course information.

**Document Structure:**
```javascript
{
  title: "Course Title",
  description: "Course description",
  instructor: "Instructor Name",
  duration: "12 weeks",
  price: "$299",
  status: "active" | "inactive",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 7. `tutes` Collection
Book distribution tracking (tute dividing by organization). Track whether each student received a book for a specific month — same as tuition fee tracking.

**Document Structure:**
```javascript
{
  userId: "user-id",            // Student ID
  classId: "course-doc-id",     // Reference to courses collection
  month: "01",                  // Month (01-12)
  year: "2025",                 // Year
  received: true,               // Boolean: true if student received book, false if not
  organizationId: "org-id",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Note:** Organization admins manage under **Organization → Tute dividing**. Select class, month, year, then mark "Received" or "Not received" for each student (like tuition fee payments). One record per student per class per month.

---

### 8. `attendance` Collection
Student attendance per class per date (organization-managed).

**Document Structure:**
```javascript
{
  classId: "course-doc-id",       // Reference to courses collection
  date: "2026-01-25",             // YYYY-MM-DD
  organizationId: "org-id",
  records: [
    { userId: "user-id", studentName: "Student Name", status: "present" | "absent" | "late" }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Note:** One document per class per date. Organization admins manage attendance from **Organization → Attendance**.

---

### 9. `payments` Collection
Payment transactions.

**Document Structure:**
```javascript
{
  userId: "firebase-auth-uid",
  amount: "299.00", // String or number
  status: "pending" | "completed" | "failed",
  transactionId: "txn_...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Setting Up Google Drive Links for Recordings

### Step 1: Upload Video to Google Drive
1. Upload your video file to Google Drive
2. Right-click the file → "Get link"
3. Set sharing to "Anyone with the link can view"
4. Copy the link

### Step 2: Add Recording in Admin Panel
1. Go to Admin → Recordings
2. Click "Add Recording"
3. Fill in the details:
   - **Title:** Session title
   - **Description:** Session description
   - **Month:** Format as "YYYY-MonthName" (e.g., "2025-November")
   - **Date:** Format as "YYYY-MM-DD" (e.g., "2025-11-15")
   - **Duration:** e.g., "1h 30m"
   - **Video URL:** Paste the Google Drive link here
   - **Topics:** Comma-separated list of topics covered
   - **Status:** Set to "active" to make it available

### Step 3: Verify
- The recording will appear in the Session Recordings page
- Students can click "Watch on Google Drive" to open the link

---

## Example Data

### Example Recording Document:
```javascript
{
  title: "Introduction to DevOps - Week 04",
  description: "Introduction about Instructor and Institute, Definition about DevOps",
  month: "2025-November",
  date: "2025-11-15",
  duration: "1h 30m",
  videoUrl: "https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing",
  topics: [
    "Introduction about Instructor and Institute",
    "Definition about DevOps",
    "Discuss about DevOps CALMS",
    "Docker, Kubernetes, Terraform Introduction"
  ],
  week: "Week 04",
  type: "Session Recording",
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Important Notes

1. **All demo data has been removed** - The application now loads all data from Firebase
2. **Google Drive Links** - Recordings use Google Drive links stored in the `videoUrl` field
3. **Month Format** - Always use "YYYY-MonthName" format (e.g., "2025-November", not "2025-11")
4. **Status Fields** - Use "active" for available content, "inactive" for hidden content
5. **Timestamps** - Use Firestore Timestamp for date fields
6. **Arrays** - Topics should be stored as arrays, not comma-separated strings

---

## Quick Start

1. **Create your first admin user** (see ADMIN_AUTH_SETUP.md)
2. **Add recordings** via Admin → Recordings
3. **Add blog posts** via Admin → Blog
4. **Add tasks** via Admin → Tasks
5. **Add zoom sessions** via Admin (you may need to add this feature)

All data will automatically appear in the user-facing pages!

