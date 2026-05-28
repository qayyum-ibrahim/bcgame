const readline = require('readline');

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
  await page.goto('https://bc.game', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Wait for page to stabilize
  await new Promise(r => setTimeout(r, 5000));

  // Step 1: Accept cookie banner if present
  try {
    const cookieBtn = await page.$('button');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text.toLowerCase().includes('accept')) {
        await btn.click();
        console.log('Cookie banner accepted');
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }
  } catch {
    console.log('No cookie banner found, continuing...');
  }

  // Take screenshot after cookie dismiss
  await page.screenshot({ path: '/tmp/after-cookie.png', fullPage: false });

  // Step 2: Find login button by text content
  console.log('Looking for login button...');
  const loginClicked = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"], div'));
    const loginBtn = allButtons.find(el => {
      const text = el.textContent.trim().toLowerCase();
      return (text === 'log in' || text === 'login' || text === 'sign in') && text.length < 15;
    });
    if (loginBtn) {
      loginBtn.click();
      return true;
    }
    return false;
  });

  if (!loginClicked) {
    // Dump all buttons for debugging
    const allBtns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a[href], [role="button"]'))
        .map(el => ({ text: el.textContent.trim().slice(0, 30), classes: el.className }))
        .filter(el => el.text.length > 0)
        .slice(0, 30);
    });
    console.log('Could not find login button. All buttons:', JSON.stringify(allBtns, null, 2));
    throw new Error('Login button not found');
  }

  console.log('Login button clicked');
  await new Promise(r => setTimeout(r, 3000));

  // Screenshot after clicking login
  await page.screenshot({ path: '/tmp/after-login-click.png', fullPage: false });

  // Step 3: Wait for email input
  await page.waitForSelector('input[type="email"], input[placeholder*="mail"], input[placeholder*="Email"]', {
    timeout: 15000
  });
  console.log('Login form detected...');

  await page.type('input[type="email"], input[placeholder*="mail"]', process.env.BCGAME_EMAIL, { delay: 80 });
  await page.type('input[type="password"]', process.env.BCGAME_PASSWORD, { delay: 80 });

  await page.screenshot({ path: '/tmp/after-credentials.png', fullPage: false });

  await page.keyboard.press('Enter');
  console.log('Credentials submitted...');

  // Step 4: Handle verification code
  try {
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="verif"], input[placeholder*="Code"]',
      { timeout: 10000 }
    );
    console.log('Verification code required!');
    const code = await waitForInput('Enter the verification code: ');
    await page.type(
      'input[placeholder*="code"], input[placeholder*="verif"], input[placeholder*="Code"]',
      code,
      { delay: 80 }
    );
    await page.keyboard.press('Enter');
    console.log('Verification code submitted...');
  } catch {
    console.log('No verification code required, continuing...');
  }

  // Step 5: Confirm login success
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/after-login.png', fullPage: false });

  try {
    await page.waitForSelector('[class*="balance"], [class*="wallet"], [class*="avatar"], [class*="user"]', {
      timeout: 15000
    });
    console.log('Login successful!');
  } catch {
    console.log('Could not confirm login, proceeding anyway...');
  }
}

module.exports = login;