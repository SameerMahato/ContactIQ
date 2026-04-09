const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/librechat-contacts')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const Contact = require('./server/models/Contact');

async function reprocessFile() {
  const filePath = 'uploads/169ad6c20b544ebf7626cb4f75ed85f5';
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  console.log('Starting import from:', filePath);
  console.log('File size:', (fs.statSync(filePath).size / 1024 / 1024).toFixed(2), 'MB');
  
  const results = [];
  const batchSize = 1000;
  let totalProcessed = 0;
  let totalImported = 0;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      totalProcessed++;
      
      // Handle chat_states CSV format
      const firstName = data.first_name?.trim() || '';
      const middleName = data.middle_name?.trim() || '';
      const lastName = data.last_name?.trim() || '';
      const name = [firstName, middleName, lastName].filter(n => n).join(' ');
      
      if (!name) return; // Skip if no name
      
      const company = data.company_name?.trim() || '';
      const role = data.designation?.trim() || '';
      const email = data.email?.trim() || '';
      
      // Add additional fields as attributes
      const attributes = {};
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
      
      const attributesMap = new Map(Object.entries(attributes));
      results.push({ 
        name, 
        company, 
        role, 
        email, 
        notes: '', 
        attributes: attributesMap 
      });
      
      // Insert batch
      if (results.length >= batchSize) {
        const batch = results.splice(0, batchSize);
        Contact.insertMany(batch, { ordered: false })
          .then(() => {
            totalImported += batch.length;
            console.log(`Imported: ${totalImported} contacts (Processed: ${totalProcessed})`);
          })
          .catch(err => console.error('Batch insert error:', err.message));
      }
    })
    .on('end', async () => {
      // Insert remaining contacts
      if (results.length > 0) {
        try {
          await Contact.insertMany(results, { ordered: false });
          totalImported += results.length;
        } catch (err) {
          console.error('Final batch error:', err.message);
        }
      }
      
      console.log('\n✓ Import completed!');
      console.log(`Total processed: ${totalProcessed}`);
      console.log(`Total imported: ${totalImported}`);
      
      setTimeout(() => {
        mongoose.connection.close();
        process.exit(0);
      }, 2000);
    })
    .on('error', (error) => {
      console.error('Import error:', error);
      mongoose.connection.close();
      process.exit(1);
    });
}

reprocessFile();
