import { Router } from 'express';
import { StorePermission } from '@cc/types';
import { inviteMemberSchema, updateMemberSchema } from '@cc/shared';
import { teamController } from '../controllers/team.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

export const teamRoutes = Router({ mergeParams: true });

// Viewing the roster is part of seeing the store; changing it is owner-level.
teamRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  asyncHandler(teamController.list),
);

teamRoutes.post(
  '/',
  ...requireStoreAccess(StorePermission.TEAM_MANAGE),
  validateBody(inviteMemberSchema),
  asyncHandler(teamController.invite),
);

teamRoutes.patch(
  '/:memberId',
  ...requireStoreAccess(StorePermission.TEAM_MANAGE),
  validateBody(updateMemberSchema),
  asyncHandler(teamController.update),
);

teamRoutes.delete(
  '/:memberId',
  ...requireStoreAccess(StorePermission.TEAM_MANAGE),
  asyncHandler(teamController.remove),
);
