#!/usr/bin/env node

/**
 * Starts Expo through a free Cloudflare quick tunnel instead of Expo's shared ngrok
 * (which fails with "Cannot read properties of undefined (reading 'body')").
 * No account or token needed. Requires cloudflared: winget install Cloudflare.cloudflared
 *
 * Usage: npm run tunnel:cf
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const PORT = process.env.RCT_METRO_PORT || "8081";

function findCloudflared() {
  const onPath = spawnSync("where cloudflared", { encoding: "utf8", shell: true });
  if (onPath.status === 0) return onPath.stdout.split(/\r?\n/)[0].trim();
  const candidates = [
    "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
    "C:\\Program Files\\cloudflared\\cloudflared.exe",
  ];
  return candidates.find((p) => existsSync(p));
}

const cloudflared = findCloudflared();
if (!cloudflared) {
  console.error("cloudflared not found. Install it with: winget install Cloudflare.cloudflared");
  process.exit(1);
}

console.log("Starting Cloudflare tunnel...");
const tunnel = spawn(cloudflared, ["tunnel", "--no-autoupdate", "--url", `http://localhost:${PORT}`]);

let expo;
const stop = () => {
  tunnel.kill();
  expo?.kill();
};
process.on("SIGINT", stop);
process.on("exit", stop);

const timeout = setTimeout(() => {
  console.error("No tunnel URL after 30s. Check your internet connection and try again.");
  stop();
  process.exit(1);
}, 30_000);

tunnel.stderr.on("data", (chunk) => {
  if (expo) return;
  const match = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!match) return;
  clearTimeout(timeout);

  const url = match[0];
  console.log(`\nTunnel ready: ${url}`);
  console.log(`In Expo Go open: exp://${new URL(url).host}\n`);

  expo = spawn(`npx expo start --port ${PORT}`, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, EXPO_PACKAGER_PROXY_URL: url },
  });
  expo.on("exit", (code) => {
    tunnel.kill();
    process.exit(code ?? 0);
  });
});

tunnel.on("exit", (code) => {
  if (!expo) {
    console.error(`cloudflared exited early (code ${code}).`);
    process.exit(1);
  }
});
