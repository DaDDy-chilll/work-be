const User = require('../../models/user.model');
const { AUTHORIZED_DEPARTMENTS } = require('../../constants/user');
const connectDb = require('./connectDb');

connectDb({ dbUri: 'DB', dbName: 'NAME' }, async () => {
  const setSuperadmin = User.updateMany(
    { isSuperadmin: true },
    { role: 'SUPERADMIN' }
  );
  const setAuthorized = User.updateMany(
    { department: { $in: Object.values(AUTHORIZED_DEPARTMENTS) } },
    { role: 'AUTHORIZED' }
  );
  const setBasic = User.updateMany(
    {
      department: { $nin: Object.values(AUTHORIZED_DEPARTMENTS) },
      isSuperadmin: false,
    },
    {
      role: 'BASIC',
    }
  );

  await Promise.all([setSuperadmin, setAuthorized, setBasic]);
});
