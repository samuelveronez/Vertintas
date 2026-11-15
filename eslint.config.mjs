import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [
      ".next/",
      "out/",
      "docs/",
      "supabase/functions/*/index.ts",
      "supabase/functions/_shared/melhor-envio-oauth.ts",
    ],
  },
];

export default config;
