# CBC Smart School - School Management System

## Project Overview

**Project Name:** CBC Smart School  
**Type:** Full-stack Web Application  
**Core Functionality:** School Management System for Kenyan Primary and Junior Secondary Schools under Competency-Based Curriculum (CBC)  
**Target Users:** School Administrators, Teachers, (Future: Parents, Students)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), Tailwind CSS, Axios |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| PDF | jsPDF, jspdf-autotable |

---

## UI/UX Specification

### Layout Structure

- **Sidebar Navigation** (fixed left, 250px width on desktop, collapsible on mobile)
- **Main Content Area** (flex-1, scrollable)
- **Top Navbar** (sticky, 64px height)

### Responsive Breakpoints

- Mobile: < 768px (sidebar becomes hamburger menu)
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Color Palette

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Kenyan Blue | `#003366` |
| Secondary | Kenyan Green | `#006600` |
| Accent | Gold | `#FFD700` |
| Background | Light Gray | `#F8FAFC` |
| Surface | White | `#FFFFFF` |
| Text Primary | Dark Gray | `#1E293B` |
| Text Secondary | Medium Gray | `#64748B` |
| Success | Green | `#16A34A` |
| Warning | Amber | `#F59E0B` |
| Danger | Red | `#DC2626` |

### Typography

- **Font Family:** Inter (Google Fonts), system-ui fallback
- **Headings:** 
  - H1: 2rem, font-bold
  - H2: 1.5rem, font-semibold
  - H3: 1.25rem, font-semibold
- **Body:** 1rem, regular
- **Small:** 0.875rem

### Spacing System

- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px, 48px

### Components

1. **Sidebar** - Dark blue background (#003366), white text, navigation items with icons
2. **Cards** - White background, subtle shadow, rounded corners (8px)
3. **Buttons** - Primary (blue), Secondary (green), Danger (red)
4. **Tables** - Striped rows, hover effect, sticky header
5. **Forms** - Input fields with labels, validation states
6. **Modals** - Centered, overlay background, close button
7. **Stats Cards** - Icon + number + label format

---

## Functionality Specification

### 1. Authentication (Simplified)

- Demo login page with single admin credential
- Mock authentication (no real JWT for MVP)
- Session stored in localStorage

### 2. Dashboard

- **Stats Cards:**
  - Total Students (count)
  - Total Fees Collected (KES sum)
  - Students per Grade (breakdown)
- **Quick Actions:**
  - Add Student button
  - Export buttons

### 3. Student Management

**Fields:**
- id (auto)
- full_name (required)
- admission_no (auto-generated: CBC-{YEAR}-{4DIGIT})
- grade (Grade 1-9)
- gender (Male/Female)
- date_of_birth (date)
- guardian_name (required)
- guardian_contact (phone number)
- fee_paid (KES, default 0)

**Features:**
- Add student (form with validation)
- View all students (paginated table)
- Search students (real-time, backend endpoint)
- Edit student (modal with pre-filled form)
- Delete student (confirmation dialog)

### 4. Search Function

- GET `/api/students/search?q=query`
- Partial matching on full_name and admission_no
- Real-time filtering on frontend

### 5. Edit Function

- PUT `/api/students/:id`
- Modal form with all fields pre-filled
- Validation on required fields

### 6. Delete Function

- DELETE `/api/students/:id`
- Confirmation dialog before deletion

### 7. Export to PDF

- Button: "Export Student Report"
- Uses jsPDF + jspdf-autotable
- Includes:
  - School Name: "CBC Smart School"
  - Title: "Student Report"
  - Table: Name | Admission No | Grade | Fees (KES)
  - Generated date

### 8. CBC Academic Module

**Subjects:**
- English, Kiswahili, Mathematics, Science, Social Studies, Religious Education, Creative Arts, Physical & Health Education

**Competencies tracked:**
- Communication
- Critical Thinking
- Creativity
- Collaboration
- Digital Literacy

**Data structure:**
- student_id, subject, score (0-100), competency, term, year

### 9. Financial Module

**Fee Structure:**
- Display total collected fees
- Simulate CBC capitation breakdown:
  - Tuition Account (60%)
  - Operations Account (25%)
  - Infrastructure Account (15%)
- Capitation rate: KES 4,193.07 per learner per term

### 10. KEMIS Export

- Button: "Export KEMIS Data"
- Export formats: JSON and CSV
- Includes fields:
  - name, admission_no, grade, date_of_birth, guardian_name, guardian_contact

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Demo login |
| GET | /api/students | Get all students |
| GET | /api/students/search?q= | Search students |
| GET | /api/students/:id | Get student by ID |
| POST | /api/students | Create student |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |
| GET | /api/scores | Get all scores |
| POST | /api/scores | Add score |
| GET | /api/dashboard/stats | Get dashboard stats |

---

## Database Schema

```sql
-- Students table
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  admission_no TEXT UNIQUE NOT NULL,
  grade TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth TEXT,
  guardian_name TEXT NOT NULL,
  guardian_contact TEXT,
  fee_paid INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scores table (CBC Academic)
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL,
  competency TEXT,
  term TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

---

## Acceptance Criteria

### Visual Checkpoints

1. ✅ Login page displays with school branding
2. ✅ Dashboard shows 3 stat cards with real data
3. ✅ Student table displays with all columns
4. ✅ Add student form validates required fields
5. ✅ Edit modal opens with pre-filled data
6. ✅ Search filters table in real-time
7. ✅ PDF export generates readable document
8. ✅ KEMIS export downloads JSON/CSV file
9. ✅ Sidebar navigation works on all pages
10. ✅ Responsive layout works on mobile

### Functional Checkpoints

1. ✅ Can add a new student
2. ✅ Can search for students by name or admission number
3. ✅ Can edit existing student
4. ✅ Can delete student with confirmation
5. ✅ Can export student list to PDF
6. ✅ Can export data in KEMIS format (JSON/CSV)
7. ✅ Dashboard stats update in real-time
8. ✅ Can add subject scores for CBC tracking

---

## Folder Structure

```
schoolmngmntssytm/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── database.js
│   └── routes/
│       ├── auth.js
│       ├── students.js
│       ├── scores.js
│       └── dashboard.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── StudentForm.jsx
│   │   │   ├── EditStudentModal.jsx
│   │   │   ├── Academic.jsx
│   │   │   ├── Finance.jsx
│   │   │   └── Login.jsx
│   │   └── utils/
│   │       ├── api.js
│   │       └── export.js
│   └── public/
├── SPEC.md
└── README.md
```
