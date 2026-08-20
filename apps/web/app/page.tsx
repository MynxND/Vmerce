/* eslint-disable @next/next/no-img-element -- remote editorial previews are supplied by the design reference */
import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Globe2, ShoppingBag, Sparkles, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clientEnv } from '@/lib/env';

const STEPS = [
  { icon: ShoppingBag, number: '01', title: 'Tell us about your store', body: 'Choose what you sell and the feeling you want your little world to have.' },
  { icon: WandSparkles, number: '02', title: 'Make it completely yours', body: 'Pick a theme, then shape every colour, typeface and section—no code required.' },
  { icon: Globe2, number: '03', title: 'Share it with the world', body: 'Add products, publish in a click and start receiving real orders.' },
];

const STORES = [
  { name: 'Yuki Studio', type: 'Fashion', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=700&q=80', theme: 'bg-[#1a1625] text-white' },
  { name: 'Paperie', type: 'Stationery', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=700&q=80', theme: 'bg-[#fff0f6] text-[#2a2535]' },
  { name: 'Sunday Objects', type: 'Home & living', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=80', theme: 'bg-[#e8efe9] text-[#2a2535]' },
];

function Brand() {
  return <Link href="/" className="font-display flex items-center gap-2 text-base font-bold tracking-tight"><span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl shadow-sm"><ShoppingBag className="size-4" /></span>{clientEnv.platformName.toLowerCase()} <Sparkles className="size-3 text-[#c4a7e7]" /></Link>;
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-hidden">
      <header className="border-border/70 fixed inset-x-0 top-0 z-50 border-b bg-[rgb(250_248_245/0.9)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5">
          <Brand />
          <nav className="text-sidebar-foreground hidden flex-1 items-center justify-center gap-7 text-sm font-medium md:flex"><a href="#features" className="hover:text-foreground">Features</a><a href="#showcase" className="hover:text-foreground">Showcase</a><a href="#pricing" className="hover:text-foreground">Pricing</a></nav>
          <div className="ml-auto flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button><Button asChild size="sm"><Link href="/start">Start creating <Sparkles /></Link></Button></div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-14 px-5 pb-20 pt-28 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="bg-secondary text-primary mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"><Sparkles className="size-3" /> AI theme generation is here</p>
            <h1 className="font-display max-w-xl text-5xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-6xl">Your store.<br />Your little<br />world. <span className="text-primary">✦</span></h1>
            <p className="text-sidebar-foreground mt-6 max-w-md text-lg leading-relaxed">Build a beautiful online store that feels completely yours — no coding required.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/start">Create your store <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><a href="#showcase">Explore stores</a></Button></div>
            <div className="mt-12 flex items-center gap-4"><div className="flex -space-x-2">{['#f9a0c0', '#c4a7e7', '#a8eed8', '#ffe8a0', '#ffb5a0'].map((color, index) => <span key={color} className="border-background flex size-8 items-center justify-center rounded-full border-2 text-[10px] font-bold" style={{ background: color }}>{['M','S','J','A','K'][index]}</span>)}</div><div><p className="text-sm font-bold">12,000+ stores launched</p><p className="text-muted-foreground text-xs">by creators everywhere ✦</p></div></div>
          </div>

          <div className="relative hidden h-[540px] lg:block">
            <div className="bg-secondary absolute left-1/2 top-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
            {STORES.map((store, index) => <article key={store.name} className={`absolute w-56 overflow-hidden rounded-3xl border border-white/50 shadow-2xl transition-transform duration-300 hover:z-20 hover:rotate-0 hover:scale-105 ${store.theme} ${index === 0 ? 'left-0 top-14 -rotate-6' : index === 1 ? 'right-4 top-2 rotate-6' : 'bottom-2 left-[30%] rotate-2'}`}><img src={store.image} alt="" className="h-36 w-full object-cover" /><div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-50">{store.type}</p><h2 className="font-display mt-1 font-bold">{store.name}</h2><div className="mt-4 flex gap-1.5 opacity-20"><span className="h-1.5 w-9 rounded-full bg-current" /><span className="h-1.5 w-6 rounded-full bg-current" /></div></div></article>)}
            <span className="absolute right-3 top-[45%] flex size-14 rotate-12 items-center justify-center rounded-2xl bg-[#ffe8a0] text-2xl shadow-lg">✦</span>
          </div>
        </section>

        <section id="features" className="border-border bg-card border-y py-24"><div className="mx-auto max-w-7xl px-5"><div className="mx-auto mb-14 max-w-xl text-center"><p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Simple by design</p><h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">From idea to open store<br />in one happy afternoon.</h2></div><div className="grid gap-5 md:grid-cols-3">{STEPS.map((step) => <article key={step.number} className="border-border bg-background group rounded-3xl border p-7 transition-all hover:-translate-y-1 hover:shadow-pop"><div className="flex items-center justify-between"><span className="bg-secondary text-primary flex size-12 items-center justify-center rounded-2xl"><step.icon className="size-5" /></span><span className="text-muted-foreground font-display text-sm font-bold">{step.number}</span></div><h3 className="font-display mt-8 text-xl font-bold">{step.title}</h3><p className="text-muted-foreground mt-3 text-sm leading-relaxed">{step.body}</p></article>)}</div></div></section>

        <section id="showcase" className="mx-auto max-w-7xl px-5 py-24"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Made with Vmerce</p><h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">Little worlds we love.</h2></div><Button variant="ghost">See the showcase <ChevronRight /></Button></div><div className="mt-10 grid gap-6 md:grid-cols-3">{STORES.map((store) => <article key={store.name} className="group overflow-hidden rounded-3xl"><div className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted"><img src={store.image} alt={`${store.name} storefront`} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><p className="text-muted-foreground mt-4 text-xs font-bold uppercase tracking-wider">{store.type}</p><h3 className="font-display mt-1 text-lg font-bold">{store.name}</h3></article>)}</div></section>

        <section id="pricing" className="px-5 pb-24"><div className="bg-primary relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-white sm:px-12"><div className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10" /><Sparkles className="mx-auto size-8 text-[#e5d5fa]" /><h2 className="font-display relative mt-5 text-3xl font-bold sm:text-4xl">Ready to build your little world?</h2><p className="relative mx-auto mt-4 max-w-lg text-white/75">Start free, take your time, and publish only when it feels completely yours.</p><Button asChild size="lg" className="text-primary relative mt-8 bg-white hover:bg-[#faf8f5]"><Link href="/start">Start creating <ArrowRight /></Link></Button><p className="relative mt-5 flex items-center justify-center gap-2 text-xs text-white/65"><Check className="size-3" /> No credit card required</p></div></section>
      </main>

      <footer className="border-border border-t"><div className="text-muted-foreground mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs"><Brand /><span>Made for creators, with a little bit of magic.</span><div className="flex gap-5"><Link href="/login">Log in</Link><Link href="/start">Create a store</Link></div></div></footer>
    </div>
  );
}
