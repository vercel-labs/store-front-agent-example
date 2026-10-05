import { withEve } from "eve/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// Runs the agent in agent/ beside the app and mounts it at /eve/v1/*.
export default withEve(nextConfig);
