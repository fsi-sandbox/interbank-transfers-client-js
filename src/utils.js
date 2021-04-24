let notificationPerm;
const BACKEND = 'http://localhost:8080';

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

const fetchBanks = async () => {
  let banks;
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
  const banks = (await storage.get('banks')) || (await fetchBanks());
  putIntoLocalStorage({
    key: 'banks',
    value: banks
  });

  return banks;
};
