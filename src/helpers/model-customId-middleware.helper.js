module.exports = function createCustomIdMiddleware({
  modelName,
  prefix,
  fieldName,
}) {
  return async function () {
    if (!this.isNew) return;

    const [lastDoc] = await this.$model(modelName)
      .find()
      .sort({ $natural: 'desc' })
      .limit(1);

    if (!lastDoc) {
      this[fieldName] = `${prefix}-001`;
      return;
    }
    const lastDocIdNumber = parseInt(lastDoc[fieldName].split('-')[1], 10);

    this[fieldName] = `${prefix}-${(lastDocIdNumber + 1)
      .toString()
      .padStart(3, '0')}`;
    return;
  };
};
