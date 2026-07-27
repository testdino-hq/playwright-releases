// A plain-DOM "component". Any framework works: the gallery is the only
// framework-specific file, and you own it.
export function Button({ title = 'Submit', disabled = false, onClick } = {}) {
  const el = document.createElement('button');
  el.textContent = title;
  el.disabled = disabled;
  if (onClick) el.addEventListener('click', onClick);
  return {
    el,
    update(props) {
      if (props.title !== undefined) el.textContent = props.title;
      if (props.disabled !== undefined) el.disabled = props.disabled;
    },
  };
}
