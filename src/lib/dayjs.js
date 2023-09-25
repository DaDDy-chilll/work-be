const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');

dayjs.extend(isSameOrBefore);

module.exports = dayjs;
