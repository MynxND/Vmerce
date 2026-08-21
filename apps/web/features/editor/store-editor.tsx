'use client';

import * as React from 'react';
import { Blocks, ExternalLink, Eye, PanelLeft, PanelsTopLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { useActiveStoreSummary } from '@/hooks/use-active-store';
import { storeUrl } from '@/lib/utils';
import { SectionEditor } from './section-editor';
import { ThemeEditor } from './theme-editor';

/**
 * Store editor shell. Layout (which sections, in what order) and Design (the
 * theme tokens) are separate concerns with separate save actions, so they get
 * separate tabs rather than one giant form.
 */
export function StoreEditor() {
  const store = useActiveStoreSummary();
  const [tab, setTab] = React.useState('layout');
  const [mode, setMode] = React.useState<'canvas' | 'customizer' | 'patterns'>('patterns');

  React.useEffect(() => {
    const saved = window.localStorage.getItem('store-editor-mode');
    if (saved === 'canvas' || saved === 'customizer' || saved === 'patterns') setMode(saved);
  }, []);

  const chooseMode = (next: typeof mode) => {
    setMode(next);
    window.localStorage.setItem('store-editor-mode', next);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Store editor"
        title="Storefront"
        description="Arrange your shop's sections and tune how it looks."
        actions={
          store && (
            <Button asChild variant="outline" size="sm">
              <a href={storeUrl(store.handle)} target="_blank" rel="noreferrer">
                <Eye /> Preview website <ExternalLink className="size-3" />
              </a>
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="layout">Content & layout</TabsTrigger>
            <TabsTrigger value="design">Theme & style</TabsTrigger>
          </TabsList>

          {tab === 'layout' && (
            <div className="border-border bg-card flex items-center gap-1 rounded-full border p-1" aria-label="Editor mode">
              <Button type="button" size="sm" variant={mode === 'canvas' ? 'subtle' : 'ghost'} onClick={() => chooseMode('canvas')}>
                <PanelsTopLeft /> Canvas
              </Button>
              <Button type="button" size="sm" variant={mode === 'customizer' ? 'subtle' : 'ghost'} onClick={() => chooseMode('customizer')}>
                <PanelLeft /> Customizer
              </Button>
              <Button type="button" size="sm" variant={mode === 'patterns' ? 'subtle' : 'ghost'} onClick={() => chooseMode('patterns')}>
                <Blocks /> Patterns
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="layout" className="mt-6">
          <SectionEditor mode={mode} />
        </TabsContent>
        <TabsContent value="design" className="mt-6">
          <ThemeEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
