try { require('dotenv').config(); } catch {}
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'school_management';

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Create backend/.env with your MongoDB connection string.');
  process.exit(1);
}

console.log('MongoDB URI:', 'Set');
console.log('DB Name:', DB_NAME);
console.log('Connecting to MongoDB...');

let client = null;
let db = null;

async function initializeDatabase() {
  client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  });
  
  try {
    console.log('Attempting MongoDB connection...');
    await client.connect();
    console.log('MongoDB connected, initializing database:', DB_NAME);
    db = client.db(DB_NAME);
    
    await db.collection('students').createIndex({ admission_no: 1 }, { unique: true });
    await db.collection('scores').createIndex({ student_id: 1 });
    await db.collection('scores').createIndex({ exam_id: 1 });
    await db.collection('exams').createIndex({ grade: 1, term: 1, year: 1 });
    await db.collection('timetable').createIndex({ grade: 1 }, { unique: true });
    await db.collection('messages').createIndex({ student_id: 1, created_at: 1 });
    await db.collection('assignments').createIndex({ grade: 1, created_at: -1 });
    
    console.log('MongoDB database connected successfully');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    throw err;
  }
}

function getDb() {
  return db;
}

async function findOne(collection, query) {
  return await db.collection(collection).findOne(query);
}

async function find(collection, query = {}, sort = {}) {
  return await db.collection(collection).find(query).sort(sort).toArray();
}

async function insertOne(collection, document) {
  const result = await db.collection(collection).insertOne(document);
  return { lastInsertRowid: result.insertedId };
}

async function updateOne(collection, filter, update) {
  const result = await db.collection(collection).updateOne(filter, update);
  return { changes: result.modifiedCount };
}

async function deleteOne(collection, filter) {
  const result = await db.collection(collection).deleteOne(filter);
  return { changes: result.deletedCount };
}

async function deleteMany(collection, filter) {
  const result = await db.collection(collection).deleteMany(filter);
  return { changes: result.deletedCount };
}

async function countDocuments(collection, query = {}) {
  return await db.collection(collection).countDocuments(query);
}

async function aggregate(collection, pipeline) {
  return await db.collection(collection).aggregate(pipeline).toArray();
}

module.exports = { 
  initializeDatabase, 
  getDb, 
  findOne, 
  find, 
  insertOne, 
  updateOne, 
  deleteOne, 
  deleteMany,
  countDocuments,
  aggregate
};
