import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/", "out/", "docs/", "supabase/functions/*/index.ts"] },
];

export default config;
