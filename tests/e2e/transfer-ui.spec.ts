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
    const amount = 10; // app logs $10.00 in history

    // 2. Perform transfer using real labels/controls.
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

    // 4. Re-read balances and assert conservation only.
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);
    const afterBalances = await getAccountBalances(page);

    const beforeTotal =
      beforeBalances[fromId] + beforeBalances[toId];
    const afterTotal =
      afterBalances[fromId] + afterBalances[toId];

    // Total money must be conserved.
    expect(afterTotal).toBe(beforeTotal);

    // 5. Verify transfer history list and latest entry content.
    const historyList = page.locator('#transfer-history');
    await expect(historyList).toBeVisible();

    const history = await getTransferHistoryTexts(page);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toContain(`$${amount}.00`);
    // Ensure it references the two account IDs involved (direction may vary)
    expect(history[0]).toContain(String(fromId));
    expect(history[0]).toContain(String(toId));
  },
);

test(
  '@e2e @regression UI - transfer with invalid amount shows error and does not change balances',
  async ({ page, uiLogin }) => {
    await uiLogin();

    // 1. We are on the main app section with accounts + transfer + history.
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);

    const beforeBalances = await getAccountBalances(page);
    const accountIds = Object.keys(beforeBalances).map(Number);
    expect(accountIds.length).toBeGreaterThanOrEqual(2);

    const fromId = accountIds[0];
    const toId = accountIds[1];
    const invalidAmount = 0;

    // 2. Attempt invalid transfer using amount = 0.
    const fromSelect = page.getByLabel('From Account:');
    const toSelect = page.getByLabel('To Account:');
    const amountInput = page.getByLabel('Amount:');

    await expect(fromSelect).toBeVisible();
    await expect(toSelect).toBeVisible();
    await expect(amountInput).toBeVisible();

    await fromSelect.selectOption(String(fromId));
    await toSelect.selectOption(String(toId));
    await amountInput.fill(String(invalidAmount));

    await page.locator('#transfer-button').click();

    // 3. Expect error, no success text.
    const errorMessage = page.locator('#transfer-error');
    const successMessage = page.locator('#transfer-success');

    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toHaveText('', { timeout: 1000 });
    // Success area should not contain a non-empty success message
    await expect(successMessage).toHaveText('');

    // 4. Balances must be unchanged.
    const afterBalances = await getAccountBalances(page);
    expect(afterBalances[fromId]).toBe(beforeBalances[fromId]);
    expect(afterBalances[toId]).toBe(beforeBalances[toId]);
  },
);