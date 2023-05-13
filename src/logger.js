const winston = require('winston');
const { combine, timestamp, json } = winston.format;

const logger = winston.createLogger({
  level: 'debug',
  format: combine(json(), timestamp()),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
