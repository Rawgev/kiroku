import mongoose, { Document, Schema } from 'mongoose';

export interface IWatchPartyItem {
  _id:           mongoose.Types.ObjectId;
  mediaId:       number;
  title:         string;
  coverImage:    string;
  mediaType:     string;
  currentEp:     number;
  totalEps?:     number;
  completed:     boolean;
  airingDay?:    string;
}

export interface IWatchParty extends Document {
  userId:    mongoose.Types.ObjectId;
  name:      string;
  season:    string;
  items:     IWatchPartyItem[];
  isPublic:  boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IWatchPartyItem>({
  mediaId:    { type: Number, required: true },
  title:      { type: String, required: true },
  coverImage: { type: String, default: '' },
  mediaType:  { type: String, default: 'anime' },
  currentEp:  { type: Number, default: 0 },
  totalEps:   { type: Number },
  completed:  { type: Boolean, default: false },
  airingDay:  { type: String },
});

const WatchPartySchema = new Schema<IWatchParty>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:     { type: String, required: true, maxlength: 80 },
    season:   { type: String, required: true },
    items:    [ItemSchema],
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

WatchPartySchema.index({ userId: 1 });

export default mongoose.model<IWatchParty>('WatchParty', WatchPartySchema);
