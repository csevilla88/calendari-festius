import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  id: { type: String, default: randomUUID, unique: true },
  date: { type: String, required: true, unique: true },
  name: { type: String, default: '', trim: true },
}, { collection: 'calendar_holidays' });

holidaySchema.set('toJSON', {
  transform: (_document, value) => {
    delete value._id;
    delete value.__v;
    return value;
  },
});
holidaySchema.set('toObject', {
  transform: (_document, value) => {
    delete value._id;
    delete value.__v;
    return value;
  },
});

export default mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);