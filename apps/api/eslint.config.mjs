import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['error', 'warn', 'log'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // The seed script and the env loader are CLI-facing and print to stdout.
    files: ['prisma/seed.ts', 'src/config/**'],
    rules: { 'no-console': 'off' },
  },
);
