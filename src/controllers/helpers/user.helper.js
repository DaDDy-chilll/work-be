const getFilterForGetAllUsers = ({ query: originalQuery }) => {
  const { sort, limit = 10, page, ...query } = originalQuery;
  const skip = (page - 1) * +limit;
  const filter = {};

  if (query.name) {
    filter.name = {
      $regex: query.name,
      $options: 'i',
    };
  }

  if (query.department) {
    filter.department = query.department;
  }

  return { filter, sort, limit, skip };
};

module.exports = {
  getFilterForGetAllUsers,
};
