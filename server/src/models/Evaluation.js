const mongoose = require('mongoose');
const { RUBRIC_KEYS } = require('../config/rubric');

const rubricResultSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: true,
      enum: RUBRIC_KEYS
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    evidence: {
      type: String,
      required: true
    },
    concern: {
      type: String,
      required: true
    },
    suggestion: {
      type: String,
      required: true
    },
    confidence: {
      type: String,
      enum: ['high', 'low'],
      required: true,
      default: 'high'
    },
    evidenceVerified: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,
      index: true
    },
    evaluatorType: {
      type: String,
      enum: ['deterministic', 'ai'],
      required: true
    },
    rubricResults: {
      type: [rubricResultSchema],
      required: true,
      default: []
    },
    overallSummary: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
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

module.exports = mongoose.model('Evaluation', evaluationSchema);
