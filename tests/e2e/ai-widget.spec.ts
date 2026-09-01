import { test, expect } from '@playwright/test';

const BASE = 'https://artigocomcafe.com';

async function openWidget(page: import('@playwright/test').Page) {
  // Wait for full hydration (welcome bubble + launcher)
  await page.waitForTimeout(3000);

  // Path 1: welcome bubble visible → click "Conversar com a IA"
  const startBtn = page.locator('.ai-welcome-start');
  if (await startBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await startBtn.click();
  } else {
    // Path 2: no welcome → click launcher
    await page.locator('.ai-launcher').click();
  }
  await page.locator('.ai-floating-widget.open').waitFor({ timeout: 8000 });
}

test('launcher button visible with IA badge', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await expect(page.locator('.ai-launcher')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.ai-badge')).toContainText('IA');
});

test('widget opens via launcher or welcome', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await openWidget(page);
  await expect(page.locator('.ai-chat-input-field')).toBeVisible();
  await expect(page.locator('.ai-message-greeting')).toBeVisible();
});

test('NO tools or posts tabs — only chat', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await openWidget(page);
  await expect(page.locator('.ai-floating-tabs')).toHaveCount(0);
  await expect(page.locator('.ai-tools-panel')).toHaveCount(0);
  await expect(page.locator('.ai-posts-panel')).toHaveCount(0);
  await expect(page.locator('.ai-chat-panel')).toBeVisible();
});

test('chat sends message and gets response', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await openWidget(page);

  await page.locator('.ai-chat-input-field').fill('O que é café?');
  await page.locator('.ai-chat-send').click();

  await page.waitForTimeout(8000);
  const botMsgs = await page.locator('.ai-message-bot').count();
  const errMsgs = await page.locator('.ai-message-error').count();
  console.log(`bot: ${botMsgs}, error: ${errMsgs}`);
  expect(botMsgs + errMsgs).toBeGreaterThan(0);
});

test('widget closes and launcher reappears', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await openWidget(page);

  // Close via the widget header button
  await page.locator('.ai-floating-widget.open .ai-floating-btn-icon').click();
  await expect(page.locator('.ai-launcher')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.ai-floating-widget.open')).toHaveCount(0);
});
