/**
 * Seed script — creates a realistic demo tenant so every screen has data.
 *
 * Idempotent: re-running wipes and recreates the demo store only. Run with
 * `pnpm db:seed` (or `pnpm --filter @cc/api db:seed`).
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { loadEnvFiles } from '../src/config/load-env';
import {
  DEFAULT_HOME_SECTIONS,
  ROLE_PERMISSIONS,
  buildSku,
  cartesian,
  skuDeduper,
  defaultSettingsFor,
  getThemePreset,
  slugify,
} from '@cc/shared';
import { CreatorType, ThemePreset, UserRole } from '@cc/types';
import argon2 from 'argon2';

// The seed runs standalone, so it loads the shared .env itself.
loadEnvFiles();

const prisma = new PrismaClient();

const DEMO_EMAIL = 'nagi@neko.studio';
const DEMO_PASSWORD = 'Password123';
const DEMO_HANDLE = 'neko';

interface OptionSpec {
  name: string;
  values: Array<{ value: string; group?: string }>;
}

interface ProductSpec {
  title: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  status: 'ACTIVE' | 'DRAFT';
  fulfillmentType: 'MANUAL' | 'PRINT_ON_DEMAND' | 'STOCK' | 'DIGITAL';
  inventoryMode: 'NOT_TRACKED' | 'TRACKED';
  images: string[];
  options: OptionSpec[];
  collections: string[];
  /** Per-variant price adjustments keyed by an option value. */
  priceAdjustments?: Record<string, number>;
}

/**
 * Placeholder imagery. Deterministic seeds keep the demo store looking the same
 * on every reseed. Replace with real uploads via the media library.
 */
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

function image(seed: string, size = 900): string {
  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
}

const COLLECTIONS = [
  { name: 'New Drop', description: 'Fresh out of the studio.' },
  { name: 'Phone Cases', description: 'Protect your device in style.' },
  { name: 'Stickers', description: 'Vinyl, waterproof, slap-anywhere ready.' },
  { name: 'VTuber Goods', description: 'Acrylics, photocards and stage merch.' },
];

const PRODUCTS: ProductSpec[] = [
  {
    title: 'Cyber Neko MagSafe Case',
    description:
      'A hard-shell case with a soft-touch matte finish and raised camera lip. Artwork is UV printed so it will not peel, and the MagSafe variants carry a full magnet array for wireless charging and accessories.',
    category: 'Phone Cases',
    price: 89000,
    compareAtPrice: 109000,
    cost: 32000,
    status: 'ACTIVE',
    fulfillmentType: 'PRINT_ON_DEMAND',
    inventoryMode: 'NOT_TRACKED',
    images: ['/products/cyber-neko-magsafe-case.png'],
    options: [
      {
        name: 'Phone Model',
        values: [
          { value: 'iPhone 17', group: 'Apple' },
          { value: 'iPhone 17 Pro', group: 'Apple' },
          { value: 'iPhone 17 Pro Max', group: 'Apple' },
          { value: 'Galaxy S26', group: 'Samsung' },
          { value: 'Galaxy S26 Ultra', group: 'Samsung' },
        ],
      },
      {
        name: 'Case Color',
        values: [{ value: 'Black' }, { value: 'White' }, { value: 'Clear' }, { value: 'Pink' }],
      },
      { name: 'Case Type', values: [{ value: 'Standard' }, { value: 'MagSafe' }] },
    ],
    collections: ['New Drop', 'Phone Cases'],
    priceAdjustments: { MagSafe: 15000, 'iPhone 17 Pro Max': 10000, 'Galaxy S26 Ultra': 10000 },
  },
  {
    title: 'Midnight Acrylic Stand',
    description:
      '150mm double-layer acrylic stand with a frosted base. Printed both sides so the character reads from any angle on your desk or stream setup.',
    category: 'Acrylic Stands',
    price: 65000,
    cost: 24000,
    status: 'ACTIVE',
    fulfillmentType: 'STOCK',
    inventoryMode: 'TRACKED',
    images: ['/products/midnight-acrylic-stand.png'],
    options: [
      { name: 'Size', values: [{ value: '100mm' }, { value: '150mm' }, { value: '200mm' }] },
      { name: 'Pose', values: [{ value: 'Wave' }, { value: 'Idle' }] },
    ],
    collections: ['VTuber Goods', 'New Drop'],
    priceAdjustments: { '200mm': 20000, '100mm': -15000 },
  },
  {
    title: 'Neko Logo Sticker Pack',
    description:
      'Ten die-cut vinyl stickers with a matte laminate. Dishwasher-safe and rated for outdoor use, so laptops, water bottles and stream decks are all fair game.',
    category: 'Stickers',
    price: 25000,
    status: 'ACTIVE',
    fulfillmentType: 'STOCK',
    inventoryMode: 'TRACKED',
    images: ['/products/neko-logo-sticker-pack.png'],
    options: [{ name: 'Pack', values: [{ value: 'Pack of 5' }, { value: 'Pack of 10' }] }],
    collections: ['Stickers', 'New Drop'],
    priceAdjustments: { 'Pack of 5': -10000 },
  },
  {
    title: 'Tokyo Night Art Print',
    description:
      'Giclée print on 250gsm archival matte stock, signed on the reverse. Shipped rolled in a rigid tube with a certificate card.',
    category: 'Art Prints',
    price: 120000,
    compareAtPrice: 150000,
    status: 'ACTIVE',
    fulfillmentType: 'MANUAL',
    inventoryMode: 'TRACKED',
    images: ['/products/tokyo-night-art-print.png'],
    options: [
      { name: 'Size', values: [{ value: 'A4' }, { value: 'A3' }, { value: 'A2' }] },
      { name: 'Finish', values: [{ value: 'Matte' }, { value: 'Lustre' }] },
    ],
    collections: ['New Drop'],
    priceAdjustments: { A3: 40000, A2: 90000, Lustre: 10000 },
  },
  {
    title: 'Neko Studio Wallpaper Bundle',
    description: 'Twelve 4K wallpapers plus mobile crops. Instant download after purchase.',
    category: 'Digital',
    price: 15000,
    status: 'DRAFT',
    fulfillmentType: 'DIGITAL',
    inventoryMode: 'NOT_TRACKED',
    images: [image('wallpaper-bundle')],
    options: [],
    collections: [],
  },
];

async function seedRoles(): Promise<void> {
  for (const [key, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { key: key as UserRole },
      create: { key: key as UserRole, label: key.replace(/_/g, ' ').toLowerCase() },
      update: {},
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: role.id, permission })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`  roles seeded (${Object.keys(ROLE_PERMISSIONS).length})`);
}

async function seedStore(userId: string) {
  // Start from a clean slate so reseeding does not stack duplicate demo data.
  await prisma.store.deleteMany({ where: { handle: DEMO_HANDLE } });

  const preset = getThemePreset(ThemePreset.CYBER);

  const store = await prisma.store.create({
    data: {
      name: 'Neko Studio',
      handle: DEMO_HANDLE,
      description:
        'Official merch from Nagi — VTuber, illustrator and full-time cat enthusiast. Limited drops every season.',
      creatorType: CreatorType.VTUBER,
      status: 'ACTIVE',
      currency: 'THB',
      country: 'TH',
      logoUrl: image('neko-logo', 256),
      avatarUrl: image('neko-avatar', 256),
      bannerUrl: image('neko-banner', 1600),
      socialLinks: {
        twitch: 'https://twitch.tv/nekostudio',
        youtube: 'https://youtube.com/@nekostudio',
        x: 'https://x.com/nekostudio',
        discord: 'https://discord.gg/nekostudio',
      },
      members: { create: { userId, role: UserRole.STORE_OWNER, acceptedAt: new Date() } },
      theme: {
        create: {
          preset: preset.preset,
          colors: preset.colors as unknown as Prisma.InputJsonValue,
          typography: preset.typography as unknown as Prisma.InputJsonValue,
          layout: preset.layout as unknown as Prisma.InputJsonValue,
          effects: preset.effects as unknown as Prisma.InputJsonValue,
          buttonStyle: preset.buttonStyle,
          colorMode: preset.colorMode,
        },
      },
      pages: {
        create: {
          slug: 'home',
          title: 'Home',
          isHome: true,
          sections: {
            create: DEFAULT_HOME_SECTIONS.map((type, index) => {
              const settings = defaultSettingsFor(type) as Record<string, unknown>;
              if (type === 'HERO') {
                settings.title = 'NEKO AFTER DARK';
                settings.subtitle = 'Neon future. Neko attitude. Gear up for the night.';
                settings.buttonText = 'Shop the drop';
                settings.alignment = 'left';
                settings.imageUrl = '/editor/cyber-neko-hero.png';
              }
              if (type === 'FEATURED_PRODUCTS') {
                settings.title = 'New Drop';
                settings.collectionSlug = 'new-drop';
              }
              if (type === 'TEXT_BLOCK') {
                settings.title = 'Made in small batches';
                settings.body =
                  'Everything here is designed by me and printed in small runs. Orders ship from Bangkok within 3-5 business days.';
              }
              if (type === 'SOCIAL_LINKS') {
                settings.title = 'Come hang out';
              }
              return { type, position: index, settings: settings as Prisma.InputJsonValue };
            }),
          },
        },
      },
      paymentChannels: {
        create: [
          {
            type: 'PROMPTPAY_PHONE',
            label: 'PromptPay (mobile)',
            accountName: 'Nagi Neko',
            proxyValue: '0812345678',
            instructions:
              'Scan with any Thai banking app. The amount is already filled in — please transfer the exact total.',
            enabled: true,
            isDefault: true,
            position: 0,
          },
          {
            type: 'PROMPTPAY_EWALLET',
            label: 'TrueMoney Wallet',
            accountName: 'Nagi Neko',
            proxyValue: '004999012345678',
            instructions: 'Open TrueMoney Wallet, choose Scan, then upload your slip below.',
            enabled: true,
            isDefault: false,
            position: 1,
          },
          {
            type: 'BANK_TRANSFER',
            label: 'Bank transfer (KBank)',
            accountName: 'Nagi Neko',
            bankCode: '004',
            bankAccountNumber: '1234567890',
            instructions: 'Transfer to the account above, then upload your slip below.',
            enabled: true,
            isDefault: false,
            position: 2,
          },
        ],
      },
      providers: {
        create: [
          { kind: 'MANUAL', name: 'Manual fulfillment', enabled: true },
          { kind: 'CJ_DROPSHIPPING', name: 'CJdropshipping', enabled: false },
        ],
      },
      discounts: {
        create: [
          { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, usageLimit: 500, active: true },
          {
            code: 'FREESHIP',
            type: 'FREE_SHIPPING',
            value: 0,
            minimumSpend: 100000,
            active: true,
          },
          // One of each remaining status so the discounts screen shows them all.
          {
            code: 'SEASON3',
            type: 'FIXED_AMOUNT',
            value: 15000,
            minimumSpend: 80000,
            startsAt: daysFromNow(7),
            endsAt: daysFromNow(37),
            active: true,
          },
          {
            code: 'LAUNCH20',
            type: 'PERCENTAGE',
            value: 20,
            startsAt: daysFromNow(-60),
            endsAt: daysFromNow(-30),
            active: true,
          },
          { code: 'OLDCODE', type: 'PERCENTAGE', value: 5, active: false },
        ],
      },
    },
  });

  console.log(`  store ${store.name} (@${store.handle})`);
  return store;
}

async function seedCollections(storeId: string): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [index, spec] of COLLECTIONS.entries()) {
    const collection = await prisma.collection.create({
      data: {
        storeId,
        name: spec.name,
        slug: slugify(spec.name),
        description: spec.description,
        imageUrl: image(`collection-${slugify(spec.name)}`, 800),
        status: 'ACTIVE',
        position: index,
      },
    });
    ids.set(spec.name, collection.id);
  }
  console.log(`  collections seeded (${ids.size})`);
  return ids;
}

async function seedProducts(
  storeId: string,
  collectionIds: Map<string, string>,
): Promise<string[]> {
  const variantIds: string[] = [];
  // SKUs are unique per store, and abbreviation is lossy, so the seed has to
  // dedupe exactly the way the product service does.
  const dedupeSku = skuDeduper();

  for (const spec of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        storeId,
        title: spec.title,
        slug: slugify(spec.title),
        description: spec.description,
        status: spec.status,
        category: spec.category,
        price: spec.price,
        compareAtPrice: spec.compareAtPrice ?? null,
        cost: spec.cost ?? null,
        inventoryMode: spec.inventoryMode,
        fulfillmentType: spec.fulfillmentType,
        seoTitle: `${spec.title} — Neko Studio`,
        seoDescription: spec.description.slice(0, 155),
        publishedAt: spec.status === 'ACTIVE' ? new Date() : null,
        media: {
          create: spec.images.map((url, index) => ({ url, position: index, alt: spec.title })),
        },
        options: {
          create: spec.options.map((option, optionIndex) => ({
            name: option.name,
            position: optionIndex,
            values: {
              create: option.values.map((value, valueIndex) => ({
                value: value.value,
                group: value.group ?? null,
                position: valueIndex,
              })),
            },
          })),
        },
        collections: {
          create: spec.collections
            .map((name) => collectionIds.get(name))
            .filter((id): id is string => Boolean(id))
            .map((collectionId, index) => ({ collectionId, position: index })),
        },
      },
      include: { options: { include: { values: true }, orderBy: { position: 'asc' } } },
    });

    // Expand the option matrix exactly the way the product service does.
    const valueLists = product.options.map((option) =>
      [...option.values].sort((a, b) => a.position - b.position),
    );
    const combinations = valueLists.length > 0 ? cartesian(valueLists) : [[]];

    for (const [position, combination] of combinations.entries()) {
      const labels = combination.map((value) => value.value);
      const adjustment = labels.reduce(
        (sum, label) => sum + (spec.priceAdjustments?.[label] ?? 0),
        0,
      );
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          storeId,
          title: labels.length > 0 ? labels.join(' / ') : 'Default',
          sku: dedupeSku(buildSku(spec.title, labels.length > 0 ? labels : ['STD'])),
          price: spec.price + adjustment,
          compareAtPrice: spec.compareAtPrice ? spec.compareAtPrice + adjustment : null,
          cost: spec.cost ?? null,
          stock: spec.inventoryMode === 'TRACKED' ? 12 + ((position * 7) % 40) : 0,
          enabled: true,
          imageUrl: spec.images[0] ?? null,
          position,
          optionValues: { create: combination.map((value) => ({ optionValueId: value.id })) },
        },
      });
      variantIds.push(variant.id);
    }

    console.log(`  product ${spec.title} (${combinations.length} variants)`);
  }

  return variantIds;
}

const CUSTOMERS = [
  { email: 'mika@example.com', name: 'Mika Tanaka', phone: '0812345678', province: 'Bangkok' },
  {
    email: 'aran@example.com',
    name: 'Aran Chaiyaporn',
    phone: '0898765432',
    province: 'Chiang Mai',
  },
  { email: 'sora@example.com', name: 'Sora Yamada', phone: '0855512345', province: 'Phuket' },
  { email: 'ken@example.com', name: 'Ken Wattana', phone: '0866678901', province: 'Nonthaburi' },
];

const ORDER_PLAN: Array<{
  customerIndex: number;
  daysAgo: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  fulfillmentStatus: 'UNFULFILLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  variantCount: number;
}> = [
  {
    customerIndex: 0,
    daysAgo: 1,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    fulfillmentStatus: 'UNFULFILLED',
    variantCount: 2,
  },
  {
    customerIndex: 1,
    daysAgo: 2,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'UNFULFILLED',
    variantCount: 1,
  },
  {
    customerIndex: 2,
    daysAgo: 4,
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'PROCESSING',
    variantCount: 3,
  },
  {
    customerIndex: 3,
    daysAgo: 6,
    status: 'SHIPPED',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'SHIPPED',
    variantCount: 1,
  },
  {
    customerIndex: 0,
    daysAgo: 9,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'DELIVERED',
    variantCount: 2,
  },
  {
    customerIndex: 1,
    daysAgo: 13,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'DELIVERED',
    variantCount: 1,
  },
  {
    customerIndex: 2,
    daysAgo: 18,
    status: 'CANCELLED',
    paymentStatus: 'FAILED',
    fulfillmentStatus: 'UNFULFILLED',
    variantCount: 1,
  },
  {
    customerIndex: 3,
    daysAgo: 22,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'DELIVERED',
    variantCount: 2,
  },
  {
    customerIndex: 0,
    daysAgo: 26,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'DELIVERED',
    variantCount: 3,
  },
];

async function seedOrders(
  storeId: string,
  storeHandle: string,
  variantIds: string[],
): Promise<void> {
  const customers = [];
  for (const spec of CUSTOMERS) {
    customers.push(
      await prisma.customer.create({
        data: {
          storeId,
          email: spec.email,
          name: spec.name,
          phone: spec.phone,
          addresses: {
            create: {
              kind: 'SHIPPING',
              isDefault: true,
              firstName: spec.name.split(' ')[0] ?? spec.name,
              lastName: spec.name.split(' ').slice(1).join(' ') || '-',
              phone: spec.phone,
              line1: '128/4 Sukhumvit Soi 22',
              district: 'Khlong Toei',
              province: spec.province,
              postalCode: '10110',
              country: 'TH',
            },
          },
        },
      }),
    );
  }

  const prefix = storeHandle.toUpperCase().slice(0, 5);
  let sequence = 0;

  for (const plan of ORDER_PLAN) {
    const customer = customers[plan.customerIndex]!;
    const placedAt = new Date(Date.now() - plan.daysAgo * 86_400_000);

    // Deterministic variant picks keep seeded revenue stable across reseeds.
    const picked = Array.from({ length: plan.variantCount }, (_, index) => {
      const id = variantIds[(sequence * 5 + index * 11) % variantIds.length]!;
      return { id, quantity: ((index + sequence) % 2) + 1 };
    });

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: picked.map((entry) => entry.id) } },
      include: { product: { select: { id: true, title: true, slug: true } } },
    });

    const items = picked.flatMap((entry) => {
      const variant = variants.find((row) => row.id === entry.id);
      if (!variant) return [];
      return [
        {
          productId: variant.product.id,
          variantId: variant.id,
          productTitle: variant.product.title,
          variantTitle: variant.title,
          sku: variant.sku,
          imageUrl: variant.imageUrl,
          unitPrice: variant.price,
          quantity: entry.quantity,
          lineTotal: variant.price * entry.quantity,
          snapshot: { productSlug: variant.product.slug } as Prisma.InputJsonValue,
        },
      ];
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingTotal = subtotal >= 150000 ? 0 : 5000;
    const discountTotal = plan.daysAgo % 3 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discountTotal + shippingTotal;

    sequence += 1;

    await prisma.order.create({
      data: {
        storeId,
        customerId: customer.id,
        orderNumber: `${prefix}-${1000 + sequence}`,
        status: plan.status,
        paymentStatus: plan.paymentStatus,
        fulfillmentStatus: plan.fulfillmentStatus,
        currency: 'THB',
        subtotal,
        discountTotal,
        shippingTotal,
        total,
        discountCode: discountTotal > 0 ? 'WELCOME10' : null,
        email: customer.email,
        phone: customer.phone,
        customerName: customer.name ?? customer.email,
        paymentProvider: 'manual',
        paymentReference: `MANUAL-${prefix}-${1000 + sequence}`,
        shippingMethod: shippingTotal === 0 ? 'Local pickup' : 'Standard shipping',
        trackingNumber:
          plan.fulfillmentStatus === 'SHIPPED' || plan.fulfillmentStatus === 'DELIVERED'
            ? `TH${900000000 + sequence}`
            : null,
        placedAt,
        createdAt: placedAt,
        items: { create: items },
        addresses: {
          create: {
            kind: 'SHIPPING',
            firstName: (customer.name ?? 'Customer').split(' ')[0]!,
            lastName: (customer.name ?? '-').split(' ').slice(1).join(' ') || '-',
            phone: customer.phone,
            line1: '128/4 Sukhumvit Soi 22',
            district: 'Khlong Toei',
            province: 'Bangkok',
            postalCode: '10110',
            country: 'TH',
          },
        },
      },
    });

    if (plan.paymentStatus === 'PAID') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: placedAt,
        },
      });
    }
  }

  await prisma.store.update({ where: { id: storeId }, data: { orderSequence: sequence } });
  console.log(`  orders seeded (${ORDER_PLAN.length}) for ${customers.length} customers`);
}

async function main(): Promise<void> {
  console.log('Seeding Creator Commerce...');

  await seedRoles();

  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: 'Nagi',
      passwordHash,
      role: UserRole.STORE_OWNER,
      emailVerified: true,
      onboardedAt: new Date(),
      avatarUrl: image('nagi-avatar', 256),
    },
    update: { passwordHash, onboardedAt: new Date() },
  });

  const teammate = await prisma.user.upsert({
    where: { email: 'mika@neko.studio' },
    create: {
      email: 'mika@neko.studio',
      name: 'Mika',
      passwordHash,
      role: UserRole.STAFF,
      emailVerified: true,
      onboardedAt: new Date(),
      avatarUrl: image('mika-avatar', 256),
    },
    update: { passwordHash },
  });

  await prisma.user.upsert({
    where: { email: 'admin@platform.local' },
    create: {
      email: 'admin@platform.local',
      name: 'Platform Admin',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      onboardedAt: new Date(),
    },
    update: { passwordHash },
  });

  const store = await seedStore(user.id);

  await prisma.storeMember.create({
    data: {
      storeId: store.id,
      userId: teammate.id,
      role: UserRole.STAFF,
      // Staff get neither of these from the role matrix, so the demo shows the
      // additive grant mechanism doing real work.
      extraPermissions: ['THEME_EDIT', 'ANALYTICS_VIEW'],
      invitedEmail: teammate.email,
      acceptedAt: new Date(),
    },
  });

  const collectionIds = await seedCollections(store.id);
  const variantIds = await seedProducts(store.id, collectionIds);
  await seedOrders(store.id, store.handle, variantIds);

  console.log('\nPayment channels: PromptPay mobile (default), TrueMoney Wallet, KBank transfer');
  console.log('  Demo identifiers are placeholders — replace them before taking real orders.');
  console.log('\nDone. Sign in with:');
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  store:    http://localhost:3000/@${DEMO_HANDLE}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
