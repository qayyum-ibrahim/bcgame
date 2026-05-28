require('dotenv').config();
process.env.TZ = 'Africa/Lagos';

const connectDB = require('./src/db');
const launchBrowser = require('./src/browser');
const login = require('./src/login');
const startScraping = require('./src/scraper');
const startServer = require('./src/server');

async function main() {
  // Start health server first so Render sees it immediately
  startServer();

  await connectDB();

  const { browser, page } = await launchBrowser();

  try {
    await login(page);

    console.log('Navigating to crash game...');
    await page.goto('https://bc.game/game/crash', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 5000));

    await startScraping(page);

    await new Promise(() => {});

  } catch (err) {
    console.error('Error:', err);
    await browser.close();
    process.exit(1);
  }
}

main();