const express = require('express');
const router = express.Router();
const axios = require('axios');
const Contact = require('../models/Contact');

const extractKeywords = (text) => {
  const stopWords = ['who', 'what', 'where', 'when', 'how', 'is', 'are', 'the', 'a', 'an', 'in', 'at', 'to', 'for'];
  return text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .join(' ');
};

const searchContacts = async (query) => {
  const keywords = extractKeywords(query);
  
  const textSearch = await Contact.find({ $text: { $search: keywords } })
    .limit(20)
    .select('-__v');
  
  if (textSearch.length > 0) return textSearch;
  
  const regex = new RegExp(keywords.split(' ').join('|'), 'i');
  return await Contact.find({
    $or: [
      { name: regex },
      { company: regex },
      { role: regex },
      { notes: regex }
    ]
  }).limit(20).select('-__v');
};

router.post('/message', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    const relevantContacts = await searchContacts(message);
    
    const contactContext = relevantContacts.length > 0
      ? `\n\nRelevant contacts from database:\n${JSON.stringify(relevantContacts, null, 2)}`
      : '';
    
    const systemPrompt = `You are a helpful assistant with access to a contacts database. When users ask about contacts, use the provided contact information to answer accurately.${contactContext}`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      }
    );
    
    const reply = response.data.candidates[0].content.parts[0].text;
    
    res.json({
      reply,
      contactsUsed: relevantContacts.length
    });
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
