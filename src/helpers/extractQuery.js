// query = req.query
module.exports = (query, cb) => {
  const { sort = '-createdAt', limit = 10, page = 1, ...filter } = { ...query };

  const skip = (+page - 1) * limit;

  const finalFilter = cb(filter);

  return { sort, limit, filter: finalFilter, skip };
};
