import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  userId:        mongoose.Types.ObjectId;
  mediaId:       number;
  mediaType:     string;
  mediaTitle:    string;
  mediaCover:    string;
  rating:        number;
  title:         string;
  body:          string;
  likes:         mongoose.Types.ObjectId[];
  likesCount:    number;
  upvotes:       mongoose.Types.ObjectId[];
  downvotes:     mongoose.Types.ObjectId[];
  score:         number;
  reactionHeart: mongoose.Types.ObjectId[];
  reactionFire:  mongoose.Types.ObjectId[];
  reactionZany:  mongoose.Types.ObjectId[];
  spoiler:       boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mediaId:       { type: Number, required: true },
    mediaType:     { type: String, required: true },
    mediaTitle:    { type: String, required: true },
    mediaCover:    { type: String, default: '' },
    rating:        { type: Number, required: true, min: 1, max: 10 },
    title:         { type: String, required: true, maxlength: 120 },
    body:          { type: String, required: true, maxlength: 5000 },
    likes:         [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likesCount:    { type: Number, default: 0 },
    upvotes:       [{ type: Schema.Types.ObjectId, ref: 'User' }],
    downvotes:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
    score:         { type: Number, default: 0 },
    reactionHeart: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactionFire:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactionZany:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
    spoiler:       { type: Boolean, default: false },
  },
  { timestamps: true },
);

ReviewSchema.index({ mediaId: 1, mediaType: 1 });
ReviewSchema.index({ userId: 1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
