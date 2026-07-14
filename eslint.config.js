import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { 
    ignores: ['dist', 'src/routeTree.gen.ts', '*.config.ts', '*.config.js'] 
  },
  
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 
      'react-hooks': reactHooks 
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  prettierConfig,
)