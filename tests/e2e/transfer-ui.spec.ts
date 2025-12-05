import {
  test,
  expectEx as expect,
  getAccountBalances,
  getTransferHistoryTexts,
} from '../fixtures/bank.fixtures';

test(
  '@e2e @regression UI - user can transfer between own accounts and see updated balances and history',
  async ({ page, uiLogin }) => {
    await uiLogin();

    // 1. We are on the main app section with accounts + transfer + history.
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);

    const beforeBalances = await getAccountBalances(page);
    const accountIds = Object.keys(beforeBalances).map(Number);
    expect(accountIds.length).toBeGreaterThanOrEqual(2);

    const fromId = accountIds[0];
    const toId = accountIds[1];
    const amount = 10; // app uses $10.00 in history

    // 2. Perform transfer using REAL ids and labels from your HTML.
    const fromSelect = page.getByLabel('From Account:');
    const toSelect = page.getByLabel('To Account:');
    const amountInput = page.getByLabel('Amount:');

    await expect(fromSelect).toBeVisible();
    await expect(toSelect).toBeVisible();
    await expect(amountInput).toBeVisible();

    await fromSelect.selectOption(String(fromId));
    await toSelect.selectOption(String(toId));
    await amountInput.fill(String(amount));

    await page.locator('#transfer-button').click();

    // 3. Wait for success message.
    const successMessage = page.locator('#transfer-success');
    await expect(successMessage).toBeVisible();

    // 4. Re-read accounts table on same page.
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);
    const afterBalances = await getAccountBalances(page);

    expect(afterBalances[fromId]).toBe(beforeBalances[fromId] - amount);
    expect(afterBalances[toId]).toBe(beforeBalances[toId] + amount);

    // 5. Verify transfer history list.
    const historyList = page.locator('#transfer-history');
    await expect(historyList).toBeVisible();

    const history = await getTransferHistoryTexts(page);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toContain(`$${amount}.00`);
    expect(history[0]).toContain(`${fromId} -> ${toId}`);
  },
);

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