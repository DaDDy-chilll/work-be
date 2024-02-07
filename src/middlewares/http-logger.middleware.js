const Logger = require('../logger');

const httpLoggerMiddleware = (req, res, next) => {
  const httpLogger = new Logger('HTTP');
  const start = Date.now();

  res.on('finish', () => {
    const now = Date.now();
    const durationMs = now - start;

    const message = {
      method: req.method,
      body: req.body,
      base_url: req.baseUrl,
      params: req.params,
      query: req.query,
      res_status: res.statusCode,
      ip: req.ip,
      response_time_ms: durationMs,
      user_agent: req.get('user-agent'),
      user_id: req.user?.id,
      hostname: req.hostname,
    };

    httpLogger.info(message);
  });
  next();
};

module.exports = httpLoggerMiddleware;
