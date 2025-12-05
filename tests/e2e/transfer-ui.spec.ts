import { test, expectEx as expect } from '../fixtures/bank.fixtures';
import { getAccountBalances, getTransferHistoryTexts } from '../fixtures/bank.fixtures';

test('@e2e @regression UI - user can transfer between own accounts and see updated balances and history',
  async ({ page, uiLogin }) => {
    await uiLogin();

    // Navigate to accounts page – this is where the table lives
    await page.getByRole('link', { name: 'Accounts' }).click();
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);

    const beforeBalances = await getAccountBalances(page);
    const accountIds = Object.keys(beforeBalances).map(Number);
    expect(accountIds.length).toBeGreaterThanOrEqual(2);

    const fromId = accountIds[0];
    const toId = accountIds[1];

    // go to transfer page
    await page.getByRole('link', { name: 'Transfer' }).click();

    // perform transfer – assuming UI ids
    await page.locator('#from-account').selectOption(String(fromId));
    await page.locator('#to-account').selectOption(String(toId));
    await page.locator('#amount').fill('50');
    await page.getByRole('button', { name: 'Submit Transfer' }).click();

    // back to accounts, verify balances changed
    await page.getByRole('link', { name: 'Accounts' }).click();
    const afterBalances = await getAccountBalances(page);

    expect(afterBalances[fromId]).toBe(beforeBalances[fromId] - 50);
    expect(afterBalances[toId]).toBe(beforeBalances[toId] + 50);

    // verify transfer history
    await page.getByRole('link', { name: 'Transfers' }).click();
    const history = await getTransferHistoryTexts(page);
    expect(history[0]).toContain(`$50`);
    expect(history[0]).toContain(`${fromId} -> ${toId}`);
  }
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