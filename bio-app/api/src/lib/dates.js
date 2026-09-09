const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(value.toString().replace(' ', 'T'));
}

function formatTaskDate(value) {
  const date = toDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

function formatNotificationTime(value) {
  const date = toDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';

  hours %= 12;

  if (hours === 0) {
    hours = 12;
  }

  return `${date.getDate().toString().padStart(2, '0')} ${MONTHS[date.getMonth()]}, ${date.getFullYear()} ${hours}.${minutes}${period}`;
}

function formatAppDate(value) {
  const date = toDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (number) => number.toString().padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

function formatTaskDisplayId(id) {
  return String(id).padStart(4, '0');
}

function formatTaskCount(count) {
  if (count >= 1000) {
    const value = (count / 1000).toFixed(1).replace(/\.0$/, '');
    return `${value}k Tasks`;
  }

  return `${count} Task${count === 1 ? '' : 's'}`;
}

module.exports = {
  formatAppDate,
  formatNotificationTime,
  formatTaskCount,
  formatTaskDate,
  formatTaskDisplayId,
  toDate,
};
