'use client';

import { Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale, type Locale } from '@/lib/i18n';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger className={compact ? 'h-8 w-[92px] rounded-lg text-xs' : 'h-9 w-[124px] rounded-full'} aria-label="Language">
        <Languages className="size-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="th">ไทย</SelectItem>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ja">日本語</SelectItem>
      </SelectContent>
    </Select>
  );
}
