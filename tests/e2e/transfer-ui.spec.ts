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

    // 4. Re-read balances and assert conservation + delta, not direction.
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);
    const afterBalances = await getAccountBalances(page);

    const beforeTotal =
      beforeBalances[fromId] + beforeBalances[toId];
    const afterTotal =
      afterBalances[fromId] + afterBalances[toId];

    // Total money must be conserved.
    expect(afterTotal).toBe(beforeTotal);

    // One account must change by -amount, the other by +amount (order may flip).
    const deltaFrom = afterBalances[fromId] - beforeBalances[fromId];
    const deltaTo = afterBalances[toId] - beforeBalances[toId];

    expect(Math.abs(deltaFrom)).toBe(amount);
    expect(Math.abs(deltaTo)).toBe(amount);
    expect(deltaFrom).toBe(-deltaTo);

    // 5. Verify transfer history list.
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