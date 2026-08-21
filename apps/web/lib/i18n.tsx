'use client';

import * as React from 'react';

export type Locale = 'en' | 'th' | 'ja';

const COPY = {
  en: {
    language: 'Language', overview: 'Overview', catalogue: 'Catalogue', products: 'Products', collections: 'Collections', media: 'Media', selling: 'Selling', orders: 'Orders', customers: 'Customers', payments: 'Payments', discounts: 'Discounts', analytics: 'Analytics', storefront: 'Storefront', store: 'Store', storeEditor: 'Store editor', workspace: 'Workspace', team: 'Team', integrations: 'Integrations', settings: 'Settings', helpDocs: 'Help & docs', viewStore: 'View store', editWebsite: 'Edit website', previewStore: 'Preview store', soon: 'Soon',
    home: 'Home', saved: 'All changes saved', unsaved: 'Unsaved changes', preview: 'Preview', publish: 'Publish', structure: 'Structure', add: 'Add', theme: 'Theme', addSection: 'Add a section', searchSections: 'Search sections', all: 'All', hero: 'Hero', pageOutline: 'Page outline', dragReorder: 'Drag sections to reorder', selectedSection: 'Selected section', desktop: 'Desktop', mobile: 'Mobile', back: 'Back', content: 'Content', style: 'Style', image: 'Image', heading: 'Heading', subheading: 'Subheading', buttonLabel: 'Button label', buttonLink: 'Button link', textAlignment: 'Text alignment', backgroundImage: 'Background image', color: 'Color', font: 'Font', size: 'Size', weight: 'Weight', align: 'Align', saveLayout: 'Save layout', discard: 'Discard', announcement: 'Announcement bar', header: 'Header', featuredProducts: 'Product carousel', collectionList: 'Collection spotlight', textBlock: 'Creator story', socialLinks: 'Social links', newsletter: 'Newsletter', marquee: 'Scrolling marquee', footer: 'Footer', imageBanner: 'Image banner', imageWithText: 'Image with text', gallery: 'Gallery', video: 'Video', productGrid: 'Product grid', overviewDescription: 'How your shop is doing, at a glance.', newProduct: 'New product', days: 'days', revenue: 'Revenue', visitors: 'Visitors', conversionRate: 'Conversion rate', noPriorData: 'no prior data', vsPrevious: 'vs previous period', sales: 'Sales', salesDescription: 'Revenue and order volume over the selected range.', topProducts: 'Top products', topProductsDescription: 'Best sellers in this period.', sold: 'sold', noSales: 'No sales yet in this period.', recentOrders: 'Recent orders', recentOrdersDescription: 'The latest orders across your shop.', viewAll: 'View all', order: 'Order', customer: 'Customer', items: 'Items', amount: 'Amount', payment: 'Payment', fulfillment: 'Fulfillment', status: 'Status', date: 'Date', noOrders: 'No orders yet', noOrdersDescription: 'Once someone checks out, their order will show up here.', addProducts: 'Add products', manageProducts: 'Manage products', previewProducts: 'Preview product pages', manageCollections: 'Manage collections', previewCollection: 'Preview collection',
  },
  th: {
    language: 'ภาษา', overview: 'ภาพรวม', catalogue: 'แคตตาล็อก', products: 'สินค้า', collections: 'คอลเลกชัน', media: 'คลังสื่อ', selling: 'การขาย', orders: 'คำสั่งซื้อ', customers: 'ลูกค้า', payments: 'การชำระเงิน', discounts: 'ส่วนลด', analytics: 'การวิเคราะห์', storefront: 'หน้าร้าน', store: 'ร้านค้า', storeEditor: 'ตัวแก้ไขร้าน', workspace: 'พื้นที่ทำงาน', team: 'ทีม', integrations: 'การเชื่อมต่อ', settings: 'ตั้งค่า', helpDocs: 'ช่วยเหลือและคู่มือ', viewStore: 'ดูหน้าร้าน', editWebsite: 'แก้ไขเว็บไซต์', previewStore: 'ดูตัวอย่างร้าน', soon: 'เร็ว ๆ นี้',
    home: 'หน้าหลัก', saved: 'บันทึกการเปลี่ยนแปลงแล้ว', unsaved: 'ยังไม่ได้บันทึก', preview: 'ดูตัวอย่าง', publish: 'เผยแพร่', structure: 'โครงสร้าง', add: 'เพิ่ม', theme: 'ธีม', addSection: 'เพิ่มเซกชัน', searchSections: 'ค้นหาเซกชัน', all: 'ทั้งหมด', hero: 'ฮีโร่', pageOutline: 'โครงหน้าร้าน', dragReorder: 'ลากเพื่อจัดลำดับ', selectedSection: 'เซกชันที่เลือก', desktop: 'เดสก์ท็อป', mobile: 'มือถือ', back: 'กลับ', content: 'เนื้อหา', style: 'สไตล์', image: 'รูปภาพ', heading: 'หัวเรื่อง', subheading: 'หัวเรื่องรอง', buttonLabel: 'ข้อความบนปุ่ม', buttonLink: 'ลิงก์ของปุ่ม', textAlignment: 'การจัดแนวข้อความ', backgroundImage: 'รูปพื้นหลัง', color: 'สี', font: 'ฟอนต์', size: 'ขนาด', weight: 'น้ำหนัก', align: 'จัดแนว', saveLayout: 'บันทึกเลย์เอาต์', discard: 'ยกเลิกการแก้ไข', announcement: 'แถบประกาศ', header: 'ส่วนหัว', featuredProducts: 'สไลด์สินค้า', collectionList: 'คอลเลกชันเด่น', textBlock: 'เรื่องราวครีเอเตอร์', socialLinks: 'โซเชียล', newsletter: 'จดหมายข่าว', marquee: 'แถบข้อความเลื่อน', footer: 'ส่วนท้าย', imageBanner: 'แบนเนอร์รูปภาพ', imageWithText: 'รูปภาพพร้อมข้อความ', gallery: 'แกลเลอรี', video: 'วิดีโอ', productGrid: 'ตารางสินค้า', overviewDescription: 'ดูภาพรวมผลการดำเนินงานของร้านคุณ', newProduct: 'เพิ่มสินค้าใหม่', days: 'วัน', revenue: 'รายได้', visitors: 'ผู้เข้าชม', conversionRate: 'อัตราการสั่งซื้อ', noPriorData: 'ยังไม่มีข้อมูลเปรียบเทียบ', vsPrevious: 'เทียบกับช่วงก่อนหน้า', sales: 'ยอดขาย', salesDescription: 'รายได้และจำนวนคำสั่งซื้อในช่วงที่เลือก', topProducts: 'สินค้าขายดี', topProductsDescription: 'สินค้าที่ทำยอดขายสูงสุดในช่วงนี้', sold: 'ชิ้น', noSales: 'ยังไม่มียอดขายในช่วงนี้', recentOrders: 'คำสั่งซื้อล่าสุด', recentOrdersDescription: 'คำสั่งซื้อล่าสุดจากร้านของคุณ', viewAll: 'ดูทั้งหมด', order: 'คำสั่งซื้อ', customer: 'ลูกค้า', items: 'สินค้า', amount: 'ยอดรวม', payment: 'การชำระเงิน', fulfillment: 'การจัดส่ง', status: 'สถานะ', date: 'วันที่', noOrders: 'ยังไม่มีคำสั่งซื้อ', noOrdersDescription: 'คำสั่งซื้อจะแสดงที่นี่เมื่อลูกค้าชำระเงิน', addProducts: 'เพิ่มสินค้า', manageProducts: 'จัดการสินค้า', previewProducts: 'ดูหน้าสินค้าจริง', manageCollections: 'จัดการคอลเลกชัน', previewCollection: 'ดูหน้าคอลเลกชัน',
  },
  ja: {
    language: '言語', overview: '概要', catalogue: 'カタログ', products: '商品', collections: 'コレクション', media: 'メディア', selling: '販売', orders: '注文', customers: '顧客', payments: '支払い', discounts: '割引', analytics: '分析', storefront: 'ストアフロント', store: 'ストア', storeEditor: 'ストアエディター', workspace: 'ワークスペース', team: 'チーム', integrations: '連携', settings: '設定', helpDocs: 'ヘルプとガイド', viewStore: 'ストアを見る', editWebsite: 'サイトを編集', previewStore: 'ストアをプレビュー', soon: '近日公開',
    home: 'ホーム', saved: 'すべて保存済み', unsaved: '未保存の変更', preview: 'プレビュー', publish: '公開', structure: '構造', add: '追加', theme: 'テーマ', addSection: 'セクションを追加', searchSections: 'セクションを検索', all: 'すべて', hero: 'ヒーロー', pageOutline: 'ページ構成', dragReorder: 'ドラッグして並べ替え', selectedSection: '選択中のセクション', desktop: 'デスクトップ', mobile: 'モバイル', back: '戻る', content: 'コンテンツ', style: 'スタイル', image: '画像', heading: '見出し', subheading: 'サブ見出し', buttonLabel: 'ボタンラベル', buttonLink: 'ボタンリンク', textAlignment: 'テキスト配置', backgroundImage: '背景画像', color: 'カラー', font: 'フォント', size: 'サイズ', weight: 'ウェイト', align: '配置', saveLayout: 'レイアウトを保存', discard: '変更を破棄', announcement: 'お知らせバー', header: 'ヘッダー', featuredProducts: '商品カルーセル', collectionList: '注目コレクション', textBlock: 'クリエイターストーリー', socialLinks: 'ソーシャルリンク', newsletter: 'ニュースレター', marquee: 'スクロールテキスト', footer: 'フッター', imageBanner: '画像バナー', imageWithText: '画像とテキスト', gallery: 'ギャラリー', video: '動画', productGrid: '商品グリッド', overviewDescription: 'ショップの状況をひと目で確認できます。', newProduct: '新しい商品', days: '日間', revenue: '売上', visitors: '訪問者', conversionRate: 'コンバージョン率', noPriorData: '比較データなし', vsPrevious: '前期間比', sales: '売上推移', salesDescription: '選択期間の売上と注文数です。', topProducts: '人気商品', topProductsDescription: 'この期間のベストセラーです。', sold: '点販売', noSales: 'この期間の売上はまだありません。', recentOrders: '最近の注文', recentOrdersDescription: 'ショップ全体の最新注文です。', viewAll: 'すべて見る', order: '注文', customer: '顧客', items: '商品', amount: '金額', payment: '支払い', fulfillment: '発送', status: 'ステータス', date: '日付', noOrders: '注文はまだありません', noOrdersDescription: '購入が完了すると、注文がここに表示されます。', addProducts: '商品を追加', manageProducts: '商品を管理', previewProducts: '商品ページをプレビュー', manageCollections: 'コレクションを管理', previewCollection: 'コレクションをプレビュー',
  },
} as const;

export type CopyKey = keyof typeof COPY.en;

/**
 * Legacy dashboard copy still exists as literal JSX in a number of feature
 * screens. This phrase table lets the locale provider translate that chrome
 * consistently while those screens are progressively moved to `t()`.
 * User-entered values are never touched.
 */
const UI_PHRASES: Record<string, { th: string; ja: string }> = {
  'Products': { th: 'สินค้า', ja: '商品' },
  'New product': { th: 'เพิ่มสินค้าใหม่', ja: '新しい商品' },
  'Edit product': { th: 'แก้ไขรายละเอียดสินค้า', ja: '商品を編集' },
  'Create product': { th: 'สร้างสินค้า', ja: '商品を作成' },
  'Save changes': { th: 'บันทึกการเปลี่ยนแปลง', ja: '変更を保存' },
  'Save': { th: 'บันทึก', ja: '保存' },
  'Discard': { th: 'ยกเลิกการแก้ไข', ja: '変更を破棄' },
  'You have unsaved changes.': { th: 'คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก', ja: '未保存の変更があります。' },
  'Basics': { th: 'รายละเอียดสินค้า', ja: '基本情報' },
  'Title': { th: 'ชื่อสินค้า', ja: 'タイトル' },
  'Title*': { th: 'ชื่อสินค้า*', ja: 'タイトル*' },
  'URL slug': { th: 'ลิงก์สินค้า', ja: 'URL スラッグ' },
  'Description': { th: 'รายละเอียด', ja: '説明' },
  'What it is made of, how it ships, why someone wants it.': { th: 'อธิบายวัสดุ วิธีจัดส่ง และจุดเด่นของสินค้า', ja: '素材、配送方法、商品の魅力を説明します。' },
  'Media': { th: 'รูปภาพสินค้า', ja: 'メディア' },
  'The first image is used as the thumbnail.': { th: 'รูปแรกจะใช้เป็นภาพหน้าปกสินค้า', ja: '最初の画像がサムネイルに使用されます。' },
  'Cover': { th: 'ภาพหน้าปก', ja: 'カバー' },
  'Upload': { th: 'อัปโหลด', ja: 'アップロード' },
  'Add': { th: 'เพิ่ม', ja: '追加' },
  'Options': { th: 'ตัวเลือกสินค้า', ja: 'オプション' },
  'Option name': { th: 'ชื่อตัวเลือก', ja: 'オプション名' },
  'Values': { th: 'ค่าตัวเลือก', ja: '値' },
  'Add value': { th: 'เพิ่มค่า', ja: '値を追加' },
  'Add option': { th: 'เพิ่มตัวเลือก', ja: 'オプションを追加' },
  'Variants': { th: 'รูปแบบสินค้า', ja: 'バリエーション' },
  'Variant': { th: 'รูปแบบสินค้า', ja: 'バリエーション' },
  'Price': { th: 'ราคา', ja: '価格' },
  'Price (THB)*': { th: 'ราคา (บาท)*', ja: '価格（THB）*' },
  'Price (THB)': { th: 'ราคา (บาท)', ja: '価格（THB）' },
  'Set all prices (THB)': { th: 'กำหนดราคาทั้งหมด (บาท)', ja: '全価格を設定（THB）' },
  'Stock': { th: 'สต็อก', ja: '在庫' },
  'Supplier SKU': { th: 'SKU จากผู้ผลิต', ja: '仕入先 SKU' },
  'On sale': { th: 'พร้อมขาย', ja: '販売中' },
  'Set all stock': { th: 'กำหนดสต็อกทั้งหมด', ja: '在庫を一括設定' },
  'Apply': { th: 'นำไปใช้', ja: '適用' },
  'Status': { th: 'สถานะสินค้า', ja: 'ステータス' },
  'Visibility': { th: 'สถานะการขาย', ja: '公開状態' },
  'Category': { th: 'หมวดหมู่', ja: 'カテゴリー' },
  'Choose a category': { th: 'เลือกหมวดหมู่', ja: 'カテゴリーを選択' },
  'Pricing': { th: 'ราคา', ja: '価格設定' },
  'Compare at price': { th: 'ราคาก่อนลด', ja: '比較価格' },
  'Cost per item': { th: 'ต้นทุนต่อหน่วย', ja: '商品原価' },
  'Shown struck through, for sales.': { th: 'ราคานี้จะแสดงพร้อมขีดฆ่าเมื่อสินค้าลดราคา', ja: 'セール時に取り消し線付きで表示されます。' },
  'Only you see this. Used for margin reporting.': { th: 'ข้อมูลนี้จะแสดงเฉพาะคุณและใช้สำหรับคำนวณกำไร', ja: '管理者のみに表示され、利益計算に使用されます。' },
  'Inventory & fulfillment': { th: 'สินค้าคงคลังและการจัดส่ง', ja: '在庫とフルフィルメント' },
  'Stock tracking': { th: 'การติดตามสต็อก', ja: '在庫追跡' },
  'Fulfillment': { th: 'วิธีจัดส่ง', ja: 'フルフィルメント' },
  'Collections': { th: 'คอลเลกชัน', ja: 'コレクション' },
  'Search listing': { th: 'การแสดงผลบนหน้าค้นหา', ja: '検索表示' },
  'SEO title': { th: 'ชื่อ SEO', ja: 'SEO タイトル' },
  'SEO description': { th: 'คำอธิบาย SEO', ja: 'SEO 説明' },
  'Danger zone': { th: 'การลบสินค้า', ja: '危険な操作' },
  'Delete product': { th: 'ลบสินค้า', ja: '商品を削除' },
  'Back to products': { th: 'กลับไปหน้าสินค้า', ja: '商品一覧に戻る' },
  'All': { th: 'ทั้งหมด', ja: 'すべて' },
  'Active': { th: 'เปิดขาย', ja: '公開中' },
  'Drafts': { th: 'ฉบับร่าง', ja: '下書き' },
  'Archived': { th: 'เก็บถาวร', ja: 'アーカイブ' },
  'Updated': { th: 'อัปเดตล่าสุด', ja: '更新日' },
  'Actions': { th: 'การจัดการ', ja: '操作' },
  'Orders': { th: 'คำสั่งซื้อ', ja: '注文' },
  'Customers': { th: 'ลูกค้า', ja: '顧客' },
  'Payments': { th: 'การชำระเงิน', ja: '支払い' },
  'Discounts': { th: 'ส่วนลด', ja: '割引' },
  'Analytics': { th: 'การวิเคราะห์', ja: '分析' },
  'Settings': { th: 'ตั้งค่า', ja: '設定' },
  'Team': { th: 'ทีม', ja: 'チーム' },
  'Store': { th: 'ร้านค้า', ja: 'ストア' },
  'Store editor': { th: 'ตัวแก้ไขร้าน', ja: 'ストアエディター' },
  'Theme & style': { th: 'ธีมและสไตล์', ja: 'テーマとスタイル' },
  'Content & layout': { th: 'เนื้อหาและเลย์เอาต์', ja: 'コンテンツとレイアウト' },
  'Canvas': { th: 'แคนวาส', ja: 'キャンバス' },
  'Customizer': { th: 'ปรับแต่ง', ja: 'カスタマイズ' },
  'Patterns': { th: 'รูปแบบ', ja: 'パターン' },
  'Layout': { th: 'เลย์เอาต์', ja: 'レイアウト' },
  'Desktop': { th: 'เดสก์ท็อป', ja: 'デスクトップ' },
  'Mobile': { th: 'มือถือ', ja: 'モバイル' },
  'Preview website': { th: 'ดูตัวอย่างเว็บไซต์', ja: 'サイトをプレビュー' },
  'Save layout': { th: 'บันทึกเลย์เอาต์', ja: 'レイアウトを保存' },
  'Save theme': { th: 'บันทึกธีม', ja: 'テーマを保存' },
  'Manage': { th: 'จัดการ', ja: '管理' },
  'View': { th: 'ดูหน้าสินค้า', ja: '商品を見る' },
  'Remove image': { th: 'ลบรูปภาพ', ja: '画像を削除' },
  '…or paste an image URL': { th: '…หรือวาง URL ของรูปภาพ', ja: '…または画像 URL を貼り付け' },
  'Up to four options. Add a group label to values when a list gets long — the storefront turns it into a two-step selector.': { th: 'เพิ่มตัวเลือกได้สูงสุด 4 รายการ หากรายการยาวสามารถกำหนดชื่อกลุ่มเพื่อให้หน้าร้านแสดงแบบเลือกสองขั้นตอน', ja: 'オプションは最大4つ。項目が多い場合はグループ名を付けると、ストアフロントで2段階選択になります。' },
  'Phone Model': { th: 'รุ่นโทรศัพท์', ja: '機種' },
  'Group (optional)': { th: 'กลุ่ม (ไม่บังคับ)', ja: 'グループ（任意）' },
  'Remove value': { th: 'ลบค่านี้', ja: '値を削除' },
  'Each row is separately priced and stocked, and can map to a supplier SKU later.': { th: 'แต่ละตัวแปรกำหนดราคาและสต็อกแยกกัน และสามารถเชื่อม SKU ของผู้จัดหาได้ภายหลัง', ja: '各バリエーションの価格と在庫を個別に設定し、後から仕入先 SKU を割り当てられます。' },
  'Base price. Variants can override it individually.': { th: 'ราคาพื้นฐาน โดยรูปแบบสินค้าแต่ละรายการสามารถกำหนดราคาแยกได้', ja: '基本価格です。バリエーションごとに上書きできます。' },
  'Draft — not visible in your shop': { th: 'ฉบับร่าง — ยังไม่แสดงบนหน้าร้าน', ja: '下書き — ストアには表示されません' },
  'Active — on sale': { th: 'พร้อมขาย — แสดงบนหน้าร้าน', ja: '公開 — 販売中' },
  'Archived — hidden, kept for records': { th: 'เก็บไว้ — ไม่แสดงบนหน้าร้าน', ja: 'アーカイブ — 非表示で記録を保持' },
  'Do not track stock': { th: 'ไม่ติดตามสต็อก', ja: '在庫を追跡しない' },
  'Track stock, stop at zero': { th: 'ติดตามสต็อกและหยุดขายเมื่อหมด', ja: '在庫を追跡し、0で販売停止' },
  'Track stock, allow backorders': { th: 'ติดตามสต็อกและอนุญาตให้สั่งจอง', ja: '在庫を追跡し、取り寄せ注文を許可' },
  'Manual — you pack and ship': { th: 'จัดส่งเอง — คุณแพ็กและส่งสินค้า', ja: '手動 — 自分で梱包・発送' },
  'From stock': { th: 'จัดส่งจากสต็อก', ja: '在庫から発送' },
  'Print on demand': { th: 'ผลิตตามคำสั่งซื้อ', ja: 'オンデマンド印刷' },
  'Dropship': { th: 'ดรอปชิป', ja: 'ドロップシップ' },
  'Digital download': { th: 'ดาวน์โหลดดิจิทัล', ja: 'デジタルダウンロード' },
  'Print-on-demand and dropship providers connect in Phase 3.': { th: 'ระบบเชื่อมต่อผู้ให้บริการผลิตตามสั่งและดรอปชิปจะเพิ่มในเฟส 3', ja: 'オンデマンド印刷とドロップシップ連携はフェーズ3で追加予定です。' },
  'Deleting removes the product from your shop. Past orders keep their snapshots.': { th: 'การลบจะนำสินค้าออกจากร้าน แต่คำสั่งซื้อเดิมจะยังคงเก็บข้อมูลสินค้าไว้', ja: '削除するとストアから商品が消えますが、過去の注文情報は保持されます。' },
  'Variant available': { th: 'พร้อมขาย', ja: 'このバリエーションを販売' },
  'Remove variant': { th: 'ลบรูปแบบสินค้า', ja: 'バリエーションを削除' },
  'Background colour': { th: 'สีพื้นหลัง', ja: '背景色' },
  'Text colour': { th: 'สีข้อความ', ja: '文字色' },
  'Heading size': { th: 'ขนาดหัวเรื่อง', ja: '見出しサイズ' },
  'Section font': { th: 'ฟอนต์ของเซกชัน', ja: 'セクションのフォント' },
  'Section alignment': { th: 'การจัดแนวเซกชัน', ja: 'セクション配置' },
  'Left': { th: 'ซ้าย', ja: '左' },
  'Centre': { th: 'กึ่งกลาง', ja: '中央' },
  'Right': { th: 'ขวา', ja: '右' },
  'Required': { th: 'จำเป็นต้องกรอก', ja: '必須' },
  'Language': { th: 'ภาษา', ja: '言語' },
  'Change theme': { th: 'เปลี่ยนธีม', ja: 'テーマを変更' },
  'Checking your session…': { th: 'กำลังตรวจสอบการเข้าสู่ระบบ…', ja: 'セッションを確認中…' },
  'Everyone who has bought from you, built automatically at checkout.': { th: 'รายชื่อลูกค้าที่เคยสั่งซื้อ ระบบจะบันทึกให้อัตโนมัติเมื่อชำระเงิน', ja: '購入者はチェックアウト時に自動で顧客一覧へ追加されます。' },
  'Name, email or phone': { th: 'ค้นหาจากชื่อ อีเมล หรือเบอร์โทร', ja: '名前、メール、電話番号で検索' },
  'Customer': { th: 'ลูกค้า', ja: '顧客' },
  'Phone': { th: 'เบอร์โทร', ja: '電話番号' },
  'Total spent': { th: 'ยอดซื้อรวม', ja: '購入総額' },
  'Last order': { th: 'สั่งซื้อล่าสุด', ja: '最終注文' },
  'No customers yet': { th: 'ยังไม่มีลูกค้า', ja: '顧客はまだいません' },
  'Customers appear here after their first checkout.': { th: 'ข้อมูลลูกค้าจะแสดงหลังจากมีการสั่งซื้อครั้งแรก', ja: '初回チェックアウト後に顧客情報が表示されます。' },
  'Order history': { th: 'ประวัติการสั่งซื้อ', ja: '注文履歴' },
  'Summary': { th: 'สรุปข้อมูล', ja: '概要' },
  'Customer since': { th: 'เป็นลูกค้าตั้งแต่', ja: '顧客登録日' },
  'Addresses': { th: 'ที่อยู่', ja: '住所' },
  'Notes': { th: 'บันทึก', ja: 'メモ' },
  'No saved addresses.': { th: 'ยังไม่มีที่อยู่ที่บันทึกไว้', ja: '保存済みの住所はありません。' },
  'Every order placed through your storefront.': { th: 'คำสั่งซื้อทั้งหมดที่เข้ามาจากหน้าร้านของคุณ', ja: 'ストアフロントから受け付けたすべての注文です。' },
  'Order number, name or email': { th: 'ค้นหาเลขที่คำสั่งซื้อ ชื่อ หรืออีเมล', ja: '注文番号、名前、メールで検索' },
  'All statuses': { th: 'ทุกสถานะ', ja: 'すべてのステータス' },
  'All payments': { th: 'ทุกสถานะการชำระเงิน', ja: 'すべての支払い状態' },
  'No orders here': { th: 'ไม่พบคำสั่งซื้อ', ja: '注文がありません' },
  'Items': { th: 'รายการสินค้า', ja: '商品' },
  'Amount': { th: 'ยอดรวม', ja: '金額' },
  'Payment': { th: 'การชำระเงิน', ja: '支払い' },
  'Date': { th: 'วันที่', ja: '日付' },
  'Back to orders': { th: 'กลับไปหน้าคำสั่งซื้อ', ja: '注文一覧に戻る' },
  'Subtotal': { th: 'ยอดสินค้า', ja: '小計' },
  'Total': { th: 'ยอดสุทธิ', ja: '合計' },
  'Update this order': { th: 'อัปเดตคำสั่งซื้อ', ja: '注文を更新' },
  'Order status': { th: 'สถานะคำสั่งซื้อ', ja: '注文ステータス' },
  'Tracking number': { th: 'หมายเลขติดตามพัสดุ', ja: '追跡番号' },
  'Tracking': { th: 'ติดตามพัสดุ', ja: '追跡' },
  'View customer': { th: 'ดูข้อมูลลูกค้า', ja: '顧客情報を見る' },
  'Shipping address': { th: 'ที่อยู่จัดส่ง', ja: '配送先住所' },
  'No shipping address on this order.': { th: 'คำสั่งซื้อนี้ไม่มีที่อยู่จัดส่ง', ja: 'この注文には配送先住所がありません。' },
  'Customer note': { th: 'หมายเหตุจากลูกค้า', ja: '顧客メモ' },
  'No collections yet': { th: 'ยังไม่มีคอลเลกชัน', ja: 'コレクションはまだありません' },
  'Collection': { th: 'คอลเลกชัน', ja: 'コレクション' },
  'Name': { th: 'ชื่อ', ja: '名前' },
  'Slug': { th: 'ลิงก์คอลเลกชัน', ja: 'スラッグ' },
  'Used in the storefront URL.': { th: 'ใช้เป็นส่วนหนึ่งของลิงก์หน้าร้าน', ja: 'ストアフロント URL に使用されます。' },
  'Cover image URL': { th: 'URL รูปหน้าปก', ja: 'カバー画像 URL' },
  'Visible in the storefront': { th: 'แสดงบนหน้าร้าน', ja: 'ストアフロントに表示' },
  'No products yet.': { th: 'ยังไม่มีสินค้า', ja: '商品はまだありません。' },
  'Nothing uploaded yet': { th: 'ยังไม่มีไฟล์ในคลังสื่อ', ja: 'アップロード済みのファイルはありません' },
  'Upload images': { th: 'อัปโหลดรูปภาพ', ja: '画像をアップロード' },
  'No payment methods yet': { th: 'ยังไม่มีช่องทางชำระเงิน', ja: '支払い方法はまだありません' },
  'Add payment method': { th: 'เพิ่มช่องทางชำระเงิน', ja: '支払い方法を追加' },
  'Hidden': { th: 'ซ่อนอยู่', ja: '非表示' },
  'Type': { th: 'ประเภท', ja: '種類' },
  'Name shown at checkout': { th: 'ชื่อที่แสดงตอนชำระเงิน', ja: 'チェックアウト時の表示名' },
  'Account holder name': { th: 'ชื่อเจ้าของบัญชี', ja: '口座名義' },
  'Bank': { th: 'ธนาคาร', ja: '銀行' },
  'Choose your bank': { th: 'เลือกธนาคาร', ja: '銀行を選択' },
  'Account number': { th: 'เลขที่บัญชี', ja: '口座番号' },
  'QR image': { th: 'รูป QR Code', ja: 'QR 画像' },
  'Instructions for the buyer': { th: 'คำแนะนำสำหรับลูกค้า', ja: '購入者への案内' },
  'Show at checkout': { th: 'แสดงในหน้าชำระเงิน', ja: 'チェックアウトに表示' },
  'Default method': { th: 'ช่องทางหลัก', ja: '既定の方法' },
  'No discount codes yet': { th: 'ยังไม่มีโค้ดส่วนลด', ja: '割引コードはまだありません' },
  'New discount': { th: 'สร้างส่วนลด', ja: '割引を作成' },
  'Code': { th: 'โค้ด', ja: 'コード' },
  'Discount': { th: 'ส่วนลด', ja: '割引' },
  'Used': { th: 'ใช้แล้ว', ja: '使用済み' },
  'Minimum spend': { th: 'ยอดซื้อขั้นต่ำ', ja: '最低購入額' },
  'Window': { th: 'ระยะเวลา', ja: '期間' },
  'On': { th: 'เปิดใช้', ja: '有効' },
  'Letters, numbers, dashes.': { th: 'ใช้ตัวอักษร ตัวเลข และเครื่องหมายขีดกลาง', ja: '英数字とハイフンが使用できます。' },
  'Percentage off': { th: 'ลดเป็นเปอร์เซ็นต์', ja: '割引率' },
  'Amount off': { th: 'ลดเป็นจำนวนเงิน', ja: '割引額' },
  'Usage limit': { th: 'จำนวนครั้งที่ใช้ได้', ja: '利用上限' },
  'Starts': { th: 'เริ่มใช้', ja: '開始' },
  'Ends': { th: 'สิ้นสุด', ja: '終了' },
  'Code is live': { th: 'เปิดใช้งานโค้ด', ja: 'コードを有効化' },
  'Person': { th: 'สมาชิก', ja: 'メンバー' },
  'Role': { th: 'บทบาท', ja: '役割' },
  'Extra permissions': { th: 'สิทธิ์เพิ่มเติม', ja: '追加権限' },
  'Added': { th: 'เพิ่มเมื่อ', ja: '追加日' },
  'Just you so far': { th: 'ตอนนี้มีเพียงคุณ', ja: '現在はあなただけです' },
  'Invite a teammate': { th: 'เชิญสมาชิกเข้าทีม', ja: 'チームメンバーを招待' },
  'Email': { th: 'อีเมล', ja: 'メール' },
  'Identity': { th: 'ข้อมูลร้าน', ja: 'ストア情報' },
  'Store name': { th: 'ชื่อร้าน', ja: 'ストア名' },
  'Handle': { th: 'ชื่อผู้ใช้ร้าน', ja: 'ハンドル' },
  'Creator type': { th: 'ประเภทครีเอเตอร์', ja: 'クリエイター種別' },
  'Social links': { th: 'ลิงก์โซเชียล', ja: 'ソーシャルリンク' },
  'Storefront is live': { th: 'เปิดใช้งานหน้าร้าน', ja: 'ストアフロントを公開' },
  'Branding': { th: 'ภาพลักษณ์ร้าน', ja: 'ブランディング' },
  'Logo URL': { th: 'URL โลโก้', ja: 'ロゴ URL' },
  'Avatar URL': { th: 'URL รูปโปรไฟล์', ja: 'アバター URL' },
  'Banner URL': { th: 'URL แบนเนอร์', ja: 'バナー URL' },
  'Custom domain': { th: 'โดเมนของร้าน', ja: 'カスタムドメイン' },
  'Integrations': { th: 'การเชื่อมต่อ', ja: '連携' },
  'Help': { th: 'ศูนย์ช่วยเหลือ', ja: 'ヘルプ' },
  'Short answers to the things people ask first.': { th: 'คำตอบสั้น ๆ สำหรับคำถามที่พบบ่อย', ja: 'よくある質問への簡潔な回答です。' },
  'Everything you sell, from single stickers to phone cases with forty variants.': { th: 'จัดการสินค้าทั้งหมด ตั้งแต่สินค้าชิ้นเดียวไปจนถึงสินค้าที่มีหลายรูปแบบ', ja: '単品から多数のバリエーションを持つ商品まで、すべて管理できます。' },
  'Search title or SKU': { th: 'ค้นหาชื่อสินค้าหรือ SKU', ja: '商品名または SKU で検索' },
  'Product': { th: 'สินค้า', ja: '商品' },
  'No matches': { th: 'ไม่พบสินค้าที่ค้นหา', ja: '一致する商品がありません' },
  'No products yet': { th: 'ยังไม่มีสินค้า', ja: '商品はまだありません' },
  'Group products into drops, categories or limited editions.': { th: 'จัดกลุ่มสินค้าเป็นคอลเลกชัน หมวดหมู่ หรือรุ่นลิมิเต็ด', ja: '商品をドロップ、カテゴリー、限定版にまとめます。' },
  'Collections power your storefront navigation and the featured sections on your home page.': { th: 'คอลเลกชันใช้สร้างเมนูหน้าร้านและเซกชันสินค้าเด่นบนหน้าแรก', ja: 'コレクションはストアのナビゲーションとホームの注目セクションに使用されます。' },
  "Artwork, product photos and banners. Stored by the API's storage driver — swap in S3, R2 or Supabase without touching the schema.": { th: 'จัดเก็บอาร์ตเวิร์ก รูปสินค้า และแบนเนอร์ไว้ใช้ภายในร้าน', ja: 'アートワーク、商品写真、バナーをストア内で管理します。' },
  'Upload artwork here once and reuse it across products, banners and collections.': { th: 'อัปโหลดรูปครั้งเดียว แล้วนำไปใช้ซ้ำกับสินค้า แบนเนอร์ และคอลเลกชันได้', ja: '一度アップロードすれば、商品、バナー、コレクションで再利用できます。' },
  'Where your customers send money. Add your PromptPay, e-wallet or bank details and the storefront generates the QR.': { th: 'ตั้งค่าช่องทางรับชำระเงินด้วยพร้อมเพย์ อีวอลเล็ต หรือบัญชีธนาคาร', ja: 'PromptPay、電子ウォレット、銀行口座などの支払い先を設定します。' },
  'Add a PromptPay number and your storefront will generate a QR with the exact amount for every order.': { th: 'เพิ่มหมายเลขพร้อมเพย์ แล้วระบบจะสร้าง QR Code ตามยอดของแต่ละคำสั่งซื้อให้อัตโนมัติ', ja: 'PromptPay番号を追加すると、注文金額に合わせたQRコードが自動生成されます。' },
  'Codes your customers can enter in the cart. Validated again at checkout.': { th: 'สร้างโค้ดส่วนลดสำหรับใช้ในตะกร้า ระบบจะตรวจสอบอีกครั้งก่อนชำระเงิน', ja: 'カートで入力できる割引コードです。チェックアウト時に再検証されます。' },
  'Create a welcome code, a launch promo, or free shipping over a certain spend.': { th: 'สร้างโค้ดต้อนรับ โปรโมชันเปิดตัว หรือส่วนลดตามยอดซื้อ', ja: 'ウェルカムコード、開始キャンペーン、一定額以上の送料無料などを作成できます。' },
  'Who can work on this store, and what they are allowed to do.': { th: 'จัดการสมาชิกที่เข้าถึงร้านและกำหนดสิทธิ์การทำงาน', ja: 'ストアにアクセスできるメンバーと権限を管理します。' },
  'Invite an admin to help run the shop, or staff to handle products and orders.': { th: 'เชิญผู้ดูแลหรือพนักงานมาช่วยจัดการสินค้าและคำสั่งซื้อ', ja: '管理者やスタッフを招待して商品や注文を管理できます。' },
  'Your public identity: name, branding and where people can find you.': { th: 'ตั้งค่าชื่อร้าน ภาพลักษณ์ และช่องทางที่ลูกค้าจะพบคุณ', ja: 'ストア名、ブランド、公開プロフィールを設定します。' },
  'Paste image URLs, or upload in the media library.': { th: 'วาง URL รูปภาพ หรืออัปโหลดผ่านคลังสื่อ', ja: '画像 URL を貼り付けるか、メディアライブラリからアップロードします。' },
  'Print-on-demand, dropshipping and payment providers all sit behind adapter interfaces, so connecting one does not change your catalogue.': { th: 'เชื่อมต่อบริการผลิตตามสั่ง ดรอปชิป และผู้ให้บริการชำระเงิน โดยไม่กระทบข้อมูลสินค้า', ja: '商品情報を変更せずに、オンデマンド印刷、ドロップシップ、決済サービスを接続できます。' },
  'View store': { th: 'ดูหน้าร้าน', ja: 'ストアを見る' },
  'Changing your handle changes your shop URL and breaks existing links.': { th: 'หากเปลี่ยนชื่อผู้ใช้ร้าน ลิงก์หน้าร้านเดิมจะไม่สามารถใช้งานได้', ja: 'ハンドルを変更するとストア URL が変わり、既存リンクが無効になります。' },
  'Rendered by the social links section on your storefront.': { th: 'ลิงก์เหล่านี้จะแสดงในเซกชันโซเชียลของหน้าร้าน', ja: 'ストアフロントのソーシャルリンクセクションに表示されます。' },
  'Unpublishing hides the shop from visitors immediately.': { th: 'เมื่อปิดใช้งาน ลูกค้าจะไม่สามารถเข้าชมหน้าร้านได้ทันที', ja: '非公開にすると、訪問者からストアがすぐに見えなくなります。' },
  'Serving your shop from your own domain arrives in Phase 3.': { th: 'การเชื่อมต่อโดเมนของคุณจะเปิดให้ใช้งานในเฟส 3', ja: '独自ドメインへの対応はフェーズ3で追加予定です。' },
  'Setting up products with many variants': { th: 'ตั้งค่าสินค้าที่มีหลายรูปแบบ', ja: '多数のバリエーションを持つ商品の設定' },
  'Add up to four options, tag values with a group label, then generate the variant matrix. Each variant carries its own SKU, price and stock.': { th: 'เพิ่มตัวเลือกได้สูงสุด 4 รายการ จัดกลุ่มค่าตัวเลือก แล้วสร้างรูปแบบสินค้า โดยแต่ละรูปแบบสามารถมี SKU ราคา และสต็อกแยกกันได้', ja: '最大4つのオプションを追加し、値をグループ化してバリエーションを生成します。各バリエーションにSKU、価格、在庫を設定できます。' },
  'Open the product editor →': { th: 'เปิดหน้าแก้ไขสินค้า →', ja: '商品エディターを開く →' },
  'Open the product editor': { th: 'เปิดหน้าแก้ไขสินค้า', ja: '商品エディターを開く' },
  'Publishing your storefront': { th: 'การเปิดใช้งานหน้าร้าน', ja: 'ストアフロントの公開' },
  'Your shop is live at /@your-handle as soon as its status is Active and you have at least one active product.': { th: 'หน้าร้านจะเปิดที่ /@ชื่อร้าน เมื่อสถานะร้านเป็นพร้อมใช้งานและมีสินค้าเปิดขายอย่างน้อย 1 รายการ', ja: 'ストアが公開状態で、販売中の商品が1件以上あると /@your-handle で公開されます。' },
  'Store settings →': { th: 'ไปที่การตั้งค่าร้าน →', ja: 'ストア設定 →' },
  'Store settings': { th: 'ไปที่การตั้งค่าร้าน', ja: 'ストア設定' },
  'Where the phases are going': { th: 'แผนพัฒนาระบบ', ja: '今後の開発フェーズ' },
  'Phase 1 is catalogue, cart, checkout and orders. Phase 2 adds the section editor, discounts and team management. Phase 3 brings fulfillment providers and payments.': { th: 'เฟส 1 ครอบคลุมสินค้า ตะกร้า การชำระเงิน และคำสั่งซื้อ เฟส 2 เพิ่มตัวแก้ไขหน้าร้าน ส่วนลด และการจัดการทีม ส่วนเฟส 3 จะเพิ่มผู้ให้บริการจัดส่งและระบบชำระเงิน', ja: 'フェーズ1はカタログ、カート、チェックアウト、注文。フェーズ2はセクションエディター、割引、チーム管理。フェーズ3は配送・決済サービス連携です。' },
  'See the roadmap →': { th: 'ดูแผนพัฒนาระบบ →', ja: 'ロードマップを見る →' },
  'See the roadmap': { th: 'ดูแผนพัฒนาระบบ', ja: 'ロードマップを見る' },
  'Loading store…': { th: 'กำลังโหลดข้อมูลร้าน…', ja: 'ストア情報を読み込み中…' },
  'Collection images': { th: 'รูปคอลเลกชัน', ja: 'コレクション画像' },
  'Upload from your device and see the preview update instantly.': { th: 'อัปโหลดจากเครื่องแล้วดูผลในหน้าตัวอย่างได้ทันที', ja: '端末からアップロードするとプレビューへすぐ反映されます。' },
  'Upload image': { th: 'อัปโหลดรูป', ja: '画像をアップロード' },
  'Uploading…': { th: 'กำลังอัปโหลด…', ja: 'アップロード中…' },
};

function translateUiText(text: string, locale: Locale): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  let english = trimmed;
  for (const [source, translations] of Object.entries(UI_PHRASES)) {
    if (trimmed === translations.th || trimmed === translations.ja) {
      english = source;
      break;
    }
  }
  let translated = locale === 'en' ? english : UI_PHRASES[english]?.[locale] ?? english;
  if (locale !== 'en' && translated === english) {
    const rules: Array<[RegExp, (match: RegExpMatchArray) => string]> = locale === 'th'
      ? [
          [/^Generate (\d+) variants?$/, (m) => `สร้างรูปแบบสินค้า ${m[1]} รายการ`],
          [/^(\d+) variants? currently in the table below\.$/, (m) => `มีรูปแบบสินค้า ${m[1]} รายการ`],
          [/^Set all prices \((.+)\)$/, (m) => `กำหนดราคาทั้งหมด (${m[1]})`],
          [/^Price \((.+)\)\*$/, (m) => `ราคา (${m[1]})*`],
          [/^Remove option (.+)$/, (m) => `ลบตัวเลือก ${m[1]}`],
          [/^Actions for (.+)$/, (m) => `การจัดการสำหรับ ${m[1]}`],
        ]
      : [
          [/^Generate (\d+) variants?$/, (m) => `${m[1]}件のバリエーションを生成`],
          [/^(\d+) variants? currently in the table below\.$/, (m) => `下の表に${m[1]}件のバリエーションがあります。`],
          [/^Set all prices \((.+)\)$/, (m) => `全価格を設定（${m[1]}）`],
          [/^Price \((.+)\)\*$/, (m) => `価格（${m[1]}）*`],
          [/^Remove option (.+)$/, (m) => `オプション「${m[1]}」を削除`],
          [/^Actions for (.+)$/, (m) => `${m[1]}の操作`],
        ];
    for (const [pattern, render] of rules) {
      const match = english.match(pattern);
      if (match) {
        translated = render(match);
        break;
      }
    }
  }
  return text.replace(trimmed, translated);
}

const ORIGINAL_TEXT = new WeakMap<Node, string>();
const APPLIED_TEXT = new WeakMap<Node, string>();
const ORIGINAL_ATTRIBUTES = new WeakMap<Element, Map<string, string>>();

const LocaleContext = React.createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: CopyKey) => string } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>('en');

  React.useEffect(() => {
    const saved = window.localStorage.getItem('vmerce-locale');
    if (saved === 'en' || saved === 'th' || saved === 'ja') {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem('vmerce-locale', next);
    document.documentElement.lang = next;
  }, []);

  React.useEffect(() => {
    if (!window.location.pathname.startsWith('/dashboard')) return;
    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.parentElement && !node.parentElement.closest('script,style,[data-no-i18n]')) {
        const current = node.textContent ?? '';
        if (!ORIGINAL_TEXT.has(node) || (APPLIED_TEXT.has(node) && APPLIED_TEXT.get(node) !== current)) {
          ORIGINAL_TEXT.set(node, current);
        }
        const next = translateUiText(ORIGINAL_TEXT.get(node) ?? current, locale);
        APPLIED_TEXT.set(node, next);
        if (next !== node.textContent) node.textContent = next;
      }
      if (node instanceof Element) {
        for (const element of [node, ...Array.from(node.querySelectorAll('*'))]) {
          if (element.closest('[data-no-i18n]')) continue;
          const originals = ORIGINAL_ATTRIBUTES.get(element) ?? new Map<string, string>();
          for (const attribute of ['placeholder', 'title', 'aria-label']) {
            const value = element.getAttribute(attribute);
            if (value) {
              if (!originals.has(attribute)) originals.set(attribute, value);
              element.setAttribute(attribute, translateUiText(originals.get(attribute) ?? value, locale));
            }
          }
          ORIGINAL_ATTRIBUTES.set(element, originals);
          for (const child of Array.from(element.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) translateNode(child);
          }
        }
      }
    };
    translateNode(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target);
        record.addedNodes.forEach(translateNode);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  const value = React.useMemo(() => ({ locale, setLocale, t: (key: CopyKey) => COPY[locale][key] }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = React.useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
