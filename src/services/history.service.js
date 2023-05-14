module.exports = ({ History }) => {
  const createHistory = async (data) => {
    const history = new History(data);

    await history.save();

    return history;
  };

  const getHistories = async ({ documentId }) => {
    return await History.find({ document: documentId }).populate(
      'actor',
      'name role department jobLabel'
    );
  };

  return { createHistory, getHistories };
};
