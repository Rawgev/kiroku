import mongoose, { Document, Schema } from 'mongoose';

export type MediaType   = 'anime' | 'manga' | 'manhwa' | 'manhua' | 'lightnovel';
export type WatchStatus = 'watching' | 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch' | 'plan_to_read';

export interface IMediaEntry extends Document {
  userId:        mongoose.Types.ObjectId;
  mediaId:       number;      // AniList ID
  mediaType:     MediaType;
  title:         string;
  coverImage:    string;
  status:        WatchStatus;
  score:         number;      // 0–10
  progress:      number;      // episodes / chapters watched/read
  totalProgress?: number;
  startDate?:    Date;
  finishDate?:   Date;
  notes:         string;
  genres:        string[];
  rewatches:     number;
  isFavorite:    boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

const MediaEntrySchema = new Schema<IMediaEntry>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mediaId:       { type: Number, required: true },
    mediaType:     { type: String, enum: ['anime', 'manga', 'manhwa', 'manhua', 'lightnovel'], required: true },
    title:         { type: String, required: true },
    coverImage:    { type: String, default: '' },
    status:        {
      type:     String,
      enum:     ['watching', 'reading', 'completed', 'on_hold', 'dropped', 'plan_to_watch', 'plan_to_read'],
      required: true,
    },
    score:         { type: Number, min: 0, max: 10, default: 0 },
    progress:      { type: Number, default: 0 },
    totalProgress: { type: Number },
    startDate:     { type: Date },
    finishDate:    { type: Date },
    notes:         { type: String, default: '', maxlength: 2000 },
    genres:        [{ type: String }],
    rewatches:     { type: Number, default: 0 },
    isFavorite:    { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One entry per user per media
MediaEntrySchema.index({ userId: 1, mediaId: 1 }, { unique: true });
MediaEntrySchema.index({ userId: 1, status: 1 });

export default mongoose.model<IMediaEntry>('MediaEntry', MediaEntrySchema);
