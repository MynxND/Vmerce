'use client';

import * as React from 'react';
import { ExternalLink } from 'lucide-react';
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
                <ExternalLink /> Open store
              </a>
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="mt-6">
          <SectionEditor />
        </TabsContent>
        <TabsContent value="design" className="mt-6">
          <ThemeEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
