module.exports = ({ History }) => {
  const createHistory = async (data) => {
    const history = new History(data);

    await history.save();

    return history;
  };

  return { createHistory };
};
