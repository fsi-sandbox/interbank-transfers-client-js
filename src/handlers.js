let notificationPerm;
// const BACKEND = 'https://airsyms.herokuapp.com';

const notify = (message) => {
  // eslint-disable-next-line no-console
  console.log(message);

  if (notificationPerm !== 'granted') return;

  // eslint-disable-next-line no-new
  new Notification('Status', { body: message, icon: './images/feedback.svg' });
};

export const dummy = () => {};

export const setupNotifications = () => {
  // notify the user about the status of buying airtime or sending SMS
  if (!('Notification' in window)) return;

  Notification.requestPermission((permission) => {
    notificationPerm = permission;
  });
};
