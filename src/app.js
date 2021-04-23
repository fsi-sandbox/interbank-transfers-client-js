/* eslint-disable import/extensions */
import { setupNotifications, storage, getBankList } from './handlers.js';

const startApp = async () => {
  getBankList().then((banks) => {
    console.log('IN');
    if (banks) {
      storage.put('banks', banks);

      const bankDataList = document.querySelector('#banks');
      const bankInputs = document.querySelectorAll('[data-bankinput]');

      banks.forEach(({ name, code }) => {
        const opt = document.createElement('option');
        opt.setAttribute('value', name);
        opt.setAttribute('data-bankcode', code);
        bankDataList.appendChild(opt);
      });

      [...bankInputs].forEach((field) => field.setAttribute('list', 'banks'));
    }
  });

  setupNotifications();
};

document.addEventListener('DOMContentLoaded', startApp);
