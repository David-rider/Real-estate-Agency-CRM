import { Router } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// These integrations are not built yet (roadmap 3.1 DocuSign, 3.2 Google Calendar, 3.3b MLS data).
// They used to return simulated success and made-up listing data; now they say plainly that they are unavailable.
const notYet = (name: string) => (req: AuthRequest, res: any) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    res.status(501).json({ error: `${name} integration is not available yet.`, code: 'NOT_AVAILABLE' });
};

// POST /api/integrations/google/connect
router.post('/google/connect', notYet('Google Calendar'));

// POST /api/integrations/docusign/send
router.post('/docusign/send', notYet('DocuSign'));

// GET /api/integrations/zillow/fetch
router.get('/zillow/fetch', notYet('Zillow / MLS'));

export default router;
