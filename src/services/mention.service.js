/**
 * @typedef {Object} Dependencies
 * @property {typeof import('../models/mention.model')} Mention
 *
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ Mention }) => {
  const createMention = async (data) => {
    const mention = new Mention(data);

    await mention.save();

    return mention;
  };

  return { createMention };
};
