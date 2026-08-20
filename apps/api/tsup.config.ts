import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  clean: true,
  // The workspace packages ship raw TypeScript, so they must be bundled in.
  noExternal: ['@cc/shared', '@cc/types'],
});
