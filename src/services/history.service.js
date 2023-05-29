/**
 * @typedef {Object} Dependencies
 * @property {typeof import('../models/history.model')} History
 *
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ History }) => {
  const createHistory = async (data) => {
    const history = new History(data);

    await history.save();

    return history;
  };

  const getHistories = async ({ documentId }) => {
    return await History.find({ document: documentId }).populate({
      path: 'actor',
      populate: {
        path: 'department',
      },
    });
  };

  return { createHistory, getHistories };
};
