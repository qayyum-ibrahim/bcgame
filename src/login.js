async function login(page) {
  console.log("Navigating to BC Game homepage...");
  await page
    .goto("https://bc.game", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })
    .catch(() => console.log("Navigation incomplete, continuing..."));

  console.log("Waiting for page to render...");
  await new Promise((r) => setTimeout(r, 15000));

  // Diagnostic - remove after fixing
  const html = await page.content();
  require("fs").writeFileSync("/tmp/debug.html", html);
  await page.screenshot({ path: "/tmp/debug.png", fullPage: false });
  console.log(
    "Button count:",
    await page.evaluate(() => document.querySelectorAll("button").length),
  );
  console.log(
    "Input count:",
    await page.evaluate(() => document.querySelectorAll("input").length),
  );
  console.log(
    "Body text:",
    await page.evaluate(() => document.body.innerText.slice(0, 200)),
  );

  // Accept cookie banner if present
  try {
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate(
        (el) => el.textContent.trim().toLowerCase(),
        btn,
      );
      if (text.includes("accept")) {
        await btn.click();
        console.log("Cookie banner accepted");
        await new Promise((r) => setTimeout(r, 2000));
        break;
      }
    }
  } catch {
    console.log("No cookie banner...");
  }

  // Replace the signInClicked evaluate block with this:
  console.log("Clicking Sign In button...");
  try {
    // Wait for Sign In button to be available
    await page.waitForFunction(
      () => {
        const buttons = Array.from(
          document.querySelectorAll('button[type="button"]'),
        );
        return buttons.some((b) => b.textContent.trim() === "Sign In");
      },
      { timeout: 15000 },
    );

    // Use evaluate just to get position then click via mouse
    const btnPosition = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('button[type="button"]'),
      );
      const signInBtn = buttons.find((b) => b.textContent.trim() === "Sign In");
      if (!signInBtn) return null;
      const rect = signInBtn.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    if (btnPosition) {
      await page.mouse.click(btnPosition.x, btnPosition.y);
      console.log("Sign In clicked via mouse");
    } else {
      throw new Error("Sign In button position not found");
    }
  } catch {
    // Fallback to direct navigation
    console.log("Sign In click failed, navigating directly...");
    await page
      .goto("https://bc.game/login/signin", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      })
      .catch(() => console.log("Direct navigation incomplete, continuing..."));
    await new Promise((r) => setTimeout(r, 10000));
  }

  console.log("Waiting for modal...");
  await new Promise((r) => setTimeout(r, 5000));
  // Wait for any input to appear
  await page.waitForSelector("input", { timeout: 15000 });
  console.log("Login form detected...");

  // Do everything in one evaluate call - much faster
  await page.evaluate(
    (email, password) => {
      const inputs = Array.from(document.querySelectorAll("input"));
      const emailInput = inputs.find((el) => el.type !== "password");
      const passwordInput = inputs.find((el) => el.type === "password");

      if (emailInput) {
        emailInput.focus();
        emailInput.value = email;
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (passwordInput) {
        passwordInput.focus();
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
        passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    process.env.BCGAME_EMAIL,
    process.env.BCGAME_PASSWORD,
  );

  console.log("Credentials entered");
  await new Promise((r) => setTimeout(r, 1000));

  // Click Sign In button inside modal
  const submitted = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const signInBtn = buttons.find((b) => b.textContent.trim() === "Sign In");
    if (signInBtn) {
      signInBtn.click();
      return true;
    }
    return false;
  });

  if (!submitted) {
    await page.keyboard.press("Enter");
  }
  console.log("Credentials submitted...");

  // Handle verification code if needed
  try {
    await page.waitForSelector(
      'input[placeholder*="code"], input[placeholder*="Code"], input[placeholder*="verif"]',
      { timeout: 10000 },
    );
    console.log("Verification code required!");
    const readline = require("readline");
    const code = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Enter verification code: ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
    await page.type(
      'input[placeholder*="code"], input[placeholder*="Code"]',
      code,
      { delay: 80 },
    );
    await page.keyboard.press("Enter");
    console.log("Code submitted");
  } catch {
    console.log("No verification code required, continuing...");
  }

  await new Promise((r) => setTimeout(r, 5000));
  console.log("Login flow complete");
}

module.exports = login;
