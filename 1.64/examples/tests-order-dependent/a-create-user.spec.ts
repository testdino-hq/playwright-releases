import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { DB } from './db';

// One half of a hidden dependency. This file creates a user in a shared
// "database" (a JSON file standing in for your real staging DB) and never
// cleans up. Nothing in this file is wrong on its own.
test('admin creates user ada', async () => {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(DB, JSON.stringify({ users: ['ada'] }));
  expect(true).toBe(true);
});
