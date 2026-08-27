import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Hero, { DEFAULT_SOCIAL_LINKS } from '../models/Hero.js';
import About from '../models/About.js';
import Skill from '../models/Skill.js';
import Timeline from '../models/Timeline.js';
import Service from '../models/Service.js';
import Project from '../models/Project.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { io } from '../index.js';

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

// Helper to emit socket events
const emitUpdate = (type, data) => {
  io.emit('portfolio:update', { type, data, timestamp: new Date().toISOString() });
};

// ============ HERO ============
export const getAdminHero = asyncHandler(async (req, res) => {
  const hero = await Hero.findOne().sort({ createdAt: -1 });
  if (!hero) {
    return res.status(200).json({ success: true, data: null });
  }

  const heroData = hero.toObject();
  const links = [...(heroData.socialLinks || []), ...DEFAULT_SOCIAL_LINKS];
  heroData.socialLinks = links.filter((link, index, allLinks) => (
    index === allLinks.findIndex((item) => item.platform.toLowerCase() === link.platform.toLowerCase())
  ));

  res.status(200).json({ success: true, data: heroData });
});

export const updateHero = asyncHandler(async (req, res) => {
  let hero = await Hero.findOne().sort({ createdAt: -1 });
  
  if (hero) {
    hero = await Hero.findByIdAndUpdate(hero._id, req.body, {
      new: true,
      runValidators: true,
    });
  } else {
    hero = await Hero.create(req.body);
  }
  
  emitUpdate('hero', hero);
  res.status(200).json({ success: true, data: hero });
});

// ============ ABOUT ============
export const getAdminAbout = asyncHandler(async (req, res) => {
  const about = await About.findOne().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: about });
});

export const updateAbout = asyncHandler(async (req, res) => {
  let about = await About.findOne().sort({ createdAt: -1 });
  
  if (about) {
    about = await About.findByIdAndUpdate(about._id, req.body, {
      new: true,
      runValidators: true,
    });
  } else {
    about = await About.create(req.body);
  }
  
  emitUpdate('about', about);
  res.status(200).json({ success: true, data: about });
});

export const uploadAboutProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'An image is required' });
  }

  const mimeType = req.file.mimetype || 'image/jpeg';
  const base64Data = req.file.buffer.toString('base64');
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

  let about = await About.findOne().sort({ createdAt: -1 });
  if (about) {
    about.profileImage = imageUrl;
    await about.save();
  } else {
    about = await About.create({ profileImage: imageUrl });
  }

  emitUpdate('about', about);

  res.status(201).json({
    success: true,
    data: { url: imageUrl },
  });
});

export const uploadAboutResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'A resume file is required' });
  }

  const mimeType = req.file.mimetype || 'application/pdf';
  const base64Data = req.file.buffer.toString('base64');
  const resumeUrl = `data:${mimeType};base64,${base64Data}`;

  let about = await About.findOne().sort({ createdAt: -1 });
  if (about) {
    about.resume = resumeUrl;
    await about.save();
  } else {
    about = await About.create({ resume: resumeUrl });
  }

  emitUpdate('about', about);

  res.status(201).json({
    success: true,
    data: { url: resumeUrl },
  });
});

// ============ SKILLS ============
export const getAdminSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find().sort({ order: 1 });
  res.status(200).json({ success: true, data: skills });
});

export const createSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.create(req.body);
  emitUpdate('skills', await Skill.find().sort({ order: 1 }));
  res.status(201).json({ success: true, data: skill });
});

export const updateSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  if (!skill) {
    return res.status(404).json({ success: false, message: 'Skill not found' });
  }
  
  emitUpdate('skills', await Skill.find().sort({ order: 1 }));
  res.status(200).json({ success: true, data: skill });
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  
  if (!skill) {
    return res.status(404).json({ success: false, message: 'Skill not found' });
  }
  
  emitUpdate('skills', await Skill.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Skill deleted' });
});

export const reorderSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body; // Array of { id, order }
  
  await Promise.all(
    skills.map(({ id, order }) => Skill.findByIdAndUpdate(id, { order }))
  );
  
  emitUpdate('skills', await Skill.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Skills reordered' });
});

// ============ TIMELINE ============
export const getAdminTimeline = asyncHandler(async (req, res) => {
  const timeline = await Timeline.find().sort({ order: 1 });
  res.status(200).json({ success: true, data: timeline });
});

export const createTimeline = asyncHandler(async (req, res) => {
  const item = await Timeline.create(req.body);
  emitUpdate('timeline', await Timeline.find().sort({ order: 1 }));
  res.status(201).json({ success: true, data: item });
});

export const updateTimeline = asyncHandler(async (req, res) => {
  const item = await Timeline.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  if (!item) {
    return res.status(404).json({ success: false, message: 'Timeline item not found' });
  }
  
  emitUpdate('timeline', await Timeline.find().sort({ order: 1 }));
  res.status(200).json({ success: true, data: item });
});

export const deleteTimeline = asyncHandler(async (req, res) => {
  const item = await Timeline.findByIdAndDelete(req.params.id);
  
  if (!item) {
    return res.status(404).json({ success: false, message: 'Timeline item not found' });
  }
  
  emitUpdate('timeline', await Timeline.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Timeline item deleted' });
});

export const reorderTimeline = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map(({ id, order }) => Timeline.findByIdAndUpdate(id, { order })));
  emitUpdate('timeline', await Timeline.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Timeline reordered' });
});

// ============ SERVICES ============
export const getAdminServices = asyncHandler(async (req, res) => {
  const services = await Service.find().sort({ order: 1 });
  res.status(200).json({ success: true, data: services });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  emitUpdate('services', await Service.find().sort({ order: 1 }));
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  
  emitUpdate('services', await Service.find().sort({ order: 1 }));
  res.status(200).json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  
  emitUpdate('services', await Service.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Service deleted' });
});

export const reorderServices = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map(({ id, order }) => Service.findByIdAndUpdate(id, { order })));
  emitUpdate('services', await Service.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Services reordered' });
});

// ============ PROJECTS ============
export const getAdminProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ order: 1 });
  res.status(200).json({ success: true, data: projects });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  
  if (name) {
    // Find project with same name (case-insensitive)
    const existingProject = await Project.findOne({
      name: { $regex: new RegExp('^' + name.trim() + '$', 'i') }
    });
    
    if (existingProject) {
      // Update existing project data
      const updatedProject = await Project.findByIdAndUpdate(existingProject._id, req.body, {
        new: true,
        runValidators: true,
      });
      emitUpdate('projects', await Project.find().sort({ order: 1 }));
      return res.status(200).json({ success: true, data: updatedProject, isUpdate: true });
    }
  }

  // Otherwise, create a new project
  const project = await Project.create(req.body);
  emitUpdate('projects', await Project.find().sort({ order: 1 }));
  res.status(201).json({ success: true, data: project });
});

export const uploadProjectDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'A project document is required' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  await fs.mkdir(uploadsDirectory, { recursive: true });
  const extension = '.png';
  const filename = `${randomUUID()}${extension}`;
  await fs.writeFile(path.join(uploadsDirectory, filename), req.file.buffer);

  project.document = {
    url: `/uploads/${filename}`,
    name: req.file.originalname,
    mime: req.file.mimetype,
    size: req.file.size,
  };
  await project.save();
  emitUpdate('projects', await Project.find().sort({ order: 1 }));

  res.status(201).json({ success: true, data: project.document });
});

export const uploadProjectImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'A project image is required' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  await fs.mkdir(uploadsDirectory, { recursive: true });
  const extension = path.extname(req.file.originalname).toLowerCase();
  const filename = `${randomUUID()}${extension}`;
  await fs.writeFile(path.join(uploadsDirectory, filename), req.file.buffer);
  const imageUrl = `/uploads/${filename}`;

  if (req.body.kind === 'gallery') {
    project.images = [...(project.images || []), imageUrl];
  } else {
    project.coverImage = imageUrl;
  }
  await project.save();
  emitUpdate('projects', await Project.find().sort({ order: 1 }));

  res.status(201).json({ success: true, data: { url: imageUrl } });
});

export const deleteProjectImage = asyncHandler(async (req, res) => {
  const imageUrl = String(req.body.url || '');
  if (!imageUrl.startsWith('/uploads/')) {
    return res.status(400).json({ success: false, message: 'A valid project image URL is required' });
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const wasCover = project.coverImage === imageUrl;
  project.images = (project.images || []).filter((image) => image !== imageUrl);
  if (wasCover) {
    project.coverImage = project.images[0] || '';
  }
  await project.save();

  const filePath = path.resolve(uploadsDirectory, path.basename(imageUrl));
  if (filePath.startsWith(path.resolve(uploadsDirectory)) && filePath !== path.resolve(uploadsDirectory)) {
    await fs.rm(filePath, { force: true });
  }
  emitUpdate('projects', await Project.find().sort({ order: 1 }));

  res.status(200).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  
  emitUpdate('projects', await Project.find().sort({ order: 1 }));
  res.status(200).json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  
  emitUpdate('projects', await Project.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Project deleted' });
});

export const reorderProjects = asyncHandler(async (req, res) => {
  const { items } = req.body;
  await Promise.all(items.map(({ id, order }) => Project.findByIdAndUpdate(id, { order })));
  emitUpdate('projects', await Project.find().sort({ order: 1 }));
  res.status(200).json({ success: true, message: 'Projects reordered' });
});
