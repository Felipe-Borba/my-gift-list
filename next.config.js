const nextConfig = {
  // pacotes ESM-only; transpilar permite ao Jest (CJS) importá-los
  transpilePackages: ["node-pg-migrate", "@faker-js/faker"],
};

module.exports = nextConfig;
