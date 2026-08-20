import {
  BarChart3,
  Boxes,
  CircleHelp,
  Image,
  LayoutDashboard,
  Package,
  Palette,
  Plug,
  QrCode,
  Settings,
  ShoppingBag,
  Store,
  Ticket,
  Users,
  Users2,
  type LucideIcon,
} from 'lucide-react';
import { StorePermission } from '@cc/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: StorePermission;
  /** Phase 2/3 surfaces are shown but flagged so the roadmap stays visible. */
  soon?: boolean;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: 'Overview', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalogue',
    items: [
      {
        label: 'Products',
        href: '/dashboard/products',
        icon: Package,
        permission: StorePermission.PRODUCT_VIEW,
      },
      {
        label: 'Collections',
        href: '/dashboard/collections',
        icon: Boxes,
        permission: StorePermission.PRODUCT_VIEW,
      },
      {
        label: 'Media',
        href: '/dashboard/media',
        icon: Image,
        permission: StorePermission.STORE_VIEW,
      },
    ],
  },
  {
    label: 'Selling',
    items: [
      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: ShoppingBag,
        permission: StorePermission.ORDER_VIEW,
      },
      {
        label: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        permission: StorePermission.CUSTOMER_VIEW,
      },
      {
        label: 'Payments',
        href: '/dashboard/payments',
        icon: QrCode,
        permission: StorePermission.SETTINGS_EDIT,
      },
      {
        label: 'Discounts',
        href: '/dashboard/discounts',
        icon: Ticket,
        permission: StorePermission.STORE_VIEW,
      },
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        permission: StorePermission.ANALYTICS_VIEW,
      },
    ],
  },
  {
    label: 'Storefront',
    items: [
      {
        label: 'Store',
        href: '/dashboard/store',
        icon: Store,
        permission: StorePermission.STORE_VIEW,
      },
      {
        label: 'Store editor',
        href: '/dashboard/store/editor',
        icon: Palette,
        permission: StorePermission.THEME_EDIT,
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        label: 'Team',
        href: '/dashboard/team',
        icon: Users2,
        permission: StorePermission.STORE_VIEW,
      },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug, soon: true },
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        permission: StorePermission.SETTINGS_EDIT,
      },
    ],
  },
];

export const FOOTER_ITEMS: NavItem[] = [
  { label: 'Help & docs', href: '/dashboard/help', icon: CircleHelp },
];
