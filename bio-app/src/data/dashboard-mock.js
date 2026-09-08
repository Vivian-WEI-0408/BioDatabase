import { apps } from './apps.js';
import { notifications as allNotifications } from './notifications-mock.js';

export const appCards = apps.map(({ id, title, description, icon, route }) => ({
  id,
  title,
  description,
  icon,
  route,
}));

export const notifications = allNotifications.slice(0, 3);

export const todos = [
  { id: 1, text: 'Complete your basic information.', done: false },
  { id: 2, text: 'Start a new T-Pro computation task.', done: false, highlight: 'T-Pro' },
  { id: 3, text: 'Start a new TPlot computation task.', done: false, highlight: 'TPlot' },
  { id: 4, text: 'Share a computation task.', done: false },
  { id: 5, text: 'Share a datasets.', done: true },
];

export const taskStats = {
  dates: ['11/01', '11/02', '11/03', '11/04', '11/05', '11/06', '11/07', '11/08', '11/09', '11/10'],
  values: [32, 45, 38, 52, 41, 48, 55, 62, 58, 70],
};

export const storage = {
  usedPercent: 30,
  availablePercent: 70,
  totalMB: 1024,
};
