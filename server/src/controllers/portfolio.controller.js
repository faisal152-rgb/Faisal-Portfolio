import Hero, { DEFAULT_SOCIAL_LINKS } from '../models/Hero.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const withDefaultSocialLinks = (hero) => {
  if (!hero) return hero;

  const heroData = hero.toObject ? hero.toObject() : hero;
  const links = [...(heroData.socialLinks || []), ...DEFAULT_SOCIAL_LINKS];
  const socialLinks = links.filter((link, index, allLinks) => (
    index === allLinks.findIndex((item) => item.platform.toLowerCase() === link.platform.toLowerCase())
  ));

  return { ...heroData, socialLinks };
};

// @desc    Get hero data (public)
// @route   GET /api/portfolio/hero
// @access  Public
export const getHero = asyncHandler(async (req, res) => {
  const hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });
  
  if (!hero) {
    return res.status(404).json({
      success: false,
      message: 'Hero data not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: withDefaultSocialLinks(hero),
  });
});

// @desc    Get all portfolio data (public)
// @route   GET /api/portfolio
// @access  Public
export const getPortfolio = asyncHandler(async (req, res) => {
  const [
    hero,
    about,
    skills,
    timeline,
    services,
    projects,
  ] = await Promise.all([
    Hero.findOne({ isActive: true }).sort({ createdAt: -1 }),
    (await import('../models/About.js')).default.findOne({ isActive: true }).sort({ createdAt: -1 }),
    (await import('../models/Skill.js')).default.find({ isActive: true }).sort({ order: 1 }),
    (await import('../models/Timeline.js')).default.find({ isActive: true }).sort({ order: 1 }),
    (await import('../models/Service.js')).default.find({ isActive: true }).sort({ order: 1 }),
    (await import('../models/Project.js')).default.find({ isActive: true }).sort({ order: 1 }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      hero: withDefaultSocialLinks(hero),
      about,
      skills,
      timeline,
      services,
      projects,
    },
  });
});
