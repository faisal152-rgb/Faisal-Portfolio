import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Skill group title is required'],
    trim: true,
    maxlength: [50, 'Title cannot exceed 50 characters'],
  },
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Skill name too long'],
    },
    value: {
      type: Number,
      required: true,
      min: [0, 'Value must be at least 0'],
      max: [100, 'Value cannot exceed 100'],
    },
  }],
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
  category: {
    type: String,
    sparse: true,
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
skillSchema.index({ order: 1 });
skillSchema.index({ isActive: 1 });

const Skill = mongoose.model('Skill', skillSchema);
export default Skill;