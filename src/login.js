const readline = require('readline');

// Helper to pause and wait for manual input (verification code)
function waitForInput(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function login(page) {
  console.log('Navigating to BC Game...');
  await page.goto('https://bc.game', { waitUntil: 'domcontentloaded', timeout: 60000 });

// Take screenshot to see what page looks like on Render
await page.screenshot({ path: '/tmp/bcgame-page.png', fullPage: true });

// Dump all buttons and clickable elements
const elements = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
  return buttons.map(b => ({
    tag: b.tagName,
    classes: b.className,
    text: b.textContent.trim().slice(0, 30)
  })).filter(b => b.text.length > 0).slice(0, 20);
});
console.log('=== PAGE ELEMENTS ===');
console.log(JSON.stringify(elements, null, 2));
console.log('=== END ===');

  // Click login button
  console.log('Looking for login button...');
  await page.waitForSelector('[class*="login"], button[class*="sign"]', { timeout: 15000 });
  await page.click('[class*="login"], button[class*="sign"]');

  // Wait for login modal/form
  await page.waitForSelector('input[type="email"], input[placeholder*="mail"]', { timeout: 15000 });
  console.log('Login form detected...');

  // Enter email
  await page.type('input[type="email"], input[placeholder*="mail"]', process.env.BCGAME_EMAIL, { delay: 80 });

  // Enter password
  await page.type('input[type="password"]', process.env.BCGAME_PASSWORD, { delay: 80 });

  // Submit
  await page.keyboard.press('Enter');
  console.log('Credentials submitted...');

  // Check if verification code is needed
  try {
    await page.waitForSelector('input[placeholder*="code"], input[placeholder*="verif"]', { timeout: 10000 });
    console.log('Verification code required!');

    const code = await waitForInput('Enter the verification code sent to your email/phone: ');

    await page.type('input[placeholder*="code"], input[placeholder*="verif"]', code, { delay: 80 });
    await page.keyboard.press('Enter');
    console.log('Verification code submitted...');
  } catch {
    console.log('No verification code required, continuing...');
  }

  // Wait for successful login (balance element usually appears)
  try {
    await page.waitForSelector('[class*="balance"], [class*="wallet"]', { timeout: 20000 });
    console.log('Login successful!');
  } catch {
    console.log('Login may have succeeded, proceeding anyway...');
  }
}

module.exports = login;