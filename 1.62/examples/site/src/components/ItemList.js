// Fetches on mount, so tests can exercise page.route() against a component.
export function ItemList() {
  const el = document.createElement('div');
  const list = document.createElement('ul');
  const alert = document.createElement('div');
  alert.setAttribute('role', 'alert');
  alert.hidden = true;
  el.append(list, alert);

  fetch('/api/items')
    .then(response => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(({ items }) => {
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item;
        list.append(li);
      }
    })
    .catch(() => {
      alert.hidden = false;
      alert.textContent = 'Something went wrong';
    });

  return { el };
}
