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
      const { name, company, role, email, notes, ...attributes } = data;
      if (name) { // Only add if name exists
        // Convert attributes object to Map for MongoDB
        const attributesMap = new Map(Object.entries(attributes));
        results.push({ 
          name: name.trim(), 
          company: company?.trim(), 
          role: role?.trim(), 
          email: email?.trim(), 
          notes: notes?.trim(), 
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
