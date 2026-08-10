/**
 * Global Router
 * Maps base path prefixes (like /api/v1) to their respective sub-routers.
 */

import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

// Mount API version 1
router.use('/v1', v1Routes);

export default router;
