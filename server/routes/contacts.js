const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Contact = require('../models/Contact');

const upload = multer({ dest: 'uploads/' });

// Store import status
const importStatus = {
  inProgress: false,
  count: 0,
  total: 0
};

router.get('/import-status', (req, res) => {
  res.json(importStatus);
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const query = search ? { $text: { $search: search } } : {};
    
    const contacts = await Contact.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Contact.countDocuments(query);
    
    res.json({
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const filePath = req.file.path;
  
  // Reset status
  importStatus.inProgress = true;
  importStatus.count = 0;
  importStatus.total = 0;
  
  // Respond immediately to avoid timeout
  res.json({ message: 'Import started. Processing in background...', status: 'started' });
  
  // Process in background
  const results = [];
  const batchSize = 500; // Reduced for faster processing
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      // Handle both old format (name, company, role, email) and new format (first_name, last_name, company_name, designation, mobile, email)
      let name, company, role, email, notes;
      const attributes = {};
      
      // Check if it's the new format (chat_states CSV)
      if (data.first_name || data.last_name) {
        // New format: first_name, last_name, company_name, designation, mobile, email
        const firstName = data.first_name?.trim() || '';
        const middleName = data.middle_name?.trim() || '';
        const lastName = data.last_name?.trim() || '';
        name = [firstName, middleName, lastName].filter(n => n).join(' ');
        
        company = data.company_name?.trim() || '';
        role = data.designation?.trim() || '';
        email = data.email?.trim() || '';
        
        // Add additional fields as attributes
        if (data.mobile) attributes.mobile = data.mobile.trim();
        if (data.pan) attributes.pan = data.pan.trim();
        if (data.gender) attributes.gender = data.gender.trim();
        if (data.dob) attributes.dob = data.dob.trim();
        if (data.state) attributes.state = data.state.trim();
        if (data.city) attributes.city = data.city.trim();
        if (data.pincode) attributes.pincode = data.pincode.trim();
        if (data.application_status) attributes.application_status = data.application_status.trim();
        if (data.state_id) attributes.state_id = data.state_id.trim();
        if (data.kyc_successful) attributes.kyc_successful = data.kyc_successful.trim();
        if (data.income_verified_aa) attributes.income_verified_aa = data.income_verified_aa.trim();
        if (data.latitude) attributes.latitude = data.latitude.trim();
        if (data.longitude) attributes.longitude = data.longitude.trim();
      } else {
        // Old format: name, company, role, email, notes
        name = data.name?.trim() || '';
        company = data.company?.trim() || '';
        role = data.role?.trim() || '';
        email = data.email?.trim() || '';
        notes = data.notes?.trim() || '';
        
        // Add any extra columns as attributes
        Object.keys(data).forEach(key => {
          if (!['name', 'company', 'role', 'email', 'notes'].includes(key) && data[key]) {
            attributes[key] = data[key].trim();
          }
        });
      }
      
      if (name) { // Only add if name exists
        // Convert attributes object to Map for MongoDB
        const attributesMap = new Map(Object.entries(attributes));
        results.push({ 
          name, 
          company, 
          role, 
          email, 
          notes: notes || '', 
          attributes: attributesMap 
        });
        importStatus.total++;
      }
      
      // Insert batch when it reaches batchSize
      if (results.length >= batchSize) {
        const batch = results.splice(0, batchSize);
        Contact.insertMany(batch, { ordered: false })
          .then(() => {
            importStatus.count += batch.length;
            console.log(`Inserted batch: ${importStatus.count}/${importStatus.total}`);
          })
          .catch(err => console.error('Batch insert error:', err));
      }
    })
    .on('end', async () => {
      // Insert remaining contacts
      if (results.length > 0) {
        await Contact.insertMany(results, { ordered: false })
          .then(() => {
            importStatus.count += results.length;
            console.log(`Inserted final batch: ${importStatus.count}/${importStatus.total}`);
          })
          .catch(err => console.error('Final batch error:', err));
      }
      
      // Clean up file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
      
      console.log(`✓ Import completed: ${importStatus.total} contacts imported`);
      importStatus.inProgress = false;
    })
    .on('error', (error) => {
      console.error('Import error:', error);
      importStatus.inProgress = false;
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });
});

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    const contacts = await Contact.find({ $text: { $search: query } })
      .limit(10)
      .select('-__v');
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all contacts (for testing/debugging)
router.delete('/clear-all', async (req, res) => {
  try {
    const result = await Contact.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} contacts` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
