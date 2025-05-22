export const skipValidation =
  Boolean(process.env.CI) ||
  Boolean(process.env.SKIP_ENV_VALIDATION) ||
  process.env.npm_lifecycle_event === "lint";
