import { Schema } from 'mongoose';

// Embedded sub-document schema (not a standalone collection)
// Stored inside each Session document as an array
export interface IPasteEvent {
  pastedAt: Date;          
  textLength: number;     
  wordCount: number;      
  cursorPosition: number; 
}

export const PasteEventSchema = new Schema<IPasteEvent>(
  {
    pastedAt: { type: Date, required: true, default: Date.now },
    textLength: { type: Number, required: true },
    wordCount: { type: Number, required: true },
    cursorPosition: { type: Number, required: true },
  },
  { _id: false } // no separate _id for each paste event, they live inside Session
);