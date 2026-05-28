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

  // Wait for React to mount and render UI
  console.log('Waiting for React to render...');
  await page.waitForFunction(
    () => document.querySelectorAll('button').length > 2,
    { timeout: 30000 }
  );
  console.log('Page rendered');

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: '/tmp/bcgame-page.png' });

  // Dump buttons for visibility
  const allBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .map(el => ({ text: el.textContent.trim().slice(0, 30), classes: el.className }))
      .filter(el => el.text.length > 0)
      .slice(0, 30);
  });
  console.log('Buttons found:', JSON.stringify(allBtns, null, 2));

  // Accept cookie banner
  try {
    for (const btn of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent.trim().toLowerCase(), btn);
      if (text.includes('accept')) {
        await btn.click();
        console.log('Cookie banner accepted');
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }
  } catch {
    console.log('No cookie banner, continuing...');
  }

  // Find login button by text
  console.log('Looking for login button...');
  const loginClicked = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, a, [role="button"], div, span'));
    const loginBtn = all.find(el => {
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
    await page.screenshot({ path: '/tmp/login-failed.png' });
    throw new Error('Login button not found');
  }

  console.log('Login button clicked');
  await new Promise(r => setTimeout(r, 3000));

  // Rest of login flow stays the same...
  await page.waitForSelector(
    'input[type="email"], input[placeholder*="mail"], input[placeholder*="Email"]',
    { timeout: 15000 }
  );
  console.log('Login form detected...');

  await page.type(
    'input[type="email"], input[placeholder*="mail"]',
    process.env.BCGAME_EMAIL,
    { delay: 80 }
  );
  await page.type('input[type="password"]', process.env.BCGAME_PASSWORD, { delay: 80 });
  await page.keyboard.press('Enter');
  console.log('Credentials submitted...');

  try {
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="verif"], input[placeholder*="Code"]',
      { timeout: 10000 }
    );
    console.log('Verification code required!');
    const readline = require('readline');
    const code = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('Enter verification code: ', (answer) => { rl.close(); resolve(answer.trim()); });
    });
    await page.type(
      'input[placeholder*="code"], input[placeholder*="verif"]',
      code,
      { delay: 80 }
    );
    await page.keyboard.press('Enter');
  } catch {
    console.log('No verification code required, continuing...');
  }

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/after-login.png' });
  console.log('Login flow complete');
}

module.exports = login;