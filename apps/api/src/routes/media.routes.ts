import { Router } from 'express';
import multer from 'multer';
import { StorePermission } from '@cc/types';
import { paginationQuerySchema } from '@cc/shared';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from '../config/constants';
import { mediaController } from '../controllers/media.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateQuery } from '../middlewares/validate';
import { ApiError } from '../utils/errors';
import { asyncHandler } from '../utils/async-handler';

// Files are buffered in memory and handed to the storage driver — nothing binary
// ever reaches PostgreSQL.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    callback(null, true);
  },
});

export const mediaRoutes = Router({ mergeParams: true });

mediaRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  validateQuery(paginationQuerySchema),
  asyncHandler(mediaController.list),
);

mediaRoutes.post(
  '/',
  ...requireStoreAccess(StorePermission.STORE_EDIT),
  upload.single('file'),
  asyncHandler(mediaController.upload),
);

mediaRoutes.delete(
  '/:mediaId',
  ...requireStoreAccess(StorePermission.STORE_EDIT),
  asyncHandler(mediaController.remove),
);
