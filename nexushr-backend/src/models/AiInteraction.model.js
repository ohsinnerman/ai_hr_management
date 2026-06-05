import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const aiInteractionSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true },
    userId: { type: ObjectId, ref: 'User', required: true },
    sessionId: String,
    type: {
      type: String,
      enum: ['chat', 'voice', 'resume_screen', 'doc_search', 'analytics'],
      required: true,
    },
    inputText: String,
    outputText: String,
    inputTokens: Number,
    outputTokens: Number,
    modelUsed: String, // e.g. 'gemini-2.0-flash'
    durationMs: Number,
    isHelpful: Boolean, // set by user thumbs up/down
    feedbackText: String,
  },
  { timestamps: true }
);

aiInteractionSchema.index({ userId: 1, createdAt: -1 });
aiInteractionSchema.index({ companyId: 1, type: 1, createdAt: -1 });

export default mongoose.model('AiInteraction', aiInteractionSchema);
