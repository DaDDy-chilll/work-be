const winston = require('winston');
const { combine, timestamp, json, errors, prettyPrint } = winston.format;
const { NODE_ENV, AXIOM_TOKEN, AXIOM_ORG_ID } = require('./constants/app');
const { WinstonTransport: AxiomTransport } = require('@axiomhq/axiom-node');

const logger = winston.createLogger({
  format: combine(json(), timestamp(), errors({ stack: true }), prettyPrint()),
  transports: [new winston.transports.Console({ level: 'debug' })],
});

logger.stream = {
  write: function (message, _encoding) {
    logger.info(JSON.parse(message));
  },
};

if (NODE_ENV === 'production') {
  logger.add(
    new AxiomTransport({
      dataset: 'parami-logs',
      token: AXIOM_TOKEN,
      orgId: AXIOM_ORG_ID,
      level: 'info',
    })
  );
}

module.exports = logger;
