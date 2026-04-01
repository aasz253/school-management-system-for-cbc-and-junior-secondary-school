# CBC Smart School - Kenya

A Competency-Based Curriculum (CBC) aligned School Management System for Kenyan Primary and Junior Secondary Schools.

## Features

- **Student Management**: Add, edit, delete, and search students
- **Dashboard**: Real-time statistics on students and fees
- **Academic (CBC)**: Track subject scores and competencies
- **Financial**: CBC capitation structure tracking
- **Export**: PDF reports and KEMIS-compliant JSON/CSV export

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (MongoDB Atlas)

## Quick Start

### Prerequisites

- Node.js 18+

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server (from backend folder):
```bash
npm start
```
Server runs on http://localhost:5000

2. Start the frontend (from frontend folder):
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### Login Credentials

- Username: `admin`
- Password: `admin123`

## Project Structure

```
schoolmngmntssytm/
├── backend/
│   ├── package.json
│   ├── server.js       # Express server with API routes
│   └── database.js     # MongoDB database setup
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── components/ # React components
│   │   └── utils/      # Export utilities
│   └── index.html
├── SPEC.md
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/students | Get all students |
| GET | /api/students/search | Search students |
| POST | /api/students | Add student |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Delete student |
| GET | /api/scores | Get scores |
| POST | /api/scores | Add score |
| GET | /api/dashboard/stats | Dashboard statistics |

## KEMIS Compliance

Export student data in JSON or CSV format compatible with Kenya Education Management Information System (KEMIS) requirements.

## License

MIT
