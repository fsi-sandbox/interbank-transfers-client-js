/* eslint-disable import/extensions */
import { setupNotifications, storage, getBankList } from './utils.js';

const extractValuePairs = (parent, selector) => [...parent.querySelectorAll(`${selector}`)].map((field) => field.value);

const attemptTransfer = (event) => {
  event.preventDefault();
  const form = event.target;

  const amount = form.querySelector('[data-moneyinput]').value;
  const [fromName, toName] = extractValuePairs(form, '[data-nameinput]');
  const [fromBank, toBank] = extractValuePairs(form, '[data-bankinput]');
  const [fromAccount, toAccount] = extractValuePairs(form, '[data-nubaninput]');

  const transactionReview = `
    You are about to initiate a transfer of NGN ${amount}
    from ${fromName} (${fromAccount} - ${fromBank})
    to ${toName} (${toAccount} - ${toBank})
  `;
  if (confirm(transactionReview)) {
    console.log('GO');
  }
};

const startApp = async () => {
  getBankList().then((banks) => {
    if (banks) {
      storage.put({
        key: 'banks',
        value: banks
      });

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

  const form = document.querySelector('form');
  form.addEventListener('submit', attemptTransfer);

  setupNotifications();
};

document.addEventListener('DOMContentLoaded', startApp);
