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
    waitUntil: 'load',
    timeout: 60000
  });

  // Wait fixed time instead of waiting for buttons
  await new Promise(r => setTimeout(r, 8000));

  // Screenshot immediately
  await page.screenshot({ path: '/tmp/bcgame-page.png' });

  // Check button count and page title
  const diagnostics = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      buttonCount: document.querySelectorAll('button').length,
      bodyText: document.body.innerText.slice(0, 300),
      scripts: Array.from(document.scripts).length
    };
  });

  console.log('=== PAGE DIAGNOSTICS ===');
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log('========================');

  // Rest of login code below...

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