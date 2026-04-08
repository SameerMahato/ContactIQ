const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  company: { type: String, index: true },
  role: String,
  email: String,
  notes: String,
  attributes: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});

contactSchema.index({ name: 'text', company: 'text', role: 'text', notes: 'text' });

module.exports = mongoose.model('Contact', contactSchema);
