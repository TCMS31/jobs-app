/**
 * Drives the running application in a real browser and prints what it observed. Used to
 * verify the authentication and application flows end to end, and to capture the
 * screenshots in docs/screenshots at 1440x900 (desktop) and 390x844 (phone).
 *
 * Prerequisites: the API and the web client both running, a seeded database, and
 * Playwright available:
 *
 *   npm i -g playwright && npx playwright install chromium
 *   WEB_URL=http://localhost:3000 node docs/e2e-walkthrough.js
 *
 * The demo account comes from `prisma db seed`.
 */
const path = require('path');

let chromium;

try {
  ({ chromium } = require('playwright'));
} catch (error) {
  console.error('Playwright is not installed. Run: npm i -g playwright && npx playwright install chromium');
  process.exit(1);
}

const BASE = process.env.WEB_URL || 'http://localhost:3000';
const API = process.env.API_ORIGIN || 'http://localhost:8080';
const SHOTS = process.env.SHOTS_DIR || path.join(__dirname, 'screenshots');
const EMAIL = process.env.DEMO_EMAIL || 'johndoe@example.com';
const PASSWORD = process.env.DEMO_PASSWORD || 'abcd1234';

const step = (name, detail) => console.log(`[${name}] ${detail}`);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const apiRequests = [];
  const consoleErrors = [];

  page.on('request', (r) => {
    if (r.url().startsWith(API)) {
      apiRequests.push({ url: r.url(), authtoken: r.headers().authtoken });
    }
  });
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  // 1. A signed-out visitor cannot reach the listings.
  await page.goto(`${BASE}/jobs`, { waitUntil: 'networkidle' });
  step('route-guard', `GET /jobs while signed out -> ${new URL(page.url()).pathname}`);

  // 2. A wrong password must not let anyone in.
  await page.fill('#email', EMAIL);
  await page.fill('#password', 'wrong-password');
  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="alert"]');
  step(
    'bad-login',
    `message="${(await page.textContent('[role="alert"]')).trim()}" path=${new URL(page.url()).pathname}`
  );
  await page.waitForSelector('button[type="submit"]:not([disabled])');
  await page.screenshot({ path: `${SHOTS}/03-sign-in.png` });

  // 3. Real sign-in.
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Open roles');
  await page.waitForSelector('article');
  step('login', `landed on ${new URL(page.url()).pathname}`);

  const authenticated = apiRequests.filter((r) => r.url.includes('/api/jobs'));

  step(
    'token-header',
    `authenticated calls=${authenticated.length} all carried a token=${authenticated.every((r) => Boolean(r.authtoken))}`
  );

  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/01-job-listings.png` });

  // 4. Apply to the first role this account has not applied to.
  const applyButtons = page.locator('button:has-text("Apply to job")');
  const before = await applyButtons.count();
  const unapplied = page
    .locator('article')
    .filter({ has: page.locator('button:has-text("Apply to job")') })
    .first();
  const title = (await unapplied.locator('h2').textContent()).trim();
  // Re-locate by title: the card stops matching "has an Apply button" the moment it is
  // clicked, so a filter-based locator would drift to a different card.
  const card = page.locator('article').filter({ hasText: title });

  await card.locator('button:has-text("Apply to job")').click();
  await card.locator('button:has-text("Applied")').waitFor();
  step('apply', `"${title}": apply buttons ${before} -> ${await applyButtons.count()}`);
  step('apply-count', `applicants line now: ${(await card.locator('.applicant-count').textContent()).trim()}`);

  // Park the pointer away from the card so the screenshot is not of a hover state.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/02-applied-state.png` });
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: `${SHOTS}/04-job-card-applied.png` });

  // 5. The application must have been recorded server-side, not only in component state.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('text=Open roles');
  const stillApplied = await page
    .locator('article')
    .filter({ hasText: title })
    .locator('button:has-text("Applied")')
    .count();

  step('persistence', `after reload "${title}" still shows Applied = ${stillApplied === 1}`);

  // 6. Signing out clears every credential.
  await page.click('button:has-text("Sign out")');
  await page.waitForSelector('text=Sign in');
  const remaining = (await context.cookies()).filter((c) => ['authtoken', 'userId', 'userName'].includes(c.name));

  step('logout', `path=${new URL(page.url()).pathname} auth cookies remaining=${remaining.length}`);

  // 7. And the protected route is protected again.
  await page.goto(`${BASE}/jobs`, { waitUntil: 'networkidle' });
  step('route-guard-after-logout', `GET /jobs -> ${new URL(page.url()).pathname}`);

  // 8. The same two screens on a phone.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const mobile = await phone.newPage();

  await mobile.goto(`${BASE}/signin`, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: `${SHOTS}/06-mobile-sign-in.png` });
  await mobile.fill('#email', EMAIL);
  await mobile.fill('#password', PASSWORD);
  await mobile.click('button[type="submit"]');
  await mobile.waitForSelector('article');
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: `${SHOTS}/05-mobile-listings.png` });
  step('mobile', `articles rendered at 390px: ${await mobile.locator('article').count()}`);

  step('console', `browser console errors: ${consoleErrors.length === 0 ? 'none' : JSON.stringify(consoleErrors)}`);

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
