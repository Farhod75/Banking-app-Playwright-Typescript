import { test, expectEx as expect } from '../fixtures/bank.fixtures';

test('@api @smoke API - login with valid credentials', async ({ apiContext, userAlice }) => {
  const res = await apiContext.post('/api/login', {
    data: {
      username: userAlice.username,
      password: userAlice.password,
    },
  });

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({
    username: userAlice.username,
    name: userAlice.name,
  });
});

test('@api API - login with invalid credentials fails', async ({ apiContext }) => {
  const res = await apiContext.post('/api/login', {
    data: {
      username: 'wrong',
      password: 'nope',
    },
  });

  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toBeDefined();
});

test('@api @regression API - list accounts after login', async ({ apiContext, userAlice }) => {
  // login first to establish session
  const loginRes = await apiContext.post('/api/login', {
    data: {
      username: userAlice.username,
      password: userAlice.password,
    },
  });
  expect(loginRes.status()).toBe(200);

  const res = await apiContext.get('/api/accounts');
  expect(res.status()).toBe(200);
  const accounts = await res.json();

  expect(Array.isArray(accounts)).toBe(true);
  expect(accounts.length).toBeGreaterThan(0);
  for (const acc of accounts) {
    expect(acc).toHaveProperty('id');
    expect(acc).toHaveProperty('type');
    expect(acc).toHaveProperty('balance');
  }
});

test('@api @regression API - successful transfer between user accounts', async ({ apiContext, userAlice }) => {
  // login to get session
  const loginRes = await apiContext.post('/api/login', {
    data: {
      username: userAlice.username,
      password: userAlice.password,
    },
  });
  expect(loginRes.status()).toBe(200);

  // get accounts
  const accRes = await apiContext.get('/api/accounts');
  expect(accRes.status()).toBe(200);
  const accounts = await accRes.json();
  expect(accounts.length).toBeGreaterThanOrEqual(2);

  const from = accounts[0];
  const to = accounts[1];

  const amount = 10;

  const transferRes = await apiContext.post('/api/transfer', {
    data: {
      fromAccountId: from.id,
      toAccountId: to.id,
      amount,
    },
  });

  expect(transferRes.status()).toBe(200);
  const body = await transferRes.json();

  expect(body.status).toBe('SUCCESS');
  expect(body.transfer).toMatchObject({
    fromAccountId: from.id,
    toAccountId: to.id,
    amount,
  });

  // verify transfer appears in history
  const historyRes = await apiContext.get('/api/transfers');
  expect(historyRes.status()).toBe(200);
  const history = await historyRes.json();

  const found = history.some(
    (t: any) =>
      t.fromAccountId === from.id &&
      t.toAccountId === to.id &&
      t.amount === amount
  );
  expect(found).toBe(true);
});

test('@api API - transfer with insufficient funds fails', async ({ apiContext, userAlice }) => {
  const loginRes = await apiContext.post('/api/login', {
    data: {
      username: userAlice.username,
      password: userAlice.password,
    },
  });
  expect(loginRes.status()).toBe(200);

  const accRes = await apiContext.get('/api/accounts');
  expect(accRes.status()).toBe(200);
  const accounts = await accRes.json();
  const from = accounts[0];
  const to = accounts[1];

  const hugeAmount = from.balance + 1_000_000;

  const res = await apiContext.post('/api/transfer', {
    data: {
      fromAccountId: from.id,
      toAccountId: to.id,
      amount: hugeAmount,
    },
  });

  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('Insufficient funds');
});