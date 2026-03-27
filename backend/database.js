const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sifuna:sifuna254@cluster0.rpsyadu.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'school_management';

console.log('MongoDB URI:', MONGO_URI ? 'Set' : 'Not set');

let client = null;
let db = null;

async function initializeDatabase() {
  client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
  
  try {
    await client.connect();
    db = client.db(DB_NAME);
    
    await db.collection('students').createIndex({ admission_no: 1 }, { unique: true });
    await db.collection('scores').createIndex({ student_id: 1 });
    await db.collection('scores').createIndex({ exam_id: 1 });
    await db.collection('exams').createIndex({ grade: 1, term: 1, year: 1 });
    
    console.log('MongoDB database connected successfully');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
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
