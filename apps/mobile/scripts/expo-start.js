const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function loadRootEnv() {
  const envPath = path.resolve(__dirname, "../../../.env");
  if (!fs.existsSync(envPath)) return {};

  const parsed = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key) parsed[key] = value;
  }
  return parsed;
}

const expoBin = require.resolve("expo/bin/cli", {
  paths: [path.resolve(__dirname, "..")],
});

const rootEnv = loadRootEnv();

const child = spawn(process.execPath, [expoBin, "start", ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: {
    ...process.env,
    ...rootEnv,
    EXPO_OFFLINE: process.env.EXPO_OFFLINE || "1",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
