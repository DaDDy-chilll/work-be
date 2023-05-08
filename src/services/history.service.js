module.exports = ({ History }) => {
  const createHistory = async (data) => {
    const history = new History(data);

    await history.save();

    return history;
  };

  const getHistories = async ({ documentId }) => {
    return await History.find({ document: documentId });
  };

  return { createHistory, getHistories };
};
