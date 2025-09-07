import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${name}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'));
}

export const multiUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'localImage', maxCount: 20 },
  { name: 'images', maxCount: 20 }
]);

// Backward compatible default export
export default multer({ storage });

import { addWatermark } from '../utils/watermark.js';

// Middleware that watermarks every uploaded image file
export async function watermarkUploadedImages(req, res, next) {
  try {
    const fs = (await import('fs')).promises;
    const path = await import('path');
    const groups = ['image', 'images', 'localImage'];
    for (const g of groups) {
      if (Array.isArray(req.files?.[g])) {
        for (const f of req.files[g]) {
          // Ако вече има воден знак, пропусни
          if (f.filename && f.filename.includes('-wm_')) continue;
          // Добави воден знак върху оригиналния файл (overwrite)
          await addWatermark(f.path, undefined, true); // overwrite = true
        }
      }
    }

    // Ако няма качени нови файлове, но има image/imagePath в body, добави воден знак ако липсва
    const imageFields = ['image', 'imagePath'];
    for (const field of imageFields) {
      const img = req.body?.[field];
      if (img && typeof img === 'string' && img.startsWith('/uploads/') && !img.includes('-wm_')) {
        const absPath = path.join(uploadDir, path.basename(img));
        try {
          await addWatermark(absPath, undefined, true); // overwrite = true
        } catch {}
      }
    }
    next();
  } catch (e) {
    console.error('watermarkUploadedImages error:', e);
    next(e);
  }
}
