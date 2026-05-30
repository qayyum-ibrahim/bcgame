async function login(page) {
  console.log('Navigating directly to signin page...');

  // Use domcontentloaded, not load
  await page.goto('https://bc.game/login/signin', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  }).catch(() => console.log('Navigation event incomplete but continuing...'));

  // Give modal time to appear
  console.log('Waiting for signin modal...');
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: '/tmp/signin-page.png' });

  // Accept cookie if present
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
    console.log('No cookie banner...');
  }

  // Dump all inputs to see what's available
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(el => ({
      type: el.type,
      placeholder: el.placeholder,
      name: el.name,
      id: el.id
    }));
  });
  console.log('Inputs found:', JSON.stringify(inputs, null, 2));

  // Wait for email input using exact placeholder substring
  console.log('Waiting for login form...');
  await page.waitForSelector('input', { timeout: 20000 });

  // Find the email/phone input - use first input that's not password
  const emailInput = await page.evaluateHandle(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    return inputs.find(el => el.type !== 'password') || inputs[0];
  });

  const passwordInput = await page.evaluateHandle(() => {
    return document.querySelector('input[type="password"]');
  });

  if (!emailInput || !passwordInput) {
    throw new Error('Could not find email or password input');
  }

  await emailInput.type(process.env.BCGAME_EMAIL, { delay: 80 });
  console.log('Email entered');

  await passwordInput.type(process.env.BCGAME_PASSWORD, { delay: 80 });
  console.log('Password entered');

  await page.screenshot({ path: '/tmp/before-submit.png' });

  // Click Sign In button by text
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const signIn = btns.find(b => b.textContent.trim().toLowerCase() === 'sign in');
    if (signIn) { signIn.click(); return true; }
    return false;
  });

  if (!clicked) {
    console.log('Sign in button not found, trying Enter...');
    await page.keyboard.press('Enter');
  } else {
    console.log('Sign In button clicked');
  }

  // Handle verification code
  try {
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="Code"], input[placeholder*="verif"]',
      { timeout: 10000 }
    );
    console.log('Verification code required!');
    const readline = require('readline');
    const code = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('Enter verification code: ', (answer) => { rl.close(); resolve(answer.trim()); });
    });
    await page.type(
      'input[placeholder*="code"], input[placeholder*="Code"]',
      code,
      { delay: 80 }
    );
    await page.keyboard.press('Enter');
    console.log('Code submitted');
  } catch {
    console.log('No verification code required, continuing...');
  }

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/after-login.png' });
  console.log('Login flow complete');
}

module.exports = login;
