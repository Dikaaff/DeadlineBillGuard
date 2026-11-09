import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const WORK = path.join(ROOT, "demo", "work");
const DATA = path.join(WORK, "data");
const OUT = path.join(ROOT, "docs", "screenshots");
const WIDTH = 1600;
const HEIGHT = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(String(port)));
    });
  });
}

async function startServer(port) {
  const standalone = path.join(ROOT, ".next", "standalone");
  await fs.mkdir(path.join(standalone, ".next"), { recursive: true });
  if (!(await fs.stat(path.join(standalone, ".next", "static")).catch(() => null))) {
    await fs.cp(path.join(ROOT, ".next", "static"), path.join(standalone, ".next", "static"), {
      recursive: true,
    });
  }
  if (!(await fs.stat(path.join(standalone, "public")).catch(() => null))) {
    await fs.cp(path.join(ROOT, "public"), path.join(standalone, "public"), { recursive: true });
  }

  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
    HOSTNAME: "127.0.0.1",
    DBG_DATA_DIR: DATA,
    AUTH_SECRET: "deadline-bill-guard-demo-secret",
  };
  for (const key of [
    "GROQ_API_KEY",
    "GEMINI_API_KEY",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID",
    "RESEND_API_KEY",
  ]) {
    delete env[key];
  }

  const log = await fs.open(path.join(WORK, "server.log"), "w");
  const child = spawn(process.execPath, [".next/standalone/server.js"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", log, log],
  });
  const base = `http://127.0.0.1:${port}`;
  let exited = null;
  child.on("exit", (code) => {
    exited = code;
  });

  for (let attempt = 0; attempt < 90; attempt++) {
    if (exited !== null) throw new Error(`server exited with code ${exited}`);
    try {
      const response = await fetch(base + "/", { signal: AbortSignal.timeout(2000) });
      if (response.ok) return { base, child };
    } catch {
      // not ready yet
    }
    await sleep(1000);
  }
  throw new Error("standalone server did not become ready");
}

async function paidBillId() {
  const db = JSON.parse(await fs.readFile(path.join(DATA, "store.json"), "utf8"));
  const bill = db.bills.find(
    (entry) => entry.merchant?.startsWith("Pacific") && entry.status === "paid",
  );
  if (!bill) throw new Error("no paid PG&E bill in demo/work/data - run the demo recorder first");
  return bill.id;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const port = await freePort();
  const { base, child } = await startServer(port);
  console.log(`server ${base}`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--force-device-scale-factor=1", "--force-color-profile=srgb", "--hide-scrollbars"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1.5,
      colorScheme: "light",
      locale: "en-US",
      timezoneId: "America/Los_Angeles",
    });
    const page = await context.newPage();
    const shoot = async (name, target = page) => {
      await sleep(500);
      await target.screenshot({
        path: path.join(OUT, `${name}.jpg`),
        type: "jpeg",
        quality: 88,
      });
      console.log(`  ${name}.jpg`);
    };

    await page.goto(base + "/", { waitUntil: "networkidle" });
    await page.getByText("Never eat a").first().waitFor();
    await shoot("01-landing");

    await page.goto(base + "/login");
    await page.getByRole("button", { name: "Enter the demo" }).click();
    await page.waitForURL(/\/app\/?$/, { timeout: 30000 });
    await page.getByText("Welcome back").first().waitFor();
    await shoot("02-dashboard");

    await page.goto(base + "/app/inbox");
    await page.getByText("Ingest log", { exact: true }).waitFor();
    await shoot("03-inbox");

    const billId = await paidBillId();
    await page.goto(`${base}/app/bills/${billId}?paypal=success`);
    await page.getByText("Payment captured", { exact: true }).first().waitFor();
    await shoot("04-bill");

    const activity = page
      .getByText("PayPal activity", { exact: true })
      .first()
      .locator("xpath=ancestor::div[@data-slot='card'][1]");
    if (await activity.count()) {
      await activity.scrollIntoViewIfNeeded();
      await shoot("05-paypal-activity", activity);
    }

    await page.goto(base + "/app/subscriptions");
    await page.getByRole("heading", { name: "Subscriptions", level: 1 }).waitFor();
    await shoot("06-subscriptions");

    await page.goto(`${base}/app/bills/bill_pge_oct`);
    await page.getByRole("button", { name: /with PayPal/ }).click();
    await page.waitForURL(/\/app\/checkout\/SIM-/, { timeout: 30000 });
    await page.getByText("Simulated PayPal sandbox", { exact: true }).waitFor();
    await shoot("07-checkout");

    await context.close();
  } finally {
    await browser.close();
    child.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
