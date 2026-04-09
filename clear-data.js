const axios = require('axios');

async function clearData() {
  try {
    console.log('Clearing all contacts from database...');
    const response = await axios.delete('http://localhost:5000/api/contacts/clear-all');
    console.log('✅ Success:', response.data.message);
    console.log('\nYou can now import your new CSV file (chat_states_10k.csv) using the Import CSV button in the app.');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

clearData();
