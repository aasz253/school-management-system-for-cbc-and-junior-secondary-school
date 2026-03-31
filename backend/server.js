const express = require('express');
const cors = require('cors');
const { initializeDatabase, findOne, find, insertOne, updateOne, deleteOne, deleteMany, countDocuments, aggregate } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

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
  
  // Return complete student info for portal
  res.json({ 
    success: true, 
    token: 'student-token-' + student._id,
    user: { 
      id: student._id.toString(),
      admission_no: student.admission_no,
      username: student.admission_no,
      role: 'student',
      full_name: student.full_name || 'Student',
      grade: student.grade || 'Grade 1',
      gender: student.gender || '',
      date_of_birth: student.date_of_birth || '',
      guardian_name: student.guardian_name || '',
      guardian_contact: student.guardian_contact || '',
      section: student.section || 'A',
      fee_paid: student.fee_paid || 0
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
    student_id: s.student_id.toString(),  // Convert ObjectId to string
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
  
  console.log('Portal API - studentId:', studentId);
  
  // Validate if it's a valid ObjectId format
  let validId;
  try {
    validId = new ObjectId(studentId);
  } catch (e) {
    console.log('Invalid ObjectId format:', studentId);
    return res.status(400).json({ message: 'Invalid student ID format' });
  }
  
  const student = await findOne('students', { _id: validId });
  console.log('Student found:', student ? 'yes' : 'no', student ? student.full_name : '');
  console.log('Student fee_paid from DB:', student?.fee_paid);
  console.log('Student full data:', JSON.stringify(student));
  
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  
  const scores = await aggregate('scores', [
    { $match: { student_id: validId } },
    { $lookup: { from: 'students', localField: 'student_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $sort: { year: -1, term: -1 } }
  ]);
  
  console.log('Scores found for student:', scores.length);
  console.log('Sample score:', scores[0]);
  
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
  
  console.log('Terms calculated:', terms);
  console.log('studentScoresByTerm:', JSON.stringify(studentScoresByTerm));
  
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
  
  console.log('Sending response - student:', formattedStudent);
  console.log('Sending response - fee_paid:', formattedStudent.fee_paid);
  
  res.json({
    student: formattedStudent,
    total_fee: 5000,
    scores: studentScoresByTerm,
    terms,
    totalScore,
    totalSubjects,
    average,
    position: studentPosition,
    performance
  });
});

app.get('/api/timetable', async (req, res) => {
  const { grade } = req.query;
  let query = {};
  if (grade) query.grade = grade;
  
  const timetables = await find('timetable', query);
  const formatted = timetables.map(t => ({ ...t, id: t._id, _id: undefined }));
  res.json(formatted);
});

app.get('/api/timetable/:grade', async (req, res) => {
  const { grade } = req.params;
  
  const timetable = await findOne('timetable', { grade });
  if (!timetable) {
    return res.json({ grade, schedule: {} });
  }
  const formatted = { ...timetable, id: timetable._id, _id: undefined };
  res.json(formatted);
});

app.post('/api/timetable', async (req, res) => {
  const { grade, schedule } = req.body;
  
  if (!grade || !schedule) {
    return res.status(400).json({ message: 'Grade and schedule are required' });
  }

  try {
    const existing = await findOne('timetable', { grade });
    
    if (existing) {
      const db = require('./database').getDb();
      await db.collection('timetable').updateOne(
        { grade },
        { $set: { schedule, updated_at: new Date() } }
      );
      const updated = await findOne('timetable', { grade });
      const formatted = { ...updated, id: updated._id, _id: undefined };
      return res.json(formatted);
    }
    
    const result = await insertOne('timetable', {
      grade,
      schedule,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const newTimetable = await findOne('timetable', { _id: result.lastInsertRowid });
    if (!newTimetable) {
      return res.status(500).json({ message: 'Failed to retrieve inserted timetable' });
    }
    const formatted = { ...newTimetable, id: newTimetable._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Timetable save error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/timetable/:id', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const existing = await findOne('timetable', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Timetable not found' });
  }

  await deleteOne('timetable', { _id: new ObjectId(req.params.id) });
  res.json({ message: 'Timetable deleted successfully' });
});

app.get('/api/messages', async (req, res) => {
  const { ObjectId } = require('mongodb');
  const { studentId } = req.query;
  let query = {};
  if (studentId) {
    query = { student_id: new ObjectId(studentId) };
  }
  
  const messages = await aggregate('messages', [
    { $match: query },
    { $lookup: { from: 'students', localField: 'student_id', foreignField: '_id', as: 'student' } },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
    { $sort: { created_at: 1 } }
  ]);
  
  const grouped = {};
  messages.forEach(m => {
    const sid = m.student_id.toString();
    if (!grouped[sid]) {
      grouped[sid] = {
        studentId: sid,
        studentName: m.student?.full_name || 'Unknown',
        admissionNo: m.student?.admission_no || '',
        messages: []
      };
    }
    grouped[sid].messages.push({
      id: m._id,
      text: m.text,
      sender: m.sender,
      created_at: m.created_at
    });
  });
  
  res.json(Object.values(grouped));
});

app.get('/api/messages/:studentId', async (req, res) => {
  const { studentId } = req.params;
  
  const messages = await aggregate('messages', [
    { $match: { student_id: new ObjectId(studentId) } },
    { $sort: { created_at: 1 } }
  ]);
  
  const student = await findOne('students', { _id: new ObjectId(studentId) });
  
  res.json({
    student: student ? { id: student._id, full_name: student.full_name, admission_no: student.admission_no, grade: student.grade } : null,
    messages: messages.map(m => ({
      id: m._id,
      text: m.text,
      sender: m.sender,
      created_at: m.created_at
    }))
  });
});

app.post('/api/messages', async (req, res) => {
  const { student_id, text, sender } = req.body;
  
  console.log('POST /api/messages received:', { student_id, text, sender });
  
  if (!student_id || !text || !sender) {
    return res.status(400).json({ message: 'student_id, text, and sender are required' });
  }

  try {
    const result = await insertOne('messages', {
      student_id: new ObjectId(student_id),
      text,
      sender,
      is_read: false,
      created_at: new Date()
    });
    
    const newMessage = await findOne('messages', { _id: result.lastInsertRowid });
    console.log('Message saved:', newMessage);
    const formatted = { ...newMessage, id: newMessage._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/messages/read/:studentId', async (req, res) => {
  const { studentId } = req.params;
  
  const db = require('./database').getDb();
  await db.collection('messages').updateMany(
    { student_id: new ObjectId(studentId), sender: 'student', is_read: false },
    { $set: { is_read: true } }
  );
  
  res.json({ message: 'Messages marked as read' });
});

app.get('/api/news', async (req, res) => {
  const news = await find('news', {}, { created_at: -1 });
  const formatted = news.map(n => ({ ...n, id: n._id, _id: undefined }));
  res.json(formatted);
});

app.get('/api/news/:id', async (req, res) => {
  const newsItem = await findOne('news', { _id: new ObjectId(req.params.id) });
  if (!newsItem) {
    return res.status(404).json({ message: 'News not found' });
  }
  const formatted = { ...newsItem, id: newsItem._id, _id: undefined };
  res.json(formatted);
});

app.post('/api/news', async (req, res) => {
  const { title, content, event_date, event_time, media_type, media_data, is_published } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const result = await insertOne('news', {
      title,
      content,
      event_date: event_date || null,
      event_time: event_time || null,
      media_type: media_type || null,
      media_data: media_data || null,
      is_published: is_published !== false,
      created_at: new Date()
    });
    
    const newNews = await findOne('news', { _id: result.lastInsertRowid });
    const formatted = { ...newNews, id: newNews._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/news/:id', async (req, res) => {
  const { title, content, event_date, event_time, media_type, media_data, is_published } = req.body;
  
  const existing = await findOne('news', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'News not found' });
  }

  try {
    await updateOne('news', 
      { _id: new ObjectId(req.params.id) },
      { $set: {
        title: title || existing.title,
        content: content || existing.content,
        event_date: event_date !== undefined ? event_date : existing.event_date,
        event_time: event_time !== undefined ? event_time : existing.event_time,
        media_type: media_type !== undefined ? media_type : existing.media_type,
        media_data: media_data !== undefined ? media_data : existing.media_data,
        is_published: is_published !== undefined ? is_published : existing.is_published,
        updated_at: new Date()
      }}
    );

    const updated = await findOne('news', { _id: new ObjectId(req.params.id) });
    const formatted = { ...updated, id: updated._id, _id: undefined };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  const existing = await findOne('news', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'News not found' });
  }

  await deleteOne('news', { _id: new ObjectId(req.params.id) });
  res.json({ message: 'News deleted successfully' });
});

app.get('/api/sports', async (req, res) => {
  const sports = await find('sports', {}, { created_at: -1 });
  const formatted = sports.map(s => ({ ...s, id: s._id, _id: undefined }));
  res.json(formatted);
});

app.get('/api/sports/:id', async (req, res) => {
  const sport = await findOne('sports', { _id: new ObjectId(req.params.id) });
  if (!sport) {
    return res.status(404).json({ message: 'Sport not found' });
  }
  const formatted = { ...sport, id: sport._id, _id: undefined };
  res.json(formatted);
});

app.post('/api/sports', async (req, res) => {
  const { title, description, activity_type, event_date, location, image_data, is_published } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const result = await insertOne('sports', {
      title,
      description,
      activity_type: activity_type || 'General',
      event_date: event_date || null,
      location: location || null,
      image_data: image_data || null,
      is_published: is_published !== false,
      created_at: new Date()
    });
    
    const newSport = await findOne('sports', { _id: result.lastInsertRowid });
    const formatted = { ...newSport, id: newSport._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/sports/:id', async (req, res) => {
  const { title, description, activity_type, event_date, location, image_data, is_published } = req.body;
  
  const existing = await findOne('sports', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Sport not found' });
  }

  try {
    await updateOne('sports', 
      { _id: new ObjectId(req.params.id) },
      { $set: {
        title: title || existing.title,
        description: description || existing.description,
        activity_type: activity_type !== undefined ? activity_type : existing.activity_type,
        event_date: event_date !== undefined ? event_date : existing.event_date,
        location: location !== undefined ? location : existing.location,
        image_data: image_data !== undefined ? image_data : existing.image_data,
        is_published: is_published !== undefined ? is_published : existing.is_published,
        updated_at: new Date()
      }}
    );

    const updated = await findOne('sports', { _id: new ObjectId(req.params.id) });
    const formatted = { ...updated, id: updated._id, _id: undefined };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/sports/:id', async (req, res) => {
  const existing = await findOne('sports', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Sport not found' });
  }

  await deleteOne('sports', { _id: new ObjectId(req.params.id) });
  res.json({ message: 'Sport deleted successfully' });
});

app.get('/api/assignments', async (req, res) => {
  const { grade } = req.query;
  let query = {};
  if (grade) query.grade = grade;
  
  const assignments = await find('assignments', query, { created_at: -1 });
  const formatted = assignments.map(a => ({ ...a, id: a._id, _id: undefined }));
  res.json(formatted);
});

app.get('/api/assignments/:id', async (req, res) => {
  const assignment = await findOne('assignments', { _id: new ObjectId(req.params.id) });
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  const formatted = { ...assignment, id: assignment._id, _id: undefined };
  res.json(formatted);
});

app.post('/api/assignments', async (req, res) => {
  const { title, description, grade, subject, due_date, file_data, file_name, is_published } = req.body;
  
  if (!title || !grade || !subject) {
    return res.status(400).json({ message: 'Title, grade, and subject are required' });
  }

  try {
    const result = await insertOne('assignments', {
      title,
      description: description || '',
      grade,
      subject,
      due_date: due_date || null,
      file_data: file_data || null,
      file_name: file_name || null,
      is_published: is_published !== false,
      created_at: new Date()
    });
    
    const newAssignment = await findOne('assignments', { _id: result.lastInsertRowid });
    const formatted = { ...newAssignment, id: newAssignment._id, _id: undefined };
    res.status(201).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/assignments/:id', async (req, res) => {
  const { title, description, grade, subject, due_date, file_data, file_name, is_published } = req.body;
  
  const existing = await findOne('assignments', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  try {
    await updateOne('assignments', 
      { _id: new ObjectId(req.params.id) },
      { $set: {
        title: title || existing.title,
        description: description !== undefined ? description : existing.description,
        grade: grade || existing.grade,
        subject: subject || existing.subject,
        due_date: due_date !== undefined ? due_date : existing.due_date,
        file_data: file_data !== undefined ? file_data : existing.file_data,
        file_name: file_name !== undefined ? file_name : existing.file_name,
        is_published: is_published !== undefined ? is_published : existing.is_published,
        updated_at: new Date()
      }}
    );

    const updated = await findOne('assignments', { _id: new ObjectId(req.params.id) });
    const formatted = { ...updated, id: updated._id, _id: undefined };
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  const existing = await findOne('assignments', { _id: new ObjectId(req.params.id) });
  if (!existing) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  await deleteOne('assignments', { _id: new ObjectId(req.params.id) });
  res.json({ message: 'Assignment deleted successfully' });
});

// ==================== NOTIFICATIONS API ====================

// Get notifications for a user
app.get('/api/notifications', async (req, res) => {
  const { userId, role } = req.query;
  let query = {};
  
  if (role === 'student' && userId) {
    query = { $or: [{ recipientId: userId }, { type: 'all' }] };
  }
  
  const notifications = await find('notifications', query, { created_at: -1 });
  const formatted = notifications.map(n => ({ ...n, id: n._id, _id: undefined }));
  res.json(formatted);
});

// Create a notification
app.post('/api/notifications', async (req, res) => {
  const { title, message, type, recipientId, senderId } = req.body;
  
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  
  try {
    const result = await insertOne('notifications', {
      title,
      message: message || '',
      type: type || 'info',
      recipientId: recipientId || null,
      senderId: senderId || null,
      read: false,
      created_at: new Date()
    });
    
    const notification = await findOne('notifications', { _id: result.lastInsertRowid });
    res.status(201).json({ ...notification, id: notification._id, _id: undefined });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  const { ObjectId } = require('mongodb');
  
  try {
    await updateOne('notifications', 
      { _id: new ObjectId(req.params.id) },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
  const { userId } = req.body;
  
  try {
    await updateMany('notifications',
      { recipientId: userId, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread notification count
app.get('/api/notifications/count', async (req, res) => {
  const { userId } = req.query;
  
  const count = await countDocuments('notifications', { recipientId: userId, read: false });
  res.json({ count });
});

// ==================== START SERVER ====================
initializeDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
