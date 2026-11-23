import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
// Isolated local test bundle; the standard pilot bundle remains unchanged.
process.env.PILOT_BUILD_DIR = "dist-ilya-preview";
export default defineConfig({...base, outputDir: "test-results/ilya", testIgnore: [], testMatch: "**/ilya.spec.js"});
