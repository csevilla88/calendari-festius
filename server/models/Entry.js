import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  id: { type: String, default: randomUUID, unique: true },
  userId: { type: String, required: true },
  date: { type: String, required: true },
  hours: { type: Number, required: true, min: 0 },
}, { collection: 'calendar_entries' });

entrySchema.index({ userId: 1, date: 1 }, { unique: true });
entrySchema.set('toJSON', {
  transform: (_document, value) => {
    delete value._id;
    delete value.__v;
    return value;
  },
});
entrySchema.set('toObject', {
  transform: (_document, value) => {
    delete value._id;
    delete value.__v;
    return value;
  },
});

export default mongoose.models.Entry || mongoose.model('Entry', entrySchema);