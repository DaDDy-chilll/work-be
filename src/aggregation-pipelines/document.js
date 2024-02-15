const moment = require('moment');
const mongoose = require('mongoose');

const getAllDocumentPipeline = ({
  page = 1,
  limit = 10,
  sort = 'createdAt',
  search,
  requester,
  currentReviewer,
  caseStatus,
  startDate,
  endDate,
  documentId,
  currentUser,
  department,
  mentionedReviewer,
  status,
}) => {
  const filter = {};

  if (documentId) {
    filter._id = new mongoose.Types.ObjectId(documentId);
  }

  if (requester) {
    filter['requester._id'] = new mongoose.Types.ObjectId(requester);
  }

  if (currentReviewer) {
    filter.currentReviewer = new mongoose.Types.ObjectId(currentReviewer);
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { documentId: regex }];
  }

  if (startDate || endDate) {
    filter.createdAt = {
      $gte: moment.utc(startDate).toDate(),
      $lt: moment.utc(endDate).toDate(),
    };
  }

  if (currentUser) {
    const currentUserDepartment = currentUser.department;

    if (currentUserDepartment.type !== 'authorized') {
      filter.requestedByDepartment = currentUserDepartment._id;
    } else if (currentUserDepartment.type === 'authorized' && department) {
      filter.requestedByDepartment = new mongoose.Types.ObjectId(department);
    }
  }

  if (mentionedReviewer) {
    filter['mentions.reviewers'] = {
      $in: [new mongoose.Types.ObjectId(mentionedReviewer)],
    };
  }

  if (caseStatus) {
    filter.isCaseClosed = caseStatus === 'closed';
  }

  if (status) {
    if (Array.isArray(status)) {
      filter.$or = status.map((value) => ({
        status: value,
      }));
    } else {
      filter.status = status;
    }
  }

  const facetPipeline = [{ $skip: (+page - 1) * +limit }];

  const pipelines = [
    {
      $lookup: {
        from: 'users',
        localField: 'requester',
        foreignField: '_id',
        as: 'requester',
      },
    },
    {
      $lookup: {
        from: 'mentions',
        localField: '_id',
        foreignField: 'document',
        as: 'mentions',
      },
    },
    {
      $lookup: {
        from: 'histories',
        localField: '_id',
        foreignField: 'document',
        as: 'histories',
        pipeline: [{ $sort: { createdAt: -1 } }],
      },
    },
    {
      $addFields: {
        requester: { $arrayElemAt: ['$requester', 0] },
        lastActivity: { $arrayElemAt: ['$histories', 0] },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastActivity.actor',
        foreignField: '_id',
        as: 'lastActivity.actor',
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'lastActivity.department',
        foreignField: '_id',
        as: 'lastActivity.department',
      },
    },
    {
      $addFields: {
        'lastActivity.actor': { $arrayElemAt: ['$lastActivity.actor', 0] },
        'lastActivity.department': {
          $arrayElemAt: ['$lastActivity.department', 0],
        },
      },
    },
    {
      $project: {
        histories: 0,
      },
    },
    {
      $match: filter,
    },
    {
      $sort: {
        [sort]: -1,
      },
    },
  ];

  if (limit) {
    facetPipeline.push({ $limit: +limit });
  }

  pipelines.push(
    ...[
      {
        $facet: {
          count: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          data: facetPipeline,
        },
      },
      {
        $addFields: {
          count: { $first: '$count.count' },
        },
      },
    ]
  );

  return { filter, pipelines };
};

module.exports = { getAllDocumentPipeline };
