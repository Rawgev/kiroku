import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username:  string;
  email:     string;
  password?: string;
  avatar:    string;
  bio:       string;
  role:      'user' | 'admin';
  level:     number;
  xp:        number;
  provider:  'local' | 'google';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: true },
    avatar:   { type: String, default: '' },
    bio:      { type: String, default: '', maxlength: 300 },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    level:    { type: Number, default: 1 },
    xp:       { type: Number, default: 0 },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true },
  },
  { timestamps: true },
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Remove password from JSON output
UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
