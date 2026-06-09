require('dotenv').config();
process.env.TZ = 'Africa/Lagos';
const connectDB = require('./src/db');
const launchBrowser = require('./src/browser');
const login = require('./src/login');
const startScraping = require('./src/scraper');
const startServer = require('./src/server');

async function run() {
  let browser;
  try {
    const result = await launchBrowser();
    browser = result.browser;
    const page = result.page;

    await login(page);

    console.log('Navigating to crash game...');
    await page.goto('https://bc.game/game/crash', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }).catch(() => console.log('Navigation incomplete, continuing...'));

    await new Promise(r => setTimeout(r, 5000));
    await startScraping(page);

    // Monitor page health - restart if page crashes
    page.on('close', () => {
      console.log('Page closed unexpectedly, restarting...');
      if (browser) browser.close().catch(() => {});
      setTimeout(run, 5000);
    });

    page.on('error', (err) => {
      console.log('Page error:', err.message, '- restarting...');
      if (browser) browser.close().catch(() => {});
      setTimeout(run, 5000);
    });

    await new Promise(() => {});

  } catch (err) {
    console.error('Run error:', err.message);
    if (browser) await browser.close().catch(() => {});
    console.log('Restarting in 10 seconds...');
    setTimeout(run, 10000);
  }
}

async function main() {
  startServer();
  await connectDB();
  run();
}

main();