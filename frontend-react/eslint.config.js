import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Team-standard data-fetch pattern (fetchX() in useEffect on mount/filter
      // change) trips the new v7 set-state-in-effect rule across all pages.
      // Keep it visible as a warning; refactor incrementally. Do NOT add new
      // synchronous setState-in-effect occurrences — see Student 4 CI notes.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Vitest globals for test files.
    files: ['**/*.test.{js,jsx}', 'src/test/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
])
