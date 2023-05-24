import sharp from 'sharp';

export const createImageManipulationService = () => {
  const compressImage = (
    file: Express.Multer.File
  ): Promise<Express.Multer.File> => {
    return new Promise((resolve, reject) => {
      if (!file.mimetype.startsWith('image')) {
        reject('File must be image to compress.');
      }

      sharp(file.buffer)
        .jpeg({
          quality: 60,
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
            mimetype: info.format,
          });
        });
    });
  };

  return {
    compressImage,
  } as const;
};

export type TImageManipulationService = ReturnType<
  typeof createImageManipulationService
>;
