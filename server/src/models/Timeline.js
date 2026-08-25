import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Timeline title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Timeline description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  order: {
    type: Number,
    default: 0,
    min: [0, 'Order cannot be negative'],
    max: [1000, 'Order cannot exceed 1000'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
timelineSchema.index({ order: 1 });
timelineSchema.index({ isActive: 1 });

const Timeline = mongoose.model('Timeline', timelineSchema);
export default Timeline;