import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'sleep_diary';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create new connection
  const client = new MongoClient(MONGODB_URI);

  await client.connect();

  const db = client.db(DB_NAME);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getUsersCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('users');
}

export async function getSleepWeeksCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('sleep_weeks');
}

export async function getUserSettingsCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('user_settings');
}

// Initialize indexes (call this during first deployment)
export async function initializeIndexes(): Promise<void> {
  const { db } = await connectToDatabase();

  // Users collection indexes
  const usersCollection = db.collection('users');
  await usersCollection.createIndex({ email: 1 }, { unique: true });

  // Sleep weeks collection indexes
  const sleepWeeksCollection = db.collection('sleep_weeks');
  await sleepWeeksCollection.createIndex(
    { userId: 1, year: 1, weekNumber: 1 },
    { unique: true }
  );
  await sleepWeeksCollection.createIndex({ userId: 1 });

  // User settings collection indexes
  const userSettingsCollection = db.collection('user_settings');
  await userSettingsCollection.createIndex({ userId: 1 }, { unique: true });

  console.log('Database indexes initialized successfully');
}
