/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable import/extensions */

import {
  setupNotifications, storage, getBankList, notify, bindInputToDataList
} from './utils.js';

let banksList = [];

const extractValuePairs = (parent, selector) => [...parent.querySelectorAll(`${selector}`)].map((field) => field.value);

const saveTransactingParties = async (parties) => {
  let allAccounts = await storage.get('accounts');
  if (!allAccounts) {
    allAccounts = [...parties];
    storage.put({
      key: 'accounts',
      value: allAccounts
    });
    return;
  }

  let accountsModified = false;
  parties.forEach(({ account, name, bank }) => {
    const found = allAccounts.find((act) => act.account === account);
    if (!found) {
      allAccounts.push({ account, name, bank });
      accountsModified = true;
    }
  });

  if (accountsModified === true) {
    storage.put({
      key: 'accounts',
      value: allAccounts
    });
  }
};

const saveTransaction = async (args) => {
  const {
    amount, fromAccount, toAccount, tnxTime, currency
  } = args;

  const tnx = {
    amount,
    tnxTime,
    currency,
    toAccount,
    fromAccount
  };

  const tnxKey = 'transactions';
  let allTnxs = await storage.get(tnxKey);
  if (!allTnxs) {
    allTnxs = [tnx];
    storage.put({
      key: tnxKey,
      value: allTnxs
    });
    return;
  }

  allTnxs.push(tnx);
  storage.put({
    key: tnxKey,
    value: []
  });
};

const transferDetailsAreValid = (opts) => {
  let status = true;
  const {
    fromAccount, toAccount, fromBank, toBank
  } = opts;

  if (fromAccount === toAccount) {
    status = false;
    notify('You are attempting to transfer funds between the same account. This is not supported!');
  }

  if (!banksList.find((b) => b.name === fromBank) || !banksList.find((b) => b.name === toBank)) { 
    status = false;
    notify('Pls select from the available list of banks');
  }

  return status;
};

const attemptTransfer = async (event) => {
  event.preventDefault();
  const form = event.target;

  const amount = form.querySelector('[data-moneyinput]').value;
  const [fromName, toName] = extractValuePairs(form, '[data-nameinput]');
  const [fromBank, toBank] = extractValuePairs(form, '[data-bankinput]');
  const [fromAccount, toAccount] = extractValuePairs(form, '[data-nubaninput]');

  if (!transferDetailsAreValid({
    fromAccount, toAccount, fromBank, toBank
  })) return;

  const transactionReview = `
    You are about to initiate a transfer of NGN ${amount}
    from ${fromName} (${fromAccount} - ${fromBank})
    to ${toName} (${toAccount} - ${toBank})
  `;

  if (confirm(transactionReview)) {
    const { status, tnxTime } = await Promise.resolve({ status: 'Done', tnxTime: Date.now() });
    if (status && status === 'Done') {
      const parties = [
        {
          name: fromName,
          bank: fromBank,
          account: fromAccount
        },
        {
          name: toName,
          bank: toBank,
          account: toAccount
        }
      ];

      // saveTransactingParties(parties);
      // saveTransaction({
      //   amount, fromAccount, toAccount, tnxTime, currency: 'NGN'
      // });
    }
  }
};

const startApp = async () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', attemptTransfer);

  await bindInputToDataList({
    queryKey: 'banks',
    listSelector: '#banks',
    entryPoint: getBankList,
    boundInputsSelector: '[data-bankinput]',
    listItemTransformer: (item, opt) => {
      const { name, code } = item;
      opt.setAttribute('value', name);
      opt.setAttribute('data-bankcode', code);
      return opt;
    }
  });

  banksList = await storage.get('banks');

  setupNotifications();
};

document.addEventListener('DOMContentLoaded', startApp);
