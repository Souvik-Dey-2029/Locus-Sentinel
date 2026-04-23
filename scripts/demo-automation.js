const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');

  const input = page.locator('input[placeholder*="e.g., Deploy"]');
  const button = page.locator('button:has-text("COMMAND")');

  // FLOW 1: FAILURE
  console.log('Starting Failure Flow...');
  await page.waitForTimeout(2000);
  await input.fill('');
  await page.keyboard.type('Deploy Next.js with Postgres. Simulate database error.', { delay: 50 });
  await page.waitForTimeout(1000);
  await button.click();

  // Wait for rollback
  await page.waitForSelector('text=Rolled Back', { timeout: 30000 });
  console.log('Failure Flow Complete.');
  await page.waitForTimeout(5000);

  // FLOW 2: SUCCESS
  console.log('Starting Success Flow...');
  await input.fill('');
  await page.keyboard.type('Deploy a production Next.js app.', { delay: 50 });
  await page.waitForTimeout(1000);
  await button.click();

  // Wait for success
  await page.waitForSelector('text=Audit Passed', { timeout: 30000 });
  console.log('Success Flow Complete.');
  await page.waitForTimeout(5000);

  console.log('Demo Automation Complete.');
  await browser.close();
})();
