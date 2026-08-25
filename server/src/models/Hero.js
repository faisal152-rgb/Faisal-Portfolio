import mongoose from 'mongoose';

export const DEFAULT_SOCIAL_LINKS = [
  { platform: 'GitHub', url: 'https://github.com/faisal' },
  { platform: 'LinkedIn', url: 'https://linkedin.com/in/faisal' },
  { platform: 'Instagram', url: 'https://instagram.com/faisal' },
  { platform: 'Twitter', url: 'https://twitter.com/faisal' },
  { platform: 'TikTok', url: 'https://www.tiktok.com/@faisal' },
  { platform: 'WhatsApp', url: 'https://wa.me/923000000000' },
  { platform: 'Email', url: 'mailto:faisalabbas@gmail.com' },
];

const heroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Hero title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  subtitle: {
    type: String,
    required: [true, 'Hero subtitle is required'],
    trim: true,
    maxlength: [150, 'Subtitle cannot exceed 150 characters'],
  },
  description: {
    type: String,
    required: [true, 'Hero description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  freelance: [{
    platform: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Platform name too long'],
    },
    url: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
    },
    label: {
      type: String,
      trim: true,
      maxlength: [50, 'Label too long'],
    },
  }],
  socialLinks: [{
    platform: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Platform name too long'],
    },
    url: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/|mailto:).+/, 'Please provide a valid URL'],
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Hero = mongoose.model('Hero', heroSchema);
export default Hero;