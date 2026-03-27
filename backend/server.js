const express = require('express');
const cors = require('cors');
const { initializeDatabase, findOne, find, insertOne, updateOne, deleteOne, deleteMany, countDocuments, aggregate } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

let adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

async function generateAdmissionNo() {
  const year = new Date().getFullYear();
  const count = await countDocuments('students');
  return `CBC-${year}-${String(count + 1).padStart(4, '0')}`;
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminCredentials.username && password === adminCredentials.password) {
    res.json({ success: true, token: 'demo-token', user: { username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/student-login', async (req, res) => {
  const { admission_no, password } = req.body;
  
  const student = await findOne('students', { admission_no });
  
  if (!student) {
    return res.status(401).json({ success: false, message: 'Invalid admission number' });
  }
  
  if (password !== admission_no) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }
  
  res.json({ 
    success: true, 
    token: 'student-token-' + student._id,
    user: { 
      id: student._id,
      username: student.admission_no,
      role: 'student',
      full_name: student.full_name,
      grade: student.grade
    } 
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { username } = req.body;
  
  if (username !== adminCredentials.username) {
    return res.status(404).json({ success: false, message: 'Username not found' });
  }
  
  const newPassword = 'admin' + Math.floor(Math.random() * 10000);
  adminCredentials.password = newPassword.toString();
  
  res.json({ 
    success: true, 
    message: 'Password reset successful',
    newPassword: adminCredentials.password 
  });
});

app.get('/api/students', async (req, res) => {
  const students = await find('students', {}, { created_at: -1 });
  const formatted = students.map(s => ({
    ...s,
    id: s._id,
    _id: undefined
  }));
  res.json(formatted);
});

app.get('/api/students/search', async (req, res) => {
  const { q } = req.query;
  let query = {};
  if (q) {
    query = {
      $or: [
        { full_name: { $regex: q, $options: 'i' } },
        { admission_no: { $regex: q, $options: 'i' } }
      ]
    };
  }
  const students = await find('students', query, { created_at: -1 });
  const formatted = students.map(s => ({
    ...s,
    id: s._id,
    _id: undefined
  }));
  res.json(formatted);
});

app.get('/api/students/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const student = await findOne('students', { _id: new ObjectId(req.params.id) });
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  const formatted = { ...student, id: student._id, _id: undefined };
  res.json(formatted);
});

app.post('/api/students', async (req, res) => {
  const { full_name, grade, gender, date_of_birth, guardian_name, guardian_contact, fee_paid } = req.body;
  
  if (!full_name || !grade || !gender || !guardian_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const admission_no = await generateAdmissionNo();
  
  try {
    const doc = {
      full_name,
      admission_no,
      grade,
      gender,
      date_of_birth,
      guardian_name,
      guardian_contact,
      fee_paid: fee_paid || 0,
      created_at: new Date()
    };
    
    const result = await insertOne('students', doc);
    const insertedId = result.lastInsertRowid;
    const newStudent = await findOne('students', { _id: insertedId });
    
    if (!newStudent) {
      return res.status(500).json({ message: 'Failed to retrieve inserted student' });
    }
    
    const formatted = { 
      ...newStudent, 
      id: newStudent._id.toString(), 
      _id: undefined 
    };
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const { full_name, grade, gender, date_of_birth, guardian_name, guardian_contact, fee_paid } = req.body;
  
  const existing = await findOne('students', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Student not found' });
  }

  try {
    await updateOne('students', 
      { _id: new ObjectId(req.params.id) },
      { $set: {
        full_name: full_name || existing.full_name,
        grade: grade || existing.grade,
        gender: gender || existing.gender,
        date_of_birth: date_of_birth || existing.date_of_birth,
        guardian_name: guardian_name || existing.guardian_name,
        guardian_contact: guardian_contact || existing.guardian_contact,
        fee_paid: fee_paid !== undefined ? fee_paid : existing.fee_paid
      }}
    );

    const updated = await findOne('students', { _id: new ObjectId(req.params.id) });
    const formatted = { ...updated, id: updated._id, _id: undefined };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const existing = await findOne('students', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Student not found' });
  }

  await deleteMany('scores', { student_id: new ObjectId(req.params.id) });
  await deleteOne('students', { _id: new ObjectId(req.params.id) });
  res.json({ message: 'Student deleted successfully' });
});

app.get('/api/scores', async (req, res) => {
  const scores = await aggregate('scores', [
    { $lookup: { from: 'students', localField: 'student_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $sort: { created_at: -1 } }
  ]);
  const formatted = scores.map(s => ({
    ...s,
    full_name: s.student.full_name,
    admission_no: s.student.admission_no,
    grade: s.student.grade,
    student: undefined,
    id: s._id,
    _id: undefined
  }));
  res.json(formatted);
});

app.post('/api/scores', async (req, res) => {
  const { student_id, subject, score, competency, term, year } = req.body;
  const { ObjectId } = require('mongodb');
  
  if (!student_id || !subject || score === undefined || !term || !year) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    const result = await insertOne('scores', {
      student_id: new ObjectId(student_id),
      subject,
      score,
      competency: competency || null,
      term,
      year,
      created_at: new Date()
    });
    
    const newScore = await findOne('scores', { _id: result.lastInsertRowid });
    const formatted = { ...newScore, id: newScore._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/scores/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const { score } = req.body;
  const scoreId = req.params.id;
  
  if (score === undefined) {
    return res.status(400).json({ message: 'Score is required' });
  }

  const existing = await findOne('scores', { _id: new ObjectId(scoreId) });
  if (!existing) {
    return res.status(404).json({ message: 'Score not found' });
  }

  try {
    await updateOne('scores', { _id: new ObjectId(scoreId) }, { $set: { score } });
    const updated = await findOne('scores', { _id: new ObjectId(scoreId) });
    const formatted = { ...updated, id: updated._id, _id: undefined };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  const totalStudents = await countDocuments('students');
  
  const students = await find('students');
  const totalFees = students.reduce((sum, s) => sum + (s.fee_paid || 0), 0);
  
  const gradeStats = await aggregate('students', [
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const capitationRate = 5000;
  const expectedFees = totalStudents * capitationRate;
  const tuitionAccount = Math.round(expectedFees * 0.6);
  const operationsAccount = Math.round(expectedFees * 0.25);
  const infrastructureAccount = Math.round(expectedFees * 0.15);

  res.json({
    totalStudents,
    totalFees,
    gradeStats: gradeStats.map(g => ({ grade: g._id, count: g.count })),
    financial: {
      capitationRate,
      expectedFees,
      tuitionAccount,
      operationsAccount,
      infrastructureAccount
    }
  });
});

app.get('/api/exams', async (req, res) => {
  const { grade, term, year } = req.query;
  let query = {};
  
  if (grade) query.grade = grade;
  if (term) query.term = term;
  if (year) query.year = parseInt(year);
  
  const exams = await find('exams', query, { year: -1, term: -1, _id: 1 });
  const formatted = exams.map(e => ({ ...e, id: e._id, _id: undefined }));
  res.json(formatted);
});

app.post('/api/exams', async (req, res) => {
  const { name, grade, term, year, max_score } = req.body;
  
  if (!name || !grade || !term || !year) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const count = await countDocuments('exams', { grade, term, year: parseInt(year) });
  if (count >= 8) {
    return res.status(400).json({ message: 'Maximum 8 exams per class per term reached' });
  }

  try {
    const result = await insertOne('exams', {
      name,
      grade,
      term,
      year: parseInt(year),
      max_score: max_score || 100,
      created_at: new Date()
    });
    
    const newExam = await findOne('exams', { _id: result.lastInsertRowid });
    const formatted = { ...newExam, id: newExam._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/exams/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  await deleteMany('scores', { exam_id: new ObjectId(req.params.id) });
  await deleteOne('exams', { _id: new ObjectId(req.params.id) });
  res.json({ message: 'Exam deleted successfully' });
});

app.get('/api/exams/:id/results', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const examId = req.params.id;
  
  const exam = await findOne('exams', { _id: new ObjectId(examId) });
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }

  const students = await find('students', { grade: exam.grade });
  const scores = await find('scores', { exam_id: new ObjectId(examId) });
  
  const scoresMap = {};
  scores.forEach(s => {
    scoresMap[s.student_id.toString()] = s.score;
  });

  const studentsWithScores = students.map(s => ({
    id: s._id,
    full_name: s.full_name,
    admission_no: s.admission_no,
    grade: s.grade,
    score: scoresMap[s._id.toString()] || 0
  }));

  const ranked = studentsWithScores
    .map(s => ({ ...s, score: s.score || 0 }))
    .sort((a, b) => b.score - a.score)
    .map((s, idx) => ({ ...s, position: idx + 1 }));

  const formattedExam = { ...exam, id: exam._id, _id: undefined };
  res.json({
    exam: formattedExam,
    results: ranked
  });
});

app.post('/api/exams/:id/scores', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const examId = req.params.id;
  const { scores } = req.body;

  if (!scores || !Array.isArray(scores)) {
    return res.status(400).json({ message: 'Scores array required' });
  }

  try {
    for (const { student_id, score, subject } of scores) {
      const existing = await findOne('scores', { 
        student_id: new ObjectId(student_id), 
        exam_id: new ObjectId(examId),
        subject 
      });
      
      if (existing) {
        await updateOne('scores', { _id: existing._id }, { $set: { score } });
      } else {
        await insertOne('scores', {
          student_id: new ObjectId(student_id),
          exam_id: new ObjectId(examId),
          subject,
          score
        });
      }
    }
    res.json({ message: 'Scores saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/classes/:grade/rankings', async (req, res) => {
  const { grade } = req.params;
  const { term, year } = req.query;

  const exams = await find('exams', { grade, term, year: parseInt(year) });
  
  if (exams.length === 0) {
    return res.json({ rankings: [], exams: [] });
  }

  const examIds = exams.map(e => e._id);
  
  const students = await find('students', { grade });
  const scores = await find('scores', { 
    exam_id: { $in: examIds }
  });
  
  const scoresByStudent = {};
  scores.forEach(s => {
    const sid = s.student_id.toString();
    if (!scoresByStudent[sid]) {
      scoresByStudent[sid] = { total: 0, count: 0 };
    }
    scoresByStudent[sid].total += s.score || 0;
    scoresByStudent[sid].count += 1;
  });

  const ranked = students
    .map(s => {
      const sid = s._id.toString();
      const studentScores = scoresByStudent[sid];
      const totalScore = studentScores ? studentScores.total : 0;
      const examsTaken = studentScores ? studentScores.count : 0;
      return {
        id: s._id,
        full_name: s.full_name,
        admission_no: s.admission_no,
        grade: s.grade,
        total_score: totalScore,
        exams_taken: examsTaken,
        total_exams: exams.length,
        average: examsTaken > 0 ? Math.round(totalScore / examsTaken) : 0
      };
    })
    .filter(s => s.exams_taken > 0)
    .sort((a, b) => b.total_score - a.total_score)
    .map((s, idx) => ({ ...s, position: idx + 1 }));

  const formattedExams = exams.map(e => ({ ...e, id: e._id, _id: undefined }));
  res.json({
    exams: formattedExams,
    rankings: ranked
  });
});

app.get('/api/student/portal/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const studentId = req.params.id;
  
  const student = await findOne('students', { _id: new ObjectId(studentId) });
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  
  const scores = await aggregate('scores', [
    { $match: { student_id: new ObjectId(studentId) } },
    { $lookup: { from: 'students', localField: 'student_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $sort: { year: -1, term: -1 } }
  ]);
  
  const subjects = ['English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies', 'Religious Education', 'Creative Arts', 'Physical & Health Education', 'Agriculture', 'Life Skills'];
  
  const studentScoresByTerm = {};
  
  scores.forEach(score => {
    const key = `${score.term}-${score.year}`;
    if (!studentScoresByTerm[key]) {
      studentScoresByTerm[key] = { term: score.term, year: score.year, subjects: {} };
    }
    studentScoresByTerm[key].subjects[score.subject] = score.score;
  });
  
  const terms = Object.keys(studentScoresByTerm).sort((a, b) => {
    const [termA, yearA] = a.split('-');
    const [termB, yearB] = b.split('-');
    if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
    return termB.localeCompare(termA);
  });
  
  let totalScore = 0;
  let totalSubjects = 0;
  
  terms.forEach(term => {
    const termData = studentScoresByTerm[term];
    Object.values(termData.subjects).forEach(score => {
      if (score > 0) {
        totalScore += score;
        totalSubjects++;
      }
    });
  });
  
  const average = totalSubjects > 0 ? Math.round(totalScore / totalSubjects) : 0;
  
  const classStudents = await find('students', { grade: student.grade });
  
  const classScores = await aggregate('scores', [
    { $lookup: { from: 'students', localField: 'student_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $match: { 'student.grade': student.grade } }
  ]);
  
  const studentTotals = {};
  classScores.forEach(sc => {
    const sid = sc.student_id.toString();
    if (!studentTotals[sid]) {
      studentTotals[sid] = { total: 0, count: 0 };
    }
    if (sc.score > 0) {
      studentTotals[sid].total += sc.score;
      studentTotals[sid].count += 1;
    }
  });
  
  const classAverages = classStudents.map(s => {
    const sid = s._id.toString();
    const totals = studentTotals[sid];
    return {
      id: s._id,
      average: totals && totals.count > 0 ? Math.round(totals.total / totals.count) : 0
    };
  });
  
  const sortedStudents = classAverages
    .sort((a, b) => b.average - a.average)
    .map((s, idx) => ({ ...s, position: idx + 1 }));
  
  const studentPosition = sortedStudents.find(s => s.id.toString() === studentId)?.position || '-';
  
  let performance = 'Fair';
  if (average >= 80) performance = 'Excellent';
  else if (average >= 70) performance = 'Very Good';
  else if (average >= 60) performance = 'Good';
  else if (average >= 50) performance = 'Fair';
  else if (average < 40) performance = 'Needs Improvement';
  
  const formattedStudent = { ...student, id: student._id, _id: undefined };
  res.json({
    student: formattedStudent,
    scores: studentScoresByTerm,
    terms,
    totalScore,
    totalSubjects,
    average,
    position: studentPosition,
    performance
  });
});

initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});
