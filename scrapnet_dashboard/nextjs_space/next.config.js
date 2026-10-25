const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  productionBrowserSourceMaps: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  // Sprint 8: PDFs moved from /public root into /docs/{engineering,executive}/ —
  // keep old public URLs working.
  async redirects() {
    const engineering = ['AETHEXER_EXITZ_PROJECT_BIBLE', 'BEDROCK_ESG_PROJECT_BIBLE', 'ROOFING_VERTICAL_SPECIFICATION'];
    const executive = [
      'AETHEXER_EXITZ_EXECUTIVE_BRIEF', 'BEDROCK_ESG_EXECUTIVE_BRIEF',
      'Aethexer_Combined_Executive_Bible', 'Bedrock_ESG_Combined_Executive_Bible',
      'Bedrock_FAD_Combined_Executive_Bible', 'Echo_Ex_Combined_Executive_Bible',
    ];
    const deduped = ['Aethexer', 'Bedrock_ESG', 'Bedrock_FAD', 'Echo_Ex'];
    return [
      ...engineering.map((n) => ({ source: `/${n}.pdf`, destination: `/docs/engineering/${n}.pdf`, permanent: true })),
      ...executive.map((n) => ({ source: `/${n}.pdf`, destination: `/docs/executive/${n}.pdf`, permanent: true })),
      ...deduped.map((n) => ({ source: `/${n}_Executive_Bible_.pdf`, destination: `/docs/executive/${n}_Executive_Bible.pdf`, permanent: true })),
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.filename = 'static/chunks/[name]-[contenthash:8].js';
      config.output.chunkFilename = 'static/chunks/[contenthash:16].js';
    }
    return config;
  },
};

module.exports = nextConfig;
