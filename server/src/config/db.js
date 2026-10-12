import mongoose from 'mongoose';

const CONNECTING = 2;
const CONNECTED = 1;

export function validateRuntimeEnvironment() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Add it to server/.env using server/.env.example as the template.`);
  }

  if (!/^mongodb(?:\+srv)?:\/\/\S+$/i.test(process.env.MONGODB_URI)) {
    throw new Error('MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string.');
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === CONNECTED;
}

export async function connectDB() {
  validateRuntimeEnvironment();

  if (mongoose.connection.readyState === CONNECTED || mongoose.connection.readyState === CONNECTING) {
    return mongoose.connection.asPromise();
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 0),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
    socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS || 45000)
  });

  console.log('MongoDB connection established');
  return mongoose.connection;
}

export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export default mongoose;
