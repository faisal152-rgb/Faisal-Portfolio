import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  icon: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Icon name too long'],
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
serviceSchema.index({ order: 1 });
serviceSchema.index({ isActive: 1 });

const Service = mongoose.model('Service', serviceSchema);
export default Service;