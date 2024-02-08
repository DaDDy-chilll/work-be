const winston = require('winston');
const { combine, timestamp, json, errors, prettyPrint } = winston.format;
const {
  NODE_ENV,
  AXIOM_TOKEN,
  AXIOM_ORG_ID,
  AXIOM_DATA_SET_NAME,
} = require('./constants/app');
const { WinstonTransport: AxiomTransport } = require('@axiomhq/winston');

const winstonLogger = winston.createLogger({
  format: combine(json(), timestamp(), errors({ stack: true }), prettyPrint()),
  transports: [new winston.transports.Console({ level: 'debug' })],
});

if (NODE_ENV === 'production') {
  winstonLogger.add(
    new AxiomTransport({
      dataset: AXIOM_DATA_SET_NAME,
      token: AXIOM_TOKEN,
      orgId: AXIOM_ORG_ID,
      level: 'info',
    })
  );
}

class Logger {
  context;
  logger = winstonLogger;
  constructor(context = 'APP') {
    this.context = context;
  }

  info(message, context = this.context) {
    this.logger.info(message, { context });
  }

  error(message, error = null, context = this.context) {
    this.logger.error(message, { error, context });
  }

  warn(message, context = this.context) {
    this.logger.warn(message, { context });
  }

  debug(message, context = this.context) {
    this.logger.debug(message, { context });
  }

  verbose(message, context = this.context) {
    this.logger.verbose(message, { context });
  }
}

module.exports = Logger;
