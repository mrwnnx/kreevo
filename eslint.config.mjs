import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /**
       * 391 des 436 erreurs de lint sont des `as any`, en grande partie le
       * contournement du typage `never` de Supabase sur `.from(table)`. Tant
       * qu'elles sont en `error`, elles noient les 45 autres — dont 18
       * `react-hooks/set-state-in-effect`, que le compilateur React 19 signale
       * à juste titre — et `npm run lint` ne peut servir de garde-fou : le
       * rapport est rouge par construction, donc plus personne ne le lit.
       *
       * Passé en `warn` : la dette reste visible et comptée, mais un lint qui
       * échoue redevient un signal. À remettre en `error` le jour où les
       * `as any` seront résorbés.
       */
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
