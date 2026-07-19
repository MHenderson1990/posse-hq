function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addInterval(iso, freq) {
  let [y, m, d] = iso.split('-').map(Number);
  let date = new Date(y, m - 1, d);
  if (freq === 'weekly') date.setDate(date.getDate() + 7);
  else if (freq === 'biweekly') date.setDate(date.getDate() + 14);
  else if (freq === 'monthly') date.setMonth(date.getMonth() + 1);
  return toISODate(date);
}

module.exports = { toISODate, addInterval };
