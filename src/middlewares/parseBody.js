// Parse the body which contains array fields and sent by
// form-data
module.exports = (req, res, next) => {
  if (typeof req.body === 'object') {
    req.body = JSON.parse(JSON.stringify(req.body));
  }

  next();
};
