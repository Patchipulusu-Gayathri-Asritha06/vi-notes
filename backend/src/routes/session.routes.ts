import { Router } from 'express';
import {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
} from '../controllers/session.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All session routes are protected
router.use(protect);

router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.put('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;