const sharp = require('sharp');

const ONE_MB = 1_000_000;
const FIVE_HUNDRED_KB = 500_000;
const TWO_MB = 2_000_000;

const createImageManipulationService = () => {
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.mimetype.startsWith('image')) {
        reject('File must be image to compress.');
      }

      let quality;

      if (file.size < FIVE_HUNDRED_KB) {
        quality = 100;
      } else if (file.size < ONE_MB) {
        quality = 90;
      } else if (file.size < TWO_MB) {
        quality = 80;
      } else {
        quality = 60;
      }

      sharp(file.buffer)
        .jpeg({
          quality,
          force: false,
        })
        .toBuffer((err, outputBuffer, info) => {
          if (err) {
            reject(err);
          }

          resolve({
            ...file,
            buffer: outputBuffer,
            size: info.size,
            mimetype: file.mimetype,
          });
        });
    });
  };

  return {
    compressImage,
  };
};

module.exports = { createImageManipulationService };
