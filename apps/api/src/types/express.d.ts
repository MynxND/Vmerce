import type { StorePermission, UserRole } from '@cc/types';

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
}

export interface StoreContext {
  storeId: string;
  handle: string;
  /** Role held *within this store* (or SUPER_ADMIN for platform staff). */
  role: UserRole;
  permissions: StorePermission[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      store?: StoreContext;
      /** Anonymous cart token resolved from cookie or `X-Cart-Token`. */
      cartToken?: string;
    }
  }
}

export {};
