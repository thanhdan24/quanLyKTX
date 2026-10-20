import js from '@eslint/js';
import globals from 'globals';

export default [{
  files: ['src/**/*.{js,jsx}', 'assets/js/*.js'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: globals.browser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  rules: {
    ...js.configs.recommended.rules,
    // JSX references and the shared compatibility imports are checked by Vite.
    'no-unused-vars': 'off',
  },
}];
