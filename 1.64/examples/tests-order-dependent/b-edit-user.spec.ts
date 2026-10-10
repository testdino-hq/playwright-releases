import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { DB } from './db';

// The other half. This test quietly assumes `a-create-user` already ran.
// Alphabetical file order makes that true every single time, so the bug
// hides for months, until someone shards the suite, runs this file alone,
// or (1.64) runs with --shuffle.
test('user ada can edit her profile', async () => {
  const db = existsSync(DB) ? JSON.parse(readFileSync(DB, 'utf-8')) : { users: [] };
  expect(db.users, 'this test silently depends on a-create-user.spec.ts').toContain('ada');
});
