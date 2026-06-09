const isLocal = process.env.NODE_ENV === "development";

async function launchBrowser() {
  let browser;

  if (isLocal) {
    const puppeteer = require("puppeteer");
    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--mute-audio",
        "--no-first-run",
      ],
    });
  } else {
    const puppeteer = require("puppeteer-core");
    const chromium = require("@sparticuz/chromium");
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--mute-audio",
        "--no-first-run",
        "--single-process",
        "--js-flags=--max-old-space-size=128",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const page = await browser.newPage();

  // Only block resources on Render to save memory
  if (!isLocal) {
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  return { browser, page };
}

module.exports = launchBrowser;
