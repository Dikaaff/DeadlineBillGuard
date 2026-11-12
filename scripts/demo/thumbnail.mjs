import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const SHOT = path.join(ROOT, "docs", "screenshots", "02-dashboard.jpg");
const OUT = path.join(ROOT, "docs", "thumbnail.jpg");

const WIDTH = 1800;
const HEIGHT = 1200;

const shot = await fs.readFile(SHOT);
const dashboard = `data:image/jpeg;base64,${shot.toString("base64")}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #0a1322;
    --ink-2: #172a48;
    --cream: #f4efe4;
    --brass: #c9882e;
    --slate: #c7d2e2;
    --muted: #8794aa;
  }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(900px 620px at 82% 14%, rgba(201, 136, 46, 0.2), transparent 68%),
      radial-gradient(1100px 900px at 10% 90%, rgba(35, 66, 112, 0.55), transparent 70%),
      linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%);
    color: var(--cream);
    font-family: "Instrument Sans", "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(to right, rgba(244, 239, 228, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(244, 239, 228, 0.05) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(ellipse 82% 74% at 50% 42%, #000 30%, transparent 100%);
  }
  .grain {
    position: absolute; inset: 0; opacity: 0.05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .frame {
    position: absolute; inset: 0;
    padding: 78px 84px 62px;
    display: flex; flex-direction: column;
  }

  header { display: flex; align-items: center; justify-content: space-between; flex: none; }
  .brand { display: flex; align-items: center; gap: 18px; }
  .brand svg { width: 44px; height: 44px; color: var(--cream); }
  .brand .name { font-size: 25px; font-weight: 600; letter-spacing: -0.02em; }
  .brand .sub { margin-top: 5px; font-family: "JetBrains Mono", Consolas, monospace; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
  .event { display: flex; align-items: center; gap: 12px; font-family: "JetBrains Mono", Consolas, monospace; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--slate); }
  .event i { width: 9px; height: 9px; border-radius: 99px; background: var(--brass); box-shadow: 0 0 0 5px rgba(201, 136, 46, 0.16); }

  .hero { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 40px; }
  .copy { width: 750px; flex: none; }
  .eyebrow { display: flex; align-items: center; gap: 16px; font-family: "JetBrains Mono", Consolas, monospace; font-size: 13.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--brass); }
  .eyebrow::after { content: ""; width: 84px; height: 1px; background: rgba(201, 136, 46, 0.55); }
  h1 { margin-top: 26px; font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: 138px; line-height: 0.9; letter-spacing: -0.025em; }
  h1 em { font-style: italic; color: #eadfc8; }
  .rule { margin-top: 34px; width: 128px; height: 3px; background: var(--brass); }
  .sub { margin-top: 28px; width: 620px; font-size: 30px; line-height: 1.42; color: var(--slate); letter-spacing: -0.01em; }
  .sub b { color: var(--cream); font-weight: 500; }

  .art { width: 890px; flex: none; transform: rotate(-1.4deg); margin-top: -6px; }
  .shot {
    position: relative; border-radius: 18px; overflow: hidden;
    border: 1px solid rgba(244, 239, 228, 0.18);
    box-shadow: 0 70px 140px rgba(2, 6, 14, 0.62), 0 18px 44px rgba(2, 6, 14, 0.45);
  }
  .shot img { display: block; width: 100%; height: auto; }
  .shot::after {
    content: ""; position: absolute; inset: 0; border-radius: 18px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  .caption { margin-top: 20px; display: flex; align-items: center; gap: 14px; font-family: "JetBrains Mono", Consolas, monospace; font-size: 12.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
  .caption::before { content: ""; width: 26px; height: 1px; background: rgba(201, 136, 46, 0.7); }
  .caption b { color: var(--slate); font-weight: 400; }

  .steps {
    flex: none; display: grid; grid-template-columns: repeat(4, 1fr); gap: 44px;
    border-top: 1px solid rgba(244, 239, 228, 0.14); padding-top: 30px; margin-bottom: 36px;
  }
  .step { display: flex; gap: 16px; align-items: flex-start; }
  .step span { margin-top: 4px; font-family: "JetBrains Mono", Consolas, monospace; font-size: 12.5px; color: var(--brass); }
  .step p { font-size: 16px; line-height: 1.45; color: var(--muted); }
  .step p b { display: block; margin-bottom: 3px; font-size: 19px; font-weight: 500; color: var(--cream); letter-spacing: -0.01em; }

  footer { flex: none; display: flex; align-items: center; justify-content: space-between; font-family: "JetBrains Mono", Consolas, monospace; font-size: 13px; color: var(--muted); letter-spacing: 0.04em; }
  footer .repo { color: #8fb8ff; }
  footer .stack { display: flex; gap: 26px; }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="grain"></div>
  <div class="frame">
    <header>
      <div class="brand">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.4 20 5.4v6.3c0 4.9-3.4 8.8-8 10-4.6-1.2-8-5.1-8-10V5.4l8-3Z" fill="currentColor" opacity="0.1"/>
          <path d="M12 2.4 20 5.4v6.3c0 4.9-3.4 8.8-8 10-4.6-1.2-8-5.1-8-10V5.4l8-3Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8.1 11.9h2.6l1.4 2.4 1.5-4.6 1.3 2.2h1.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div>
          <div class="name">Deadline Bill Guard</div>
          <div class="sub">AI bill inbox</div>
        </div>
      </div>
      <div class="event"><i></i>Build What&rsquo;s Next &middot; PayPal &times; AI</div>
    </header>

    <div class="hero">
      <div class="copy">
        <div class="eyebrow">Forward it. Forget it.</div>
        <h1>Never miss<br/><em>another bill.</em></h1>
        <div class="rule"></div>
        <p class="sub">Turn forwarded invoices into <b>payable bills</b> &mdash; extracted by AI, chased by reminders, settled with <b>PayPal</b>.</p>
      </div>

      <div class="art">
        <div class="shot"><img src="${dashboard}" alt="Deadline Bill Guard dashboard" /></div>
        <div class="caption"><b>One screen for every deadline</b></div>
      </div>
    </div>

    <div class="steps">
      <div class="step"><span>01</span><p><b>Forward or paste</b>Any invoice email</p></div>
      <div class="step"><span>02</span><p><b>AI extraction</b>Groq + Gemini, Zod-validated</p></div>
      <div class="step"><span>03</span><p><b>Reminder ladder</b>7, 3, 1, 0 days before</p></div>
      <div class="step"><span>04</span><p><b>One-click payment</b>PayPal Orders v2</p></div>
    </div>

    <footer>
      <span class="repo">github.com/Dikaaff/DeadlineBillGuard</span>
      <span class="stack"><span>Next.js 16</span><span>Groq + Gemini</span><span>Resend</span><span>PayPal</span></span>
    </footer>
  </div>
</body>
</html>`;

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--force-color-profile=srgb", "--hide-scrollbars"],
});

try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1.5,
  });
  await page.setContent(html, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT, type: "jpeg", quality: 92 });
  console.log(OUT);
} finally {
  await browser.close();
}

process.exit(0);
