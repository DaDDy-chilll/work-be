const { uploadFile } = require('../lib/s3');

/**
 * @typedef {Object} UploadReturn
 * @property {string} key
 * @property {string} url
 * @property {string} filename
 * @property {string} mimetype
 */

/**
 * @typedef {Object} Dependencies
 * @property {import('./image-manipulation.service').TImageManipulationService} imageManipulationService
 * @param {Dependencies} param0
 * @returns
 */
module.exports = ({ imageManipulationService }) => {
  return Object.freeze({
    /**
     *
     * @param {Express.Multer.File} file
     * @returns {UploadReturn}
     */
    uploadFile: async (file) => {
      let tmpFile = file;

      if (file.mimetype.startsWith('image')) {
        tmpFile = await imageManipulationService.compressImage(file);
      }

      const uploadedFile = await uploadFile(tmpFile);

      return {
        key: uploadedFile.Key,
        url: uploadedFile.Location,
        filename: tmpFile.originalname,
        mimetype: tmpFile.mimetype,
      };
    },

    /**
     * @param {Express.Multer.File | Express.Multer.File[]} payload
     * @returns {Promise<UploadReturn[]>}
     */
    uploadFiles: async (payload) => {
      const files = [];
      if (Array.isArray(payload)) {
        files.push(...payload);
      } else {
        files.push(payload);
      }
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
