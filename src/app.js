/* eslint-disable import/extensions */
import { setupNotifications } from './handlers.js';

const startApp = () => {
  setupNotifications();
};

document.addEventListener('DOMContentLoaded', startApp);
