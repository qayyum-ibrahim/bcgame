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
  console.log('Navigating directly to signin page...');
  await page.goto('https://bc.game/login/signin', {
    waitUntil: 'load',
    timeout: 60000
  });

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/signin-page.png' });

  // Accept cookie banner if present
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
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

  // Wait for email input directly - no button clicking needed
  console.log('Waiting for login form...');
  await page.waitForSelector(
    'input[type="email"], input[placeholder*="mail"], input[placeholder*="Email"], input[name="email"]',
    { timeout: 20000 }
  );
  console.log('Login form detected...');

  await page.screenshot({ path: '/tmp/signin-form.png' });

  await page.type(
    'input[type="email"], input[placeholder*="mail"], input[placeholder*="Email"], input[name="email"]',
    process.env.BCGAME_EMAIL,
    { delay: 80 }
  );
  await page.type('input[type="password"]', process.env.BCGAME_PASSWORD, { delay: 80 });

  await page.keyboard.press('Enter');
  console.log('Credentials submitted...');

  // Handle verification code if needed
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
      'input[placeholder*="code"], input[placeholder*="verif"], input[placeholder*="Code"]',
      code,
      { delay: 80 }
    );
    await page.keyboard.press('Enter');
    console.log('Verification code submitted...');
  } catch {
    console.log('No verification code required, continuing...');
  }

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/after-login.png' });
  console.log('Login flow complete');
}

module.exports = login;