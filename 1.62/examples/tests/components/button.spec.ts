import { test, expect } from '@playwright/test';

// (1.62) Component testing, new model. Note what is NOT here:
//   - no import from @playwright/experimental-ct-react
//   - no JSX in the test
//   - no ctViteConfig
// `test` and `expect` come from plain @playwright/test, and `mount` is a
// built-in fixture that navigates to your gallery and renders a story by id.

test('renders the primary story', async ({ mount }) => {
  const component = await mount('components/Button/Primary');
  await expect(component.getByRole('button')).toHaveText('Submit');
});

test('renders the disabled story', async ({ mount }) => {
  const component = await mount('components/Button/Disabled');
  await expect(component.getByRole('button')).toBeDisabled();
});

// Any unique trailing suffix of the id resolves, so specs stay short.
test('a short story id resolves', async ({ mount }) => {
  const component = await mount('Button/Primary');
  await expect(component.getByRole('button')).toBeVisible();
});

// Plain serializable props are passed from the test. Callbacks are NOT:
// they belong inside the story.
test('per-test props', async ({ mount }) => {
  const component = await mount('components/Button/WithTitle', { title: 'Hello' });
  await expect(component.getByRole('button')).toHaveText('Hello');
});

// The pattern that replaces `mount(<Button onClick={spy} />)`: the story owns
// the callback and records what happened into a hidden input, and the test
// asserts on that with a retrying web-first assertion.
test('counts clicks without marshalling a callback', async ({ mount }) => {
  const component = await mount('components/Button/CountsClicks');

  await component.getByRole('button').click();
  await component.getByRole('button').click();

  await expect(component.getByTestId('click-count')).toHaveValue('2');
});

// mount() returns a Locator, so screenshot the component, not the page.
test('visual baseline of a single story', async ({ mount }) => {
  const component = await mount('components/Button/Primary');
  await expect(component).toHaveScreenshot('button-primary.webp');
});
