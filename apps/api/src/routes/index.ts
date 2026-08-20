import { Router } from 'express';
import { API_VERSION } from '@cc/shared';
import { authRoutes } from './auth.routes';
import { storeRoutes } from './store.routes';
import { storefrontRoutes } from './storefront.routes';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';
import { asyncHandler } from '../utils/async-handler';
import { success } from '../utils/response';

export const apiRoutes = Router();

apiRoutes.get('/', (_req, res) => {
  success(res, {
    name: 'Creator Commerce API',
    version: API_VERSION,
    docs: '/api/v1/routes',
  });
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.get('/me', requireAuth, asyncHandler(authController.me));
apiRoutes.use('/stores', storeRoutes);
apiRoutes.use('/storefront', storefrontRoutes);
