import { test, expectEx as expect } from '../fixtures/bank.fixtures';
import { getAccountBalances, getTransferHistoryTexts } from '../fixtures/bank.fixtures';

test('@e2e @regression UI - user can transfer between own accounts and see updated balances and history', async ({ page, uiLogin }) => {
  await uiLogin();

  // Capture balances before transfer
  const beforeBalances = await getAccountBalances(page);
  const accountIds = Object.keys(beforeBalances).map(Number);
  expect(accountIds.length).toBeGreaterThanOrEqual(2);

  const fromId = accountIds[0];
  const toId = accountIds[1];
  const amount = 15;

  const fromBefore = beforeBalances[fromId];
  const toBefore = beforeBalances[toId];

  // Select accounts in dropdowns
  await page.locator('#from-account').selectOption(String(fromId));
  await page.locator('#to-account').selectOption(String(toId));
  await page.locator('#amount').fill(String(amount));

  // Perform transfer
  await page.getByRole('button', { name: 'Submit Transfer' }).click();

  const success = page.locator('#transfer-success');
  await expect(success).toContainText('Transfer successful');

  // Refresh balances and verify
  const afterBalances = await getAccountBalances(page);

  expect(afterBalances[fromId]).toBe(fromBefore - amount);
  expect(afterBalances[toId]).toBe(toBefore + amount);

  // Verify history entry exists
  const history = await getTransferHistoryTexts(page);
  const match = history.some(h =>
    h.includes(`${fromId} -> ${toId}`) && h.includes(`$${amount.toFixed(2)}`)
  );
  expect(match).toBe(true);
});

test('@e2e @functional UI - transfer fails with insufficient funds and shows error', async ({ page, uiLogin }) => {
  await uiLogin();

  const balances = await getAccountBalances(page);
  const accountIds = Object.keys(balances).map(Number);
  expect(accountIds.length).toBeGreaterThanOrEqual(2);

  const fromId = accountIds[0];
  const toId = accountIds[1];

  const hugeAmount = balances[fromId] + 1_000_000;

  await page.locator('#from-account').selectOption(String(fromId));
  await page.locator('#to-account').selectOption(String(toId));
  await page.locator('#amount').fill(String(hugeAmount));

  await page.getByRole('button', { name: 'Submit Transfer' }).click();

  const error = page.locator('#transfer-error');
  await expect(error).toContainText('Insufficient funds');
});