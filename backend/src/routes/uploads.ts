import express from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import {
    storeUploadedFile,
    loadUploadedFile,
    verifySignedPrivateFileToken,
} from '../lib/storage';

const router = express.Router();

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB max

const ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
]);

const ALLOWED_PRIVATE_MIMES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
});

function getRequestBaseUrl(req: express.Request): string {
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto = typeof protoHeader === 'string' ? protoHeader.split(',')[0].trim() : req.protocol;
    const host = req.get('host') || 'localhost:4000';
    return `${proto}://${host}`;
}

// GET /api/uploads/public/:id — serves public listing photos
router.get('/public/:id', async (req, res) => {
    const file = await loadUploadedFile(String(req.params.id));
    if (!file || file.visibility !== 'PUBLIC') {
        return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    return res.send(file.buffer);
});

// GET /api/uploads/private/:id — serves private contract documents via short-lived HMAC signature
router.get('/private/:id', async (req, res) => {
    const fileId = String(req.params.id);
    const exp = typeof req.query.exp === 'string' ? req.query.exp : undefined;
    const sig = typeof req.query.sig === 'string' ? req.query.sig : undefined;

    const file = await loadUploadedFile(fileId);
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (!verifySignedPrivateFileToken(file.id, file.orgId, exp, sig)) {
        return res.status(403).json({ error: 'Invalid or expired document link' });
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Allow embedding inside the CRM's document preview iframe
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' data: blob:; frame-ancestors *");
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(file.filename)}"`);
    return res.send(file.buffer);
});

// POST /api/uploads — authenticated multipart file upload
router.post(
    '/',
    authenticateToken,
    (req, res, next) => {
        upload.single('file')(req, res, (err: any) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: 'File is too large (maximum 20 MB)' });
                }
                return res.status(400).json({ error: err.message || 'Invalid file upload' });
            }
            next();
        });
    },
    async (req: AuthRequest, res) => {
        const user = req.user!;
        const file = req.file;
        if (!file || !file.buffer || file.buffer.byteLength === 0) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const rawVisibility = typeof req.body?.visibility === 'string' ? req.body.visibility.toUpperCase() : 'PUBLIC';
        const visibility: 'PUBLIC' | 'PRIVATE' = rawVisibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
        const mimeType = (file.mimetype || 'application/octet-stream').toLowerCase();

        if (visibility === 'PUBLIC') {
            if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
                return res.status(400).json({ error: 'Public listing uploads must be JPG, PNG, WebP, or GIF images' });
            }
            if (file.buffer.byteLength > 15 * 1024 * 1024) {
                return res.status(413).json({ error: 'Image is too large (maximum 15 MB)' });
            }
        } else {
            if (!ALLOWED_PRIVATE_MIMES.has(mimeType)) {
                return res.status(400).json({ error: 'Unsupported document format. Allowed: PDF, JPG, PNG, WebP, DOC, DOCX' });
            }
        }

        const stored = await storeUploadedFile({
            orgId: user.orgId,
            visibility,
            filename: file.originalname || 'upload',
            mimeType,
            buffer: file.buffer,
        });

        const baseUrl = getRequestBaseUrl(req);
        const url =
            visibility === 'PUBLIC'
                ? `${baseUrl}/api/uploads/public/${stored.id}`
                : `${baseUrl}/api/uploads/private/${stored.id}`;

        return res.status(201).json({
            id: stored.id,
            storageKey: stored.id,
            url,
            filename: stored.filename,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            visibility: stored.visibility,
        });
    },
);

export default router;
