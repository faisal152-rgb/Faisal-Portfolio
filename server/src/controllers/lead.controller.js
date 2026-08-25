import Lead from '../models/Lead.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { io } from '../index.js';

const emitUpdate = (type, data) => {
  io.emit('leads:update', { type, data, timestamp: new Date().toISOString() });
};

// @desc    Get all leads (admin)
// @route   GET /api/leads
// @access  Private/Admin
export const getLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;
  const sort = req.query.sort || 'desc';
  
  const query = {};
  if (status) query.status = status;
  
  const leads = await Lead.find(query)
    .select('+clientReference')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: sort === 'asc' ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  const total = await Lead.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private/Admin
export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .select('+clientReference')
    .populate('assignedTo', 'name email');
  
  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead not found' });
  }
  
  res.status(200).json({ success: true, data: lead });
});

// @desc    Create lead (public - from website)
// @route   POST /api/leads
// @access  Public
export const createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    source: req.body.source || 'website',
  });
  
  emitUpdate('lead-new', lead);
  res.status(201).json({ success: true, data: lead });
});

const publicLeadFields = 'name email phone service notes status createdAt updatedAt clientReference';

export const getPublicLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ clientReference: req.params.reference })
    .select(publicLeadFields);

  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead reference not found' });
  }

  res.status(200).json({ success: true, data: lead });
});

export const updatePublicLead = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'email', 'phone', 'service', 'notes'];
  const updateData = Object.fromEntries(
    allowedFields
      .filter(field => req.body[field] !== undefined)
      .map(field => [field, req.body[field]])
  );

  if (!Object.keys(updateData).length) {
    return res.status(400).json({ success: false, message: 'At least one lead field is required' });
  }

  const lead = await Lead.findOneAndUpdate(
    { clientReference: req.params.reference },
    updateData,
    { new: true, runValidators: true }
  ).select(publicLeadFields);

  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead reference not found' });
  }

  emitUpdate('lead-update', lead);
  res.status(200).json({ success: true, data: lead, message: 'Lead updated successfully' });
});

export const renewPublicLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { clientReference: req.params.reference },
    { status: 'New' },
    { new: true, runValidators: true }
  ).select(publicLeadFields);

  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead reference not found' });
  }

  emitUpdate('lead-update', lead);
  res.status(200).json({ success: true, data: lead, message: 'Lead renewed successfully' });
});

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private/Admin
export const updateLead = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  
  // Set timestamps for status changes
  if (req.body.status === 'Contacted' && !req.body.contactedAt) {
    updateData.contactedAt = new Date();
  }
  if (req.body.status === 'Converted' && !req.body.convertedAt) {
    updateData.convertedAt = new Date();
  }
  
  const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })
    .select('+clientReference')
    .populate('assignedTo', 'name email');
  
  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead not found' });
  }
  
  emitUpdate('lead-update', lead);
  res.status(200).json({ success: true, data: lead });
});

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  
  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead not found' });
  }
  
  emitUpdate('lead-delete', { id: req.params.id });
  res.status(200).json({ success: true, message: 'Lead deleted' });
});

// @desc    Get lead stats
// @route   GET /api/leads/stats
// @access  Private/Admin
export const getLeadStats = asyncHandler(async (req, res) => {
  const stats = await Lead.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);
  
  const total = await Lead.countDocuments();
  const newLeads = await Lead.countDocuments({ status: 'New' });
  const converted = await Lead.countDocuments({ status: 'Converted' });
  const thisMonth = await Lead.countDocuments({
    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
  });
  
  res.status(200).json({
    success: true,
    data: { total, new: newLeads, converted, thisMonth, byStatus: stats },
  });
});