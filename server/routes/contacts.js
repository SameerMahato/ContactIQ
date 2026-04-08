const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Contact = require('../models/Contact');

const upload = multer({ dest: 'uploads/' });

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
  
  const results = [];
  let count = 0;
  const batchSize = 1000;
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      const { name, company, role, email, notes, ...attributes } = data;
      results.push({ name, company, role, email, notes, attributes });
      
      if (results.length >= batchSize) {
        Contact.insertMany(results.splice(0, batchSize), { ordered: false })
          .catch(err => console.error('Batch insert error:', err));
      }
      count++;
    })
    .on('end', async () => {
      if (results.length > 0) {
        await Contact.insertMany(results, { ordered: false }).catch(err => console.error(err));
      }
      fs.unlinkSync(req.file.path);
      res.json({ message: `Imported ${count} contacts` });
    })
    .on('error', (error) => {
      fs.unlinkSync(req.file.path);
      res.status(500).json({ error: error.message });
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

module.exports = router;
