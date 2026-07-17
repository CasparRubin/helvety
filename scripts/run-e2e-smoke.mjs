/**
 * Runs Playwright gateway smoke tests with a self-managed dev server lifecycle.
 * Waits for the monorepo readiness sentinel from `scripts/run-dev.mjs` before
 * starting browser tests to avoid hitting zones mid-compile.
 */
import { spawn } from "node:child_process";
import net from "node:net";

import { DEV_ALL_ZONES_READY_SENTINEL } from "./dev-zone-ports.mjs";

const DEFAULT_BASE_URL = "http://localhost:3001";
const READY_SENTINEL = DEV_ALL_ZONES_READY_SENTINEL;
const STARTUP_TIMEOUT_MS = 5 * 60 * 1000;
const EXISTING_SERVER_TIMEOUT_MS = 45 * 1000;

async function isServerReachable(url) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(1500),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForExistingServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerReachable(url)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => {
      resolve(false);
    });
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited via signal ${signal}`));
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} ${args.join(" ")} exited with code ${code}`)
      );
    });
  });
}

function startDevServer() {
  const child = spawn("node", ["scripts/run-dev.mjs"], {
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      // Local smoke tests exercise routing/UI without requiring real service credentials.
      SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION ?? "1",
    },
  });

  const forward = (stream, target) => {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      target.write(chunk);
    });
  };

  forward(child.stderr, process.stderr);

  return child;
}

async function waitForReady(child) {
  let buffered = "";
  child.stdout.setEncoding("utf8");

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timed out waiting ${STARTUP_TIMEOUT_MS}ms for dev readiness sentinel: ${READY_SENTINEL}`
        )
      );
    }, STARTUP_TIMEOUT_MS);

    const onData = (chunk) => {
      process.stdout.write(chunk);
      buffered += chunk;
      if (buffered.includes(READY_SENTINEL)) {
        cleanup();
        resolve();
      } else if (buffered.length > 8000) {
        buffered = buffered.slice(-4000);
      }
    };

    const onExit = (code, signal) => {
      cleanup();
      reject(
        new Error(
          `Dev server exited before readiness (code=${code ?? "null"}, signal=${signal ?? "null"})`
        )
      );
    };

    const cleanup = () => {
      clearTimeout(timeout);
      child.stdout.off("data", onData);
      child.off("exit", onExit);
    };

    child.stdout.on("data", onData);
    child.on("exit", onExit);
  });
}

function stopDevServer(child) {
  if (!child || child.killed || typeof child.pid !== "number") {
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    // Process group already exited.
  }
}

async function main() {
  const explicitBaseUrl = process.env.HELVETY_SMOKE_BASE_URL;
  if (explicitBaseUrl) {
    await runCommand("bunx", ["playwright", "install", "chromium"]);
    await runCommand("bunx", ["playwright", "test"], {
      env: process.env,
    });
    return;
  }

  if (
    await waitForExistingServer(DEFAULT_BASE_URL, EXISTING_SERVER_TIMEOUT_MS)
  ) {
    await runCommand("bunx", ["playwright", "install", "chromium"]);
    await runCommand("bunx", ["playwright", "test"], {
      env: {
        ...process.env,
        HELVETY_SMOKE_BASE_URL: DEFAULT_BASE_URL,
      },
    });
    return;
  }

  if (await isPortOpen(3001)) {
    throw new Error(
      "Port 3001 is already in use, but the gateway never became ready. Stop the conflicting process or pass HELVETY_SMOKE_BASE_URL to reuse an existing healthy dev server."
    );
  }

  const devServer = startDevServer();
  const cleanup = () => stopDevServer(devServer);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    await waitForReady(devServer);
    await runCommand("bunx", ["playwright", "install", "chromium"]);
    await runCommand("bunx", ["playwright", "test"], {
      env: {
        ...process.env,
        HELVETY_SMOKE_BASE_URL: DEFAULT_BASE_URL,
      },
    });
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
