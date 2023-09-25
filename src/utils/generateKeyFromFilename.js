const slugify = require('slugify');

function generateKeyFromFile(file) {
  const splittedName = file.originalname.split('.');

  const ext = splittedName[splittedName.length - 1];

  const randomString = `${Date.now()}${Math.round(Math.random() * 1000)}`;

  return `${slugify(
    splittedName.slice(0, splittedName.length - 1).join('')
  )}-${randomString}.${ext}`;
}

module.exports = generateKeyFromFile;
