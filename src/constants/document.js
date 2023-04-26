module.exports = {
  PAYMENT_TYPES: Object.freeze({
    normal: 'normal',
    advanced: 'advanced',
  }),
  DOCUMENT_ACTIONS: Object.freeze({
    verify: 'verify',
    approve: 'approve',
    reject: 'reject',
    acknowledge: 'acknowledge',
    comment: 'comment',
  }),
  DOCUMENT_STATUSES: Object.freeze({
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    verified: 'verified',
    acknowledged: 'acknowledged',
  }),
  STATUS_ACTION_MAP: Object.freeze({
    pending: 'pending',
    verified: 'verify',
    approved: 'approve',
    acknowledged: 'acknowledge',
    commented: 'comment',
    verify: 'verified',
    approve: 'approved',
    acknowledge: 'acknowledged',
    comment: 'commented',
  }),
  REMARK_ACTIONS: Object.freeze({
    approved: 'approved',
    verified: 'verified',
    rejected: 'rejected',
    acknowledged: 'acknowledged',
    comment: 'commented',
  }),
  DOCUMENT_SECTIONS: {
    admin: 'admin',
    fad: 'fad',
  },
};
