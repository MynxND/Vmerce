'use client';

import Image from 'next/image';
import { GalleryHorizontalEnd, Images, Mail, Play, Share2 } from 'lucide-react';
import { SectionType } from '@cc/types';
import { cn } from '@/lib/utils';

interface SectionThumbnailProps {
  type: SectionType;
  label: string;
  productImages?: string[];
  collectionImages?: string[];
  compact?: boolean;
}

const heroImage = '/editor/cyber-neko-hero.png';

function Picture({ src, className }: { src: string; className?: string }) {
  return <Image unoptimized fill src={src} alt="" className={cn('object-cover', className)} />;
}

export function SectionThumbnail({
  type,
  label,
  productImages = [],
  collectionImages = [],
  compact = false,
}: SectionThumbnailProps) {
  const height = compact ? 'h-11' : 'h-[86px]';
  const frame = cn('relative overflow-hidden rounded-md border border-white/10 bg-[#080811] text-white', height);
  const products = productImages.length > 0 ? productImages : [heroImage, heroImage, heroImage];
  const collections = collectionImages.length > 0 ? collectionImages : [heroImage, heroImage, heroImage];

  if (type === SectionType.HERO || type === SectionType.IMAGE_BANNER) {
    return <div className={frame}><Picture src={heroImage} className="opacity-75" /><span className="absolute inset-x-2 bottom-2 text-[9px] font-black uppercase tracking-wide">{label}</span></div>;
  }

  if (type === SectionType.FEATURED_PRODUCTS || type === SectionType.PRODUCT_GRID) {
    return <div className={cn(frame, 'p-2')}><span className="block text-[7px] font-black uppercase tracking-widest text-fuchsia-400">{label}</span><div className="mt-1 grid h-[calc(100%-12px)] grid-cols-3 gap-1">{products.slice(0, 3).map((src, index) => <span key={`${src}-${index}`} className="relative overflow-hidden rounded-sm bg-violet-950"><Picture src={src} /></span>)}</div></div>;
  }

  if (type === SectionType.COLLECTION_LIST || type === SectionType.GALLERY) {
    return <div className={cn(frame, 'grid grid-cols-3 gap-1 p-1.5')}>{collections.slice(0, 3).map((src, index) => <span key={`${src}-${index}`} className="relative overflow-hidden rounded-sm"><Picture src={src} className="opacity-80" />{type === SectionType.COLLECTION_LIST && <span className="absolute inset-x-1 bottom-1 text-[6px] font-bold uppercase">Collection {index + 1}</span>}</span>)}</div>;
  }

  if (type === SectionType.IMAGE_WITH_TEXT) {
    return <div className={cn(frame, 'grid grid-cols-2')}><span className="relative"><Picture src={heroImage} className="opacity-75" /></span><span className="flex flex-col justify-center gap-1.5 p-2"><b className="text-[8px] uppercase">Image + text</b><i className="h-1 rounded bg-white/55" /><i className="h-1 w-3/4 rounded bg-white/25" /><i className="mt-1 h-3 w-12 rounded-sm bg-cyan-400" /></span></div>;
  }

  if (type === SectionType.TEXT_BLOCK) {
    return <div className={cn(frame, 'flex flex-col items-center justify-center gap-2 px-8 text-center')}><b className="text-[9px] uppercase">Your story headline</b><span className="h-1 w-full rounded bg-white/35" /><span className="h-1 w-4/5 rounded bg-white/20" /></div>;
  }

  if (type === SectionType.VIDEO) {
    return <div className={frame}><Picture src={heroImage} className="opacity-55" /><span className="absolute inset-0 flex items-center justify-center"><span className="flex size-8 items-center justify-center rounded-full bg-white text-black"><Play className="size-4 fill-current" /></span></span></div>;
  }

  if (type === SectionType.SOCIAL_LINKS) {
    return <div className={cn(frame, 'flex items-center justify-center gap-3')}><Share2 className="size-4 text-cyan-300" /><span className="rounded border border-white/30 px-2 py-1 text-[7px]">X</span><span className="rounded border border-white/30 px-2 py-1 text-[7px]">YT</span><span className="rounded border border-white/30 px-2 py-1 text-[7px]">DISCORD</span></div>;
  }

  if (type === SectionType.NEWSLETTER) {
    return <div className={cn(frame, 'flex items-center gap-3 px-4')}><Mail className="size-5 text-fuchsia-400" /><span className="flex-1"><b className="block text-[8px] uppercase">Join the club</b><i className="mt-1 block h-3 rounded border border-white/25" /></span><span className="rounded-sm bg-violet-600 px-2 py-1 text-[7px] font-bold">JOIN</span></div>;
  }

  if (type === SectionType.MARQUEE) {
    return <div className={cn(frame, 'flex items-center overflow-hidden border-y border-fuchsia-500/30')}><div className="flex min-w-max items-center gap-4 px-2 text-[7px] font-black uppercase tracking-[0.22em]"><span>LIVE NOW</span><b className="text-fuchsia-400">{'///'}</b><span>NEW DROP</span><b className="text-cyan-300">{'///'}</b><span>CREATOR NEWS</span></div></div>;
  }

  return <div className={cn(frame, 'flex items-center justify-center gap-2 text-[8px] font-bold uppercase')}><GalleryHorizontalEnd className="size-4 text-violet-400" />{label}<Images className="size-4 text-cyan-300" /></div>;
}
