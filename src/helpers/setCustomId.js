const Count = require('../models/count.model');

function setCustomId({ prefix, modelName }) {
  return async function (next) {
    if (this.isNew) {
      const countDoc = await Count.findOneAndUpdate(
        { model: modelName },
        {
          $inc: {
            count: 1,
          },
        },
        { new: true },
      );

      this.customId = prefix + countDoc.count.toString().padStart(3, '0');
      console.log(this.customId);
    }
    next();
  };
}

module.exports = setCustomId;
