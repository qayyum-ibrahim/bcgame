require('dotenv').config();
process.env.TZ = 'Africa/Lagos';

const connectDB = require('./src/db');
const launchBrowser = require('./src/browser');
const login = require('./src/login');
const startScraping = require('./src/scraper');
const startServer = require('./src/server');

async function main() {
  startServer();
  await connectDB();

  const { browser, page } = await launchBrowser();

  // Catch unhandled crashes
  process.on('uncaughtException', async (err) => {
    console.error('Uncaught exception:', err.message);
    console.error(err.stack);
    await browser.close();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled rejection:', reason);
    await browser.close();
    process.exit(1);
  });

  try {
    await login(page);

    console.log('Navigating to crash game...');
    await page.goto('https://bc.game/game/crash', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 5000));
    await startScraping(page);
    await new Promise(() => {});

  } catch (err) {
    console.error('Main error:', err.message);
    console.error(err.stack);
    await browser.close();
    process.exit(1);
  }
}

main();