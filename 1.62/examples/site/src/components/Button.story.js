import { Button } from './Button.js';

// Each named export is one story. Story id = path under src/ (minus `.story.js`)
// + export name → `components/Button/Primary`.

export const Primary = () => Button({ title: 'Submit' });

export const Disabled = () => Button({ title: 'Submit', disabled: true });

// Props come from the test: mount('components/Button/WithTitle', { title: 'Hello' }).
export const WithTitle = ({ title = 'Default' } = {}) => {
  const instance = Button({ title });
  return instance;
};

// The key pattern of the new model: the STORY owns the callback and the state,
// and records the observable outcome into a hidden form. The test never has to
// marshal a function across the Node.js/browser boundary, because it never
// crosses it.
export const CountsClicks = () => {
  const wrapper = document.createElement('div');
  let clicks = 0;

  const record = document.createElement('form');
  record.hidden = true;
  const input = document.createElement('input');
  input.setAttribute('data-testid', 'click-count');
  input.readOnly = true;
  input.value = '0';
  record.append(input);

  const button = Button({
    title: 'Submit',
    onClick: () => { clicks += 1; input.value = String(clicks); },
  });

  wrapper.append(button.el, record);
  return { el: wrapper };
};
