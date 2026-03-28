import { Response } from 'express';
import { Session } from '../models/session.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Create a new session
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, content, wordCount, characterCount, duration,
      pasteEvents = [], totalPastedChars = 0, totalPastedWords = 0,
    } = req.body;

    const session = await Session.create({
      userId: req.userId,
      title: title || 'Untitled Session',
      content: content || '',
      wordCount: wordCount || 0,
      characterCount: characterCount || 0,
      duration: duration || 0,
      pasteEvents,
      totalPastedChars,
      totalPastedWords,
    });

    res.status(201).json({ message: 'Session saved successfully', session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Failed to save session' });
  }
};

// Get all sessions for user
export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('-content -pasteEvents'); // exclude heavy fields from list

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

// Get single session by ID (full data including paste events)
export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch session' });
  }
};

// Update a session
export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, content, wordCount, characterCount, duration,
      pasteEvents, totalPastedChars, totalPastedWords,
    } = req.body;

    const updateData: Record<string, unknown> = {
      title, content, wordCount, characterCount, duration,
    };

    // Only update paste fields if provided
    if (pasteEvents !== undefined) updateData.pasteEvents = pasteEvents;
    if (totalPastedChars !== undefined) updateData.totalPastedChars = totalPastedChars;
    if (totalPastedWords !== undefined) updateData.totalPastedWords = totalPastedWords;

    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.json({ message: 'Session updated', session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update session' });
  }
};

// Delete a session
export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete session' });
  }
};