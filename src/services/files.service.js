const { uploadFile } = require('../lib/s3');

module.exports = () => {
  return Object.freeze({
    /**
     * @typedef {Object} UploadReturn
     * @property {string} key
     * @property {string} url
     * @property {string} filename
     * @property {string} mimetype
     *
     * @param {Express.Multer.File} file
     * @returns {UploadReturn}
     */
    uploadFile: async (file) => {
      const uploadedFile = await uploadFile(file);

      return {
        key: uploadedFile.Key,
        url: uploadedFile.Location,
        filename: file.originalname,
        mimetype: file.mimetype,
      };
    },
  });
};
