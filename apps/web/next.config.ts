import type { NextConfig } from "next";
import { config } from "dotenv";
config({ path: "../../.env", quiet: true });
const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  distDir: process.env.WEB_DIST_DIR ?? ".next",
  transpilePackages: ["@starter/shared"],
};
export default nextConfig;
