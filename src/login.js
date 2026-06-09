async function login(page) {
  console.log('Navigating to BC Game homepage...');
  await page.goto('https://bc.game', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  }).catch(() => console.log('Navigation incomplete, continuing...'));

  // Wait for React to render
  console.log('Waiting for page to render...');
  await page.waitForFunction(
    () => document.querySelectorAll('button').length > 2,
    { timeout: 30000 }
  );

  await new Promise(r => setTimeout(r, 3000));

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
    console.log('No cookie banner...');
  }

  // Click Sign In button by exact class and text
  console.log('Clicking Sign In button...');
  const signInClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
    const signInBtn = buttons.find(b => b.textContent.trim() === 'Sign In');
    if (signInBtn) {
      signInBtn.click();
      return true;
    }
    return false;
  });

  if (!signInClicked) {
    throw new Error('Sign In button not found');
  }

  console.log('Sign In clicked, waiting for modal...');
  await new Promise(r => setTimeout(r, 3000));

  // Wait for any input to appear (email has empty placeholder)
  await page.waitForSelector('input', { timeout: 15000 });
  console.log('Login form detected...');

  // Email is first input, password is input[type="password"]
  const inputs = await page.$$('input');
  
  // Find email input - first input that is NOT password type
  let emailInput = null;
  for (const input of inputs) {
    const type = await page.evaluate(el => el.type, input);
    if (type !== 'password') {
      emailInput = input;
      break;
    }
  }

  const passwordInput = await page.$('input[type="password"]');

  if (!emailInput || !passwordInput) {
    throw new Error('Could not find email or password inputs');
  }

  await emailInput.click();
  await emailInput.type(process.env.BCGAME_EMAIL, { delay: 80 });
  console.log('Email entered');

  await passwordInput.click();
  await passwordInput.type(process.env.BCGAME_PASSWORD, { delay: 80 });
  console.log('Password entered');

  // Click Sign In button inside modal
  const submitted = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInBtn = buttons.find(b => b.textContent.trim() === 'Sign In');
    if (signInBtn) {
      signInBtn.click();
      return true;
    }
    return false;
  });

  if (!submitted) {
    await page.keyboard.press('Enter');
  }
  console.log('Credentials submitted...');

  // Handle verification code if needed
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
  console.log('Login flow complete');
}

module.exports = login;