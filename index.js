require("dotenv").config();
const connectDB = require("./src/db");
const launchBrowser = require("./src/browser");
const login = require("./src/login");
const startScraping = require("./src/scraper");
process.env.TZ = 'Africa/Lagos';

async function main() {
  await connectDB();

  const { browser, page } = await launchBrowser();

  try {
    await login(page);

    console.log("Navigating to crash game...");
    await page.goto("https://bc.game/game/crash", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Give the page a moment to fully render
    await new Promise((r) => setTimeout(r, 5000));

    const diagnostic = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll(
          "div.flex.items-center.justify-center.gap-1.px-2.h-full.cursor-pointer",
        ),
      ).slice(0, 3);

      return items.map((d) => ({
        fullHTML: d.innerHTML,
        fullText: d.textContent.trim(),
      }));
    });

    console.log("=== DIAGNOSTIC 2 ===");
    diagnostic.forEach((item, i) => {
      console.log(`\n--- Item ${i + 1} ---`);
      console.log("Text:", item.fullText);
      console.log("HTML:", item.fullHTML);
    });
    console.log("=== END ===");

    await startScraping(page);

    // Keep alive forever
    await new Promise(() => {});
  } catch (err) {
    console.error("Error:", err);
    await browser.close();
    process.exit(1);
  }
}

main();
