let notificationPerm;
const BACKEND = 'http://localhost:8080';

export const initiateTransfer = async (details) => {
  const response = await fetch(`${BACKEND}/inter-bank-transfers`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(details)
  });

  const data = await response.json();
  return data;
};

export const notify = (message) => {
  // eslint-disable-next-line no-console
  console.log(message);

  if (notificationPerm !== 'granted') return;

  // eslint-disable-next-line no-new
  new Notification('Status', { body: message, icon: './images/feedback.svg' });
};

export const setupNotifications = () => {
  // notify the user about the status of of their funds transfer
  if (!('Notification' in window)) return;

  Notification.requestPermission((permission) => {
    notificationPerm = permission;
  });
};

const getFromLocalStorage = async (key) => {
  const value = localStorage.getItem(key);
  if (!value) return undefined;

  return JSON.parse(value);
};

const putIntoLocalStorage = async (opts) => {
  const { key, value, overwrite = false } = opts;

  if (!key) return;

  if (overwrite === true) {
    localStorage.setItem(key, JSON.stringify(value));
    return;
  }

  const existing = await getFromLocalStorage(key);
  if (!existing) {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  }
};

export const storage = {
  get: getFromLocalStorage,
  put: putIntoLocalStorage
};

const dateFormat = new Intl.DateTimeFormat('default', {
  month: 'short',
  day: '2-digit',
  year: 'numeric'
});

const currencyFormat = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

export const showTnxHistory = async () => {
  const dialog = document.querySelector('main dialog');

  const tnxs = await storage.get('transactions');
  dialog.showModal();
  requestAnimationFrame(() => {
    if (tnxs) {
      const list = document.createElement('ol');
      tnxs.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = `
          ${currencyFormat.format(t.amount)} : From 
          ${t.fromAccount} To ${t.toAccount} On ${dateFormat.format(new Date(t.tnxTime))}
        `;
        list.appendChild(li);
      });
      dialog.querySelector('.empty').remove();
      dialog.querySelector('section').appendChild(list);
    }
    // dialog.classList.add('on-screen');
  });
};

const fetchBanks = async () => {
  let banks = await storage.get('banks');
  if (banks) return banks;

  try {
    const response = await fetch(`${BACKEND}/banks`);
    const data = await response.json();
    banks = data.banks;
  } catch (e) {
    console.warn(e);
    banks = undefined;
  }
  return banks;
};

export const getBankList = async () => {
  const banks = await fetchBanks();
  putIntoLocalStorage({
    key: 'banks',
    value: banks
  });

  return banks;
};

export const getAccountsList = async () => storage.get('accounts');

export const bindInputToDataList = async (opts = {}) => {
  const { entryPoint, queryKey, listSelector, boundInputsSelector, listItemTransformer } = opts;

  const data = await (entryPoint() || Promise.resolve());
  if (!data) return;

  storage.put(queryKey, data);

  const dataList = document.querySelector(listSelector);
  const boundInputs = document.querySelectorAll(boundInputsSelector);

  data.forEach((item) => {
    const opt = listItemTransformer(item, document.createElement('option'), dataList);
    dataList.appendChild(opt);
  });

  [...boundInputs].forEach((field) => field.setAttribute('list', queryKey));
};
