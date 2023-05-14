const appConstants = require('./app');
const userConstants = require('./user');
const documentConstants = require('./document');

module.exports = Object.assign(
  {},
  appConstants,
  userConstants,
  documentConstants
);
