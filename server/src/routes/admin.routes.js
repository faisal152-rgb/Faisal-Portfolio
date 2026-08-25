import express from 'express';
import multer from 'multer';
import {
  // Hero
  getAdminHero,
  updateHero,
  // About
  getAdminAbout,
  updateAbout,
  uploadAboutProfileImage,
  uploadAboutResume,
  // Skills
  getAdminSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  // Timeline
  getAdminTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  reorderTimeline,
  // Services
  getAdminServices,
  createService,
  updateService,
  deleteService,
  reorderServices,
  // Projects
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  uploadProjectDocument,
  uploadProjectImage,
  deleteProjectImage,
} from '../controllers/admin.controller.js';
import {
  heroValidator,
  aboutValidator,
  skillValidator,
  timelineValidator,
  serviceValidator,
  projectValidator,
  idValidator,
  validate,
} from '../middleware/validation.middleware.js';

const router = express.Router();

const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      return callback(null, true);
    }
    const error = new Error('Only image files are allowed');
    error.statusCode = 400;
    callback(error);
  },
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype === 'application/pdf') {
      return callback(null, true);
    }
    const error = new Error('Only PDF files are allowed');
    error.statusCode = 400;
    callback(error);
  },
});

const projectDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]);
    if (allowedTypes.has(file.mimetype)) return callback(null, true);
    const error = new Error('Only PDF, Word, and text documents are allowed');
    error.statusCode = 400;
    callback(error);
  },
});

const projectImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      return callback(null, true);
    }
    const error = new Error('Only image files are allowed');
    error.statusCode = 400;
    callback(error);
  },
});

// All admin routes require authentication
// Auth middleware is applied at app level

// ============ HERO ============
router.get('/hero', getAdminHero);
router.put('/hero', heroValidator, validate, updateHero);

// ============ ABOUT ============
router.get('/about', getAdminAbout);
router.put('/about', aboutValidator, validate, updateAbout);
router.post('/about/profile-image', profileImageUpload.single('image'), uploadAboutProfileImage);
router.post('/about/resume', resumeUpload.single('resume'), uploadAboutResume);

// ============ SKILLS ============
router.get('/skills', getAdminSkills);
router.post('/skills', skillValidator, validate, createSkill);
router.put('/skills/:id', idValidator, skillValidator, validate, updateSkill);
router.delete('/skills/:id', idValidator, validate, deleteSkill);
router.put('/skills/reorder', reorderSkills);

// ============ TIMELINE ============
router.get('/timeline', getAdminTimeline);
router.post('/timeline', timelineValidator, validate, createTimeline);
router.put('/timeline/:id', idValidator, timelineValidator, validate, updateTimeline);
router.delete('/timeline/:id', idValidator, validate, deleteTimeline);
router.put('/timeline/reorder', reorderTimeline);

// ============ SERVICES ============
router.get('/services', getAdminServices);
router.post('/services', serviceValidator, validate, createService);
router.put('/services/:id', idValidator, serviceValidator, validate, updateService);
router.delete('/services/:id', idValidator, validate, deleteService);
router.put('/services/reorder', reorderServices);

// ============ PROJECTS ============
router.get('/projects', getAdminProjects);
router.post('/projects', projectValidator, validate, createProject);
router.put('/projects/:id', idValidator, projectValidator, validate, updateProject);
router.post('/projects/:id/document', idValidator, projectDocumentUpload.single('document'), uploadProjectDocument);
router.post('/projects/:id/image', idValidator, projectImageUpload.single('image'), uploadProjectImage);
router.delete('/projects/:id/image', idValidator, deleteProjectImage);
router.delete('/projects/:id', idValidator, validate, deleteProject);
router.put('/projects/reorder', reorderProjects);

export default router;
