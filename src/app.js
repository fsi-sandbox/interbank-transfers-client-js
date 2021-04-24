/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable import/extensions */

import {
  setupNotifications,
  storage,
  getBankList,
  notify,
  bindInputToDataList,
  getAccountsList,
  initiateTransfer
} from './utils.js';

let banksList = [];
let accountsList = [];
let transactionsList = [];
let transferInProgress = false;

const extractValuePairs = (parent, selector) => [...parent.querySelectorAll(`${selector}`)].map((field) => field.value);

const saveTransactingParties = async (parties) => {
  let allAccounts = await storage.get('accounts');
  if (!allAccounts) {
    allAccounts = [...parties];
    await storage.put({
      key: 'accounts',
      value: allAccounts
    });
    return allAccounts;
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
    await storage.put({
      key: 'accounts',
      value: allAccounts,
      overwrite: true
    });
    return allAccounts;
  }

  return [];
};

const saveTransaction = async (args) => {
  const { amount, fromAccount, toAccount, tnxTime, tnxRef, currency } = args;

  const tnx = {
    amount,
    tnxTime,
    tnxRef,
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
    return allTnxs;
  }

  allTnxs.push(tnx);
  await storage.put({
    key: tnxKey,
    value: allTnxs,
    overwrite: true
  });
  return allTnxs;
};

const transferDetailsAreValid = (opts) => {
  let status = true;
  const { fromAccount, toAccount, fromBank, toBank } = opts;

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

const disableUserInput = ([submitBtn, ...others]) => {
  requestAnimationFrame(() => {
    submitBtn.classList.add('busy');
    submitBtn.setAttribute('disabled', '');
    [...others].forEach((el) => el.setAttribute('readonly', ''));
  });
};

const enableUserInput = ([submitBtn, ...others]) => {
  requestAnimationFrame(() => {
    submitBtn.classList.remove('busy');
    submitBtn.removeAttribute('disabled', '');
    [...others].forEach((el) => el.removeAttribute('readonly', ''));
  });
};

const attemptTransfer = async (event) => {
  event.preventDefault();
  const form = event.target;

  if (transferInProgress) return;

  const amount = form.querySelector('[data-moneyinput]').value;
  const [fromName, toName] = extractValuePairs(form, '[data-nameinput]');
  const [fromBank, toBank] = extractValuePairs(form, '[data-bankinput]');
  const [fromAccount, toAccount] = extractValuePairs(form, '[data-nubaninput]');

  const detailsAreValid = transferDetailsAreValid({
    fromAccount,
    toAccount,
    fromBank,
    toBank
  });

  if (!detailsAreValid) return;

  const transactionReview = `
    You are about to initiate a transfer of NGN ${amount}
    from ${fromName} (${fromAccount} - ${fromBank})
    to ${toName} (${toAccount} - ${toBank})
  `;

  if (confirm(transactionReview)) {
    transferInProgress = true;
    const allInputs = form.querySelectorAll('input');
    const submitBtn = form.querySelector('button');
    disableUserInput([submitBtn, ...allInputs]);

    const responseData = await initiateTransfer({
      amount,
      fromAccount,
      toAccount,
      fromName,
      toName
    });

    if (responseData && responseData.status === 'OK') {
      const { tnxTime, tnxRef, currency } = responseData;
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

      accountsList = await saveTransactingParties(parties);
      transactionsList = await saveTransaction({
        amount,
        fromAccount,
        toAccount,
        tnxTime,
        tnxRef,
        currency
      });
    }

    enableUserInput(submitBtn, ...allInputs);
    transferInProgress = false;
  }
};

const useAllDetailsOnAccountSelection = () => {
  const accountNumberFields = document.querySelectorAll('[data-nubaninput]');
  [...accountNumberFields].forEach((f) => {
    f.addEventListener('change', (event) => {
      const field = event.target;
      const found = accountsList.find((item) => item.account === field.value);
      if (!found) return;

      const { name, bank } = found;
      const commonParent = field.closest('[data-party]');
      commonParent.querySelector('[data-nameinput]').value = name;
      commonParent.querySelector('[data-bankinput]').value = bank;
    });
  });
};

const bankToDatalistOption = (item, option) => {
  const { name, code } = item;
  option.setAttribute('value', name);
  option.setAttribute('data-bankcode', code);
  return option;
};

const savedAccountToDatalistOption = (item, option) => {
  const { name, account, bank } = item;
  option.setAttribute('value', account);
  option.setAttribute('data-bank', bank);
  option.setAttribute('data-name', name);
  // eslint-disable-next-line no-param-reassign
  option.textContent = `${name} - ${bank}`;
  return option;
};

const startApp = async () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', attemptTransfer);

  await bindInputToDataList({
    queryKey: 'banks',
    listSelector: '#banks',
    entryPoint: getBankList,
    boundInputsSelector: '[data-bankinput]',
    listItemTransformer: bankToDatalistOption
  });
  banksList = await storage.get('banks');

  await bindInputToDataList({
    queryKey: 'accounts',
    listSelector: '#accounts',
    entryPoint: getAccountsList,
    boundInputsSelector: '[data-nubaninput]',
    listItemTransformer: savedAccountToDatalistOption
  });
  accountsList = await storage.get('accounts');

  useAllDetailsOnAccountSelection();
  setupNotifications();
};

document.addEventListener('DOMContentLoaded', startApp);
