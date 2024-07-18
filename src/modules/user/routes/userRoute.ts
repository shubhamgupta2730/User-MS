import { Router } from 'express';
import { viewProfile } from '../controllers/viewProfileController';
import { updateProfile } from '../controllers/updateProfileController';
import { authMiddleware } from '../../../middlewares/authMiddleware';

const router = Router();

router.get('/view-profile', authMiddleware, viewProfile);
router.put('/update-profile', authMiddleware, updateProfile);

export default router;
