const User = require('../../models/user.model');
const Department = require('../../models/department.model');
const {
  SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD,
} = require('../constants/superadmin-credentials.constant');

const seedDb = async () => {
  // create superadmin department
  const superadminDepartment = await Department.create({
    name: 'Superadmin',
    type: 'superadmin',
  });

  // create superadmin
  await User.create({
    name: 'Superadmin',
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    jobLabel: 'Superadmin',
    isSuperadmin: true,
    department: superadminDepartment._id,
    permissions: {
      canApprove: true,
      canEdit: true,
      canEditAmount: true,
      canForward: true,
      canMention: true,
      canPrepare: true,
      canVerify: true,
    },
  });
};

module.exports = seedDb;
