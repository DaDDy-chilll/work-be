const History = require('../models/history.model');

const createHistoryService = () => {
  const createHistory = async (data) => {
    const history = new History(data);

    await history.save();

    return history;
  };

  return { createHistory };
};

module.exports = createHistoryService;
