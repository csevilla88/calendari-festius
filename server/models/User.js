import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, default: randomUUID, unique: true },
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, unique: true, select: false },
  totalHours: { type: Number, required: true, min: 0 },
}, { collection: 'calendar_users' });

const hideInternalFields = (_document, value) => {
  delete value._id;
  delete value.__v;
  delete value.normalizedName;
  return value;
};

userSchema.set('toJSON', { transform: hideInternalFields });
userSchema.set('toObject', { transform: hideInternalFields });

export default mongoose.models.User || mongoose.model('User', userSchema);