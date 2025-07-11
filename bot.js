// bot.js
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import fs from 'fs';

const configPath = './config.json';
let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
let running = true;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function reloadConfig() {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.warn("⚠️ Failed to reload config.json:", e.message);
  }
}

async function sendToDiscord(message) {
  try {
    await fetch(config.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
    console.log("✅ Alert sent to Discord");
  } catch (err) {
    console.error("❌ Failed to send Discord alert:", err);
  }
}

async function extractRefreshSeconds(page, tabName) {
  for (let i = 1; i <= 2; i++) {
    if (!running) return null;

    console.log(`♻️ Refreshing (${i}) before checking timer for ${tabName}...`);
    try {
      await page.goto("https://www.gamersberg.com/grow-a-garden/stock?webpush=true", {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });
      await delay(2000);
    } catch {
      console.warn(`⚠️ Failed to load page on attempt ${i}`);
    }
  }

  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.trim().includes(tabName)) {
        await btn.click();
        break;
      }
    }
    await delay(2000);

    const timeText = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("div"))
        .find(div => div.textContent.includes("Next Refresh In"));
      return el ? el.textContent : "";
    });

    const match = timeText.match(/(\d+)m\s?(\d+)s/);
    if (!match) return null;
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return minutes * 60 + seconds;
  } catch (e) {
    console.warn(`⚠️ Error while reading timer for ${tabName}:`, e.message);
    return null;
  }
}

async function checkTabForItems(page, tabName) {
  try {
    console.log(`🔍 Checking items in ${tabName}...`);
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.trim().includes(tabName)) {
        await btn.click();
        break;
      }
    }

    await delay(2000);
    const bodyText = await page.evaluate(() =>
      document.body.innerText.replace(/\s+/g, ' ').trim()
    );

    const foundItems = config[tabName].filter(item => bodyText.includes(item));
    if (foundItems.length > 0) {
      const message = `🔔 **Rare Items Found in ${tabName}**\n` + foundItems.map(i => `- ${i}`).join("\n");
      await sendToDiscord(message);
    } else {
      console.log(`✅ No rare items found in ${tabName}`);
    }
  } catch (e) {
    console.warn(`⚠️ Error checking items for ${tabName}:`, e.message);
  }
}

async function monitorTab(tabName, delayBufferSec) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  while (running) {
    reloadConfig();

    const seconds = await extractRefreshSeconds(page, tabName);
    if (!running || !seconds) {
      console.warn(`⚠️ Could not read refresh timer for ${tabName}`);
      await delay(60000);
      continue;
    }

    const waitMs = Math.max((seconds - delayBufferSec), 0) * 1000;
    console.log(`🕒 Waiting ${(waitMs / 1000).toFixed(0)}s until ${tabName} reset...`);
    await delay(waitMs);

    if (!running) break;

    await page.goto("https://www.gamersberg.com/grow-a-garden/stock?webpush=true", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await delay(tabName === "Eggs" ? 15000 : 10000);

    await checkTabForItems(page, tabName);
    if (tabName === "Seeds") await checkTabForItems(page, "Gear");
  }

  await browser.close();
  console.log(`🛑 Monitoring stopped for ${tabName}`);
}

export function runBot() {
  console.log("🚀 Bot started.");
  running = true;
  monitorTab("Seeds", 5);
  monitorTab("Eggs", 5);
}

export function stopBot() {
  console.log("🛑 Bot stopping...");
  running = false;
}

export function isRunning() {
  return running;
}

export { reloadConfig };
