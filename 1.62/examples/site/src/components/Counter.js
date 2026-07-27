// A component with internal state, so `component.update(props)` has something
// to preserve: the click count survives a prop change, a remount would reset it.
export function Counter({ step = 1 } = {}) {
  const el = document.createElement('div');
  let clicks = 0;
  let current = step;

  const value = document.createElement('span');
  value.setAttribute('data-testid', 'value');

  const clickCount = document.createElement('span');
  clickCount.setAttribute('data-testid', 'clicks');

  const button = document.createElement('button');
  button.textContent = 'Increment';
  button.addEventListener('click', () => {
    clicks += 1;
    clickCount.textContent = String(clicks);
  });

  const render = () => {
    value.textContent = String(current);
    clickCount.textContent = String(clicks);
  };
  render();
  el.append(value, clickCount, button);

  return {
    el,
    update({ step: nextStep } = {}) {
      if (nextStep !== undefined) current = nextStep;
      render();
    },
  };
}
