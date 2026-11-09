import { chromium } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const WORK = path.join(ROOT, "demo", "work");
const VIDEO_DIR = path.join(WORK, "video");
const END = 165.5;

let BASE = process.argv[2] ?? "";
let PORT = "";
let serverProcess = null;

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

async function startServer() {
  const dataDir = path.join(WORK, "data");
  await fs.rm(dataDir, { recursive: true, force: true });

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
    PORT,
    HOSTNAME: "127.0.0.1",
    DBG_DATA_DIR: dataDir,
    AUTH_SECRET: "deadline-bill-guard-demo-secret",
    PAYPAL_MODE: "demo",
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
  let exited = null;
  serverProcess = spawn(process.execPath, [".next/standalone/server.js"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", log, log],
  });
  serverProcess.on("exit", (code) => {
    exited = code;
    log.write(`\n[server exited ${code}]\n`);
  });
  try {
    execFileSync(
      "powershell",
      ["-NoProfile", "-Command", `(Get-Process -Id ${serverProcess.pid}).PriorityClass='High'`],
      { stdio: "ignore" },
    );
  } catch {
    // priority is a nice-to-have; keep recording if it fails
  }

  for (let attempt = 0; attempt < 90; attempt++) {
    if (exited !== null) {
      const text = await fs.readFile(path.join(WORK, "server.log"), "utf8").catch(() => "");
      throw new Error(`server exited (${exited}):\n${text.slice(-2000)}`);
    }
    try {
      const response = await fetch(BASE + "/", { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        log.write(`[ready after ${attempt + 1}s]\n`);
        return;
      }
    } catch {
      // not up yet
    }
    await sleep(1000);
  }
  throw new Error("Next standalone server did not become ready");
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(message) {
  const stamp = new Date().toISOString().slice(11, 19);
  console.log(`[${stamp}] ${message}`);
}

const cursorScript = () => {
  const install = () => {
    if (!document.body || document.getElementById("__dbg_cursor")) return;
    const style = document.createElement("style");
    style.textContent = `
      html { scrollbar-width: none; }
      html::-webkit-scrollbar { display: none; }
      #__dbg_cursor {
        position: fixed; left: 0; top: 0; width: 26px; height: 26px;
        z-index: 2147483647; pointer-events: none; will-change: transform;
        filter: drop-shadow(0 2px 3px rgba(8, 15, 30, 0.45));
      }
      #__dbg_cursor svg { display: block; width: 26px; height: 26px; }
      .__dbg_ripple {
        position: fixed; z-index: 2147483646; pointer-events: none;
        width: 44px; height: 44px; border-radius: 999px;
        border: 2px solid rgba(214, 158, 64, 0.95);
        box-shadow: 0 0 0 4px rgba(214, 158, 64, 0.18);
        transform: translate(-50%, -50%) scale(0.35);
        animation: __dbg_pop 560ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
      }
      @keyframes __dbg_pop {
        to { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      }
    `;
    document.documentElement.appendChild(style);

    const cursor = document.createElement("div");
    cursor.id = "__dbg_cursor";
    cursor.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 2.2 18.6 12l-6.4 1.2 3.7 7.2-2.9 1.4-3.7-7.3L4 19.2Z"
          fill="#0b1220" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;
    document.documentElement.appendChild(cursor);

    window.addEventListener(
      "mousemove",
      (event) => {
        cursor.style.transform = `translate(${event.clientX - 3}px, ${event.clientY - 2}px)`;
      },
      { passive: true },
    );

    window.addEventListener(
      "pointerdown",
      (event) => {
        const ripple = document.createElement("div");
        ripple.className = "__dbg_ripple";
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        document.documentElement.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      },
      true,
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
};

async function main() {
  await fs.mkdir(VIDEO_DIR, { recursive: true });
  for (const file of await fs.readdir(VIDEO_DIR)) {
    if (file.endsWith(".webm")) await fs.unlink(path.join(VIDEO_DIR, file));
  }

  if (!BASE) {
    PORT = await freePort();
    BASE = `http://127.0.0.1:${PORT}`;
  } else {
    PORT = new URL(BASE).port || "3100";
  }
  log(`starting standalone server on ${BASE}`);
  await startServer();

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--force-device-scale-factor=1",
      "--force-color-profile=srgb",
      "--hide-scrollbars",
      "--disable-infobars",
      "--mute-audio",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: { width: 1920, height: 1080 } },
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
    acceptDownloads: true,
  });
  await context.addInitScript(cursorScript);
  const contextStart = Date.now();

  const page = await context.newPage();
  page.on("pageerror", (error) => console.error("pageerror:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("console:", message.text());
  });

  let t0 = 0;
  const at = async (seconds) => {
    const wait = t0 + seconds * 1000 - Date.now();
    if (wait > 0) await sleep(wait);
  };
  const mark = (seconds, label) => {
    const drift = (Date.now() - t0) / 1000 - seconds;
    log(`${seconds.toFixed(1).padStart(6)}s  ${label}${Math.abs(drift) > 0.6 ? `  [drift ${drift.toFixed(2)}s]` : ""}`);
  };

  const moveTo = async (locator) => {
    const box = await locator.first().boundingBox({ timeout: 2500 });
    if (!box) throw new Error("element has no bounding box");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y, { steps: 24 });
    return { x, y };
  };
  const point = async (seconds, locator, label) => {
    await at(seconds);
    const labelText = label ?? "point";
    try {
      await moveTo(locator);
    } catch (error) {
      console.warn(`point failed (${labelText}): ${error.message}`);
    }
    mark(seconds, `point ${labelText}`);
  };
  const click = async (seconds, locator, label) => {
    await at(seconds);
    try {
      await moveTo(locator);
      await sleep(150);
      await locator.click({ timeout: 15000 });
    } catch (error) {
      console.error(`click failed (${label}): ${error.message}`);
      throw error;
    }
    mark(seconds, `click ${label}`);
  };
  const scrollTo = async (seconds, locator, label, block = "center") => {
    await at(seconds);
    const element = await locator.elementHandle();
    if (!element) throw new Error(`no element for scroll: ${label}`);
    await element.evaluate(
      (node, position) => node.scrollIntoView({ behavior: "smooth", block: position }),
      block,
    );
    await sleep(900);
    mark(seconds, `scroll ${label}`);
  };
  const scrollTop = async (seconds, label) => {
    await at(seconds);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(800);
    mark(seconds, `scroll top ${label}`);
  };

  log(`loading ${BASE}`);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.locator("h1").first().waitFor({ timeout: 30000 });
  await sleep(300);
  t0 = Date.now();
  const leadIn = (t0 - contextStart) / 1000;
  log(`hero ready; lead-in ${leadIn.toFixed(2)}s`);

  await point(1.2, page.locator("h1").first(), "hero");
  await point(4.4, page.getByRole("link", { name: "Open the demo" }).first(), "hero cta");

  await scrollTo(8.8, page.locator("#how"), "how it works", "center");
  await point(10.5, page.getByText("Forward the email", { exact: true }), "how step 1");
  await point(13.4, page.getByText("We read the bill", { exact: true }), "how step 2");
  await point(16.0, page.getByText("Pay or get nudged", { exact: true }), "how step 3");

  const headerDemo = page.locator("header").getByRole("link", { name: "Open the demo" });
  await click(18.9, headerDemo, "open demo");
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.getByRole("button", { name: "Enter the demo" }).waitFor({ timeout: 15000 });
  await sleep(400);

  await click(21.7, page.getByRole("button", { name: "Enter the demo" }), "enter demo");
  await page.waitForURL(/\/app$/, { timeout: 20000 });
  await page.getByText("Welcome back,", { exact: false }).first().waitFor({ timeout: 20000 });
  await sleep(900);
  await page.screenshot({ path: path.join(WORK, "frame-dashboard.png") });

  await point(29.4, page.getByText("Welcome back,", { exact: false }).first(), "dashboard");
  await point(33.4, page.getByText("Due in 7 days", { exact: true }), "due stat");
  await point(36.8, page.getByText("Overdue", { exact: true }).first(), "overdue stat");

  await scrollTo(43.2, page.getByText("Reminders queued", { exact: true }), "insights");
  await point(46.0, page.getByText(/sitting\s+idle/).first(), "savings insight").catch(() => {});
  await point(50.2, page.getByText("Reminders queued", { exact: true }), "reminders card");

  await click(55.0, page.getByRole("link", { name: "Inbox", exact: true }), "open inbox");
  await page.getByRole("heading", { level: 1, name: "Inbox" }).waitFor({ timeout: 15000 });
  await sleep(500);
  await page.screenshot({ path: path.join(WORK, "frame-inbox.png") });

  await point(57.2, page.locator("main").getByText("Your forwarding address", { exact: true }), "forward address");
  await point(60.0, page.getByText("Paste an email", { exact: true }), "paste card");

  await click(63.0, page.getByRole("button", { name: /Electric bill/ }), "sample electric");
  await page.getByText(/Sample parsed/i).first().waitFor({ timeout: 20000 });
  await sleep(600);

  await scrollTo(69.0, page.getByText("Ingest log", { exact: true }), "ingest log");
  await point(71.4, page.locator("table tbody tr").first(), "new ingest row");
  await point(74.4, page.locator("table tbody tr").filter({ hasText: "bill" }).first(), "bill badge");

  const ignoredRow = page.locator("table tbody tr").filter({ hasText: "ignored" }).first();
  await point(79.6, ignoredRow, "ignored promo");
  await point(82.2, page.getByText("Result", { exact: true }), "result column");

  const firstOpen = page.locator("table tbody tr").first().getByRole("link", { name: /Open/ });
  await at(86.6);
  await moveTo(firstOpen);
  await sleep(200);
  await click(86.9, firstOpen, "open new bill");
  await page.waitForURL(/\/app\/bills\/(?!new)/, { timeout: 20000 });
  await page.getByRole("heading", { level: 1, name: /Pacific Gas/ }).waitFor({ timeout: 20000 });
  await sleep(700);
  await page.screenshot({ path: path.join(WORK, "frame-bill.png") });

  await point(89.4, page.getByText("Amount due", { exact: true }), "amount due");
  await point(92.0, page.getByText("Extraction confidence", { exact: true }), "confidence");

  await scrollTo(94.4, page.getByText("Source email", { exact: true }), "source email");
  await point(96.6, page.getByText("Source email", { exact: true }), "source title");

  await scrollTop(100.0, "bill top");
  await point(101.6, page.locator("main").getByText("Reminders", { exact: true }).first(), "reminders");
  await point(104.6, page.getByText("One week before", { exact: true }).first(), "H-7").catch(() => {});
  await point(107.0, page.getByText("Due date", { exact: true }).last(), "H-0").catch(() => {});

  const payButton = page.getByRole("button", { name: /Pay \$143 with PayPal/ });
  await point(108.6, payButton, "pay button");
  await click(110.6, payButton, "start paypal");
  await page.waitForURL(/\/app\/checkout\//, { timeout: 20000 });
  await page.getByText("Simulated PayPal sandbox", { exact: true }).waitFor({ timeout: 15000 });
  await sleep(700);
  await page.screenshot({ path: path.join(WORK, "frame-checkout.png") });

  await point(113.4, page.getByText("Amount", { exact: true }).first(), "checkout amount");
  await point(115.4, page.getByText("$142.86", { exact: true }).first(), "checkout total");
  await point(118.4, page.getByRole("button", { name: /Approve payment/ }), "approve");

  await click(120.2, page.getByRole("button", { name: /Approve payment/ }), "approve payment");
  await page.waitForURL(/\/app\/bills\/.*paypal=success/, { timeout: 20000 });
  await page.getByText("Payment captured", { exact: true }).first().waitFor({ timeout: 15000 });
  await sleep(800);
  await page.screenshot({ path: path.join(WORK, "frame-paid.png") });

  await point(124.0, page.getByText("Payment captured", { exact: true }).first(), "captured flash");
  await point(126.0, page.getByText(/Paid /).first(), "paid banner").catch(() => {});

  await at(127.6);
  await page.evaluate(() => {
    if (document.getElementById("demo-scroll-room")) return;
    const main = document.querySelector("#main") ?? document.body;
    const spacer = document.createElement("div");
    spacer.id = "demo-scroll-room";
    spacer.style.height = "420px";
    main.appendChild(spacer);
  });

  await scrollTo(128.4, page.getByText("PayPal activity", { exact: true }), "paypal activity");
  await point(130.0, page.getByText("ORDER.CREATED", { exact: true }).first(), "order created");
  await point(133.4, page.getByText("PAYMENT.CAPTURE.COMPLETED", { exact: true }).first(), "capture completed");
  await point(137.2, page.getByText("Orders, captures and webhook", { exact: false }).first(), "activity blurb").catch(() => {});

  await click(140.4, page.getByRole("link", { name: "Subscriptions", exact: true }), "open subscriptions");
  await page.getByRole("heading", { level: 1, name: "Subscriptions" }).waitFor({ timeout: 15000 });
  await sleep(500);
  await page.screenshot({ path: path.join(WORK, "frame-subscriptions.png") });

  await point(141.6, page.getByText("Recoverable per year", { exact: true }), "recoverable");
  await scrollTo(145.4, page.getByText("Your cancel shortlist", { exact: true }), "shortlist");
  await point(147.2, page.getByText("Your cancel shortlist", { exact: true }), "shortlist title");
  await point(150.0, page.getByText("Spotify Premium", { exact: true }).first(), "spotify row").catch(() => {});

  await click(152.4, page.getByRole("link", { name: "Settings", exact: true }), "open settings");
  await page.getByRole("heading", { level: 1, name: "Settings" }).waitFor({ timeout: 15000 });
  await sleep(500);

  await scrollTo(154.8, page.getByText("Export everything", { exact: true }), "export card");
  await point(156.4, page.getByText("Export everything", { exact: true }), "export title");
  await point(157.4, page.getByRole("link", { name: /Download CSV/ }), "download csv");

  await at(158.6);
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    moveTo(page.getByRole("link", { name: /Download CSV/ })).then(() => sleep(150)).then(() =>
      page.getByRole("link", { name: /Download CSV/ }).click(),
    ),
  ]);
  await download.saveAs(path.join(WORK, "bills-export.csv"));
  mark(158.6, `downloaded ${download.suggestedFilename()}`);

  await at(162.2);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.locator("h1").first().waitFor({ timeout: 30000 });
  mark(162.2, "back to landing");

  await at(END);
  const video = page.video();
  const meta = {
    base: BASE,
    contextStart: new Date(contextStart).toISOString(),
    t0: new Date(t0).toISOString(),
    leadIn: Number(leadIn.toFixed(3)),
    end: END,
    duration: Number((END + 0.5).toFixed(3)),
  };
  await fs.writeFile(path.join(WORK, "meta.json"), JSON.stringify(meta, null, 2));
  await context.close();
  const rawPath = path.join(WORK, "raw.webm");
  await video.saveAs(rawPath);
  await browser.close();
  stopServer();
  log(`wrote ${path.relative(ROOT, rawPath)}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  stopServer();
  process.exit(1);
});
