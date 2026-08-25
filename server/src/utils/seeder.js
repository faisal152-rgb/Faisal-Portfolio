import User from '../models/User.js';
import Hero from '../models/Hero.js';
import About from '../models/About.js';
import Skill from '../models/Skill.js';
import Timeline from '../models/Timeline.js';
import Service from '../models/Service.js';
import Project from '../models/Project.js';
import AIConfig from '../models/AIConfig.js';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Drop index on category if it exists (to allow multiple nulls)
    try {
      await Skill.collection.dropIndex('category_1');
      console.log('🗑️ Dropped index on category (if existed)');
    } catch (err) {
      // Ignore if index doesn't exist
      if (err.code !== 27) {
        // IndexNotFound error code is 27
        console.error('Error dropping index on category:', err);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};