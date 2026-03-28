import mongoose, { Document, Schema } from 'mongoose';
import { IPasteEvent, PasteEventSchema } from './pasteEvent.model';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  duration: number;
  pasteEvents: IPasteEvent[];   // array of all paste events this session
  totalPastedChars: number;     
  totalPastedWords: number;     
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Session',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    pasteEvents: {
      type: [PasteEventSchema],
      default: [],
    },
    totalPastedChars: {
      type: Number,
      default: 0,
    },
    totalPastedWords: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Session = mongoose.model<ISession>('Session', SessionSchema);