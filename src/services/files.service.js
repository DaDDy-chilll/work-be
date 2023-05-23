const { uploadFile } = require('../lib/s3');

/**
 * @typedef {Object} UploadReturn
 * @property {string} key
 * @property {string} url
 * @property {string} filename
 * @property {string} mimetype
 */

module.exports = () => {
  return Object.freeze({
    /**
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

    /**
     * @param {Express.Multer.File[]} files
     * @returns {UploadReturn[]}
     */
    uploadFilesInBatch: async (files) => {
      const uploadedFiles = await Promise.all(
        files.map(async (f) => {
          const uploadedFile = await uploadFile(f);

          return {
            key: uploadedFile.Key,
            url: uploadedFile.Location,
            filename: f.originalname,
            mimetype: f.mimetype,
          };
        })
      );

      return uploadedFiles;
    },
  });
};
