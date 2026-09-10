const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      index: true
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      default: 'demo-user',
      index: true
    },
    content: {
      type: String,
      required: true
    },
    contentHash: {
      type: String,
      required: true,
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'evaluating', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for idempotency lookup per problem & content
submissionSchema.index({ problemId: 1, contentHash: 1, evaluationStatus: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
