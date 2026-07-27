import { test, expect } from '@playwright/test';

// update() re-renders the SAME story with new props, without navigating and
// without remounting, so component-internal state survives. That is what the
// gallery's "reuse the root" rule buys you.

test('update() changes props and preserves internal state', async ({ mount }) => {
  const component = await mount('components/Counter/Default', { step: 1 });
  await expect(component.getByTestId('value')).toHaveText('1');

  // Build up some internal state that props know nothing about.
  await component.getByRole('button', { name: 'Increment' }).click();
  await component.getByRole('button', { name: 'Increment' }).click();
  await expect(component.getByTestId('clicks')).toHaveText('2');

  // New props, same instance.
  await component.update({ step: 5 });
  await expect(component.getByTestId('value')).toHaveText('5');

  // The click count survived. A remount would have reset it to 0.
  await expect(component.getByTestId('clicks')).toHaveText('2');
});

test('a fresh mount() does reset state', async ({ mount }) => {
  const component = await mount('components/Counter/Default', { step: 1 });
  await component.getByRole('button', { name: 'Increment' }).click();
  await expect(component.getByTestId('clicks')).toHaveText('1');

  // Each mount() navigates, so this is a genuinely clean slate.
  const remounted = await mount('components/Counter/Default', { step: 1 });
  await expect(remounted.getByTestId('clicks')).toHaveText('0');
});

test('unmount() tears the story down', async ({ mount }) => {
  const component = await mount('components/Counter/Default', { step: 3 });
  await expect(component.getByTestId('value')).toBeVisible();

  await component.unmount();
  await expect(component.getByTestId('value')).toHaveCount(0);
});

test('an unknown story rejects with a real error', async ({ mount }) => {
  const error = await mount('components/Counter/NoSuchStory').catch(e => e as Error);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toContain('Unknown story');
});
