import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

export async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('Falta definir MONGO_URI a server/.env.');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'calendario_festivos',
  });
  console.log(`Connectat a MongoDB (${process.env.MONGO_DB_NAME || 'calendario_festivos'}).`);
}
