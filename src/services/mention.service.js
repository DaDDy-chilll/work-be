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

  const getMentions = async ({ documentId }) => {
    return await Mention.find({ document: documentId })
      .populate({
        path: 'actor',
        populate: {
          path: 'department',
        },
      })
      .populate({
        path: 'reviewers',
        populate: {
          path: 'department',
        },
      });
  };

  return { createMention, getMentions };
};
