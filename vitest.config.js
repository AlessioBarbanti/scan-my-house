import { defineConfig } from 'vitest/config';

// I test istanziano jsdom manualmente (vedi tests/helpers.js) per poter
// eseguire i file .js del sito come "classic script" e riprodurre fedelmente
// la semantica del browser. Quindi l'ambiente di Vitest resta 'node'.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
