import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Project ID is required'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  tagline: {
    type: String,
    required: [true, 'Project tagline is required'],
    trim: true,
    maxlength: [200, 'Tagline cannot exceed 200 characters'],
  },
  tech: [{
    type: String,
    trim: true,
    maxlength: [200, 'Technology name too long'],
  }],
  liveUrl: {
   type: String,
   trim: true,
   match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
  },
  codeUrl: {
   type: String,
   trim: true,
   match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
  },
  brandIcon: {
    type: String,
    trim: true,
    maxlength: [30, 'Brand icon name too long'],
  },
  brandColor: {
    type: String,
    trim: true,
    match: [/^#[0-9A-Fa-f]{6}$/, 'Please provide a valid hex color'],
  },
  subText: {
    type: String,
    trim: true,
  },
  clientName: {
    type: String,
    trim: true,
    maxlength: [100, 'Client name cannot exceed 100 characters'],
  },
  keyFeatures: [{
    type: String,
    trim: true,
  }],
  stats: [{
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, 'Stat value too long'],
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: [30, 'Stat label too long'],
    },
  }],
  coverImage: {
    type: String,
    trim: true,
  },
  coverImageSettings: {
    fit: { type: String, enum: ['cover', 'contain'], default: 'cover' },
    positionX: { type: Number, min: 0, max: 100, default: 50 },
    positionY: { type: Number, min: 0, max: 100, default: 50 },
    scale: { type: Number, min: 100, max: 200, default: 100 },
    rotation: { type: Number, min: -180, max: 180, default: 0 },
    brightness: { type: Number, min: 0, max: 200, default: 100 },
    contrast: { type: Number, min: 0, max: 200, default: 100 },
    saturation: { type: Number, min: 0, max: 200, default: 100 },
    grayscale: { type: Number, min: 0, max: 100, default: 0 },
    flipX: { type: Boolean, default: false },
    flipY: { type: Boolean, default: false },
  },
  images: [{
    type: String,
    trim: true,
  }],
  document: {
    url: { type: String, trim: true },
    name: { type: String, trim: true, maxlength: 255 },
    mime: { type: String, trim: true, maxlength: 120 },
    size: { type: Number, min: 0 },
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
projectSchema.index({ order: 1 });
projectSchema.index({ isActive: 1 });
// id already has unique index from the field definition

const Project = mongoose.model('Project', projectSchema);
export default Project;