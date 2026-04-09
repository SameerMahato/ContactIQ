const express = require('express');
const router = express.Router();
const axios = require('axios');
const Contact = require('../models/Contact');

const extractKeywords = (text) => {
  const stopWords = ['who', 'what', 'where', 'when', 'how', 'why', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'in', 'at', 'to', 'for', 'about', 'tell', 'me', 'show', 'find', 'search', 'get', 'give', 'my', 'your', 'their'];
  return text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .join(' ');
};

const searchContacts = async (query) => {
  const keywords = extractKeywords(query);
  
  if (!keywords.trim()) {
    // If no keywords after filtering, use original query
    const regex = new RegExp(query.split(/\s+/).join('|'), 'i');
    return await Contact.find({
      $or: [
        { name: regex },
        { company: regex },
        { role: regex },
        { email: regex },
        { notes: regex }
      ]
    }).limit(20).select('-__v');
  }
  
  // Try text search first
  try {
    const textSearch = await Contact.find({ $text: { $search: keywords } })
      .limit(20)
      .select('-__v');
    
    if (textSearch.length > 0) return textSearch;
  } catch (e) {
    // Text index might not exist, continue to regex search
  }
  
  // Fallback to regex search with partial matching
  const searchTerms = keywords.split(' ').filter(t => t.length > 0);
  const regex = new RegExp(searchTerms.join('|'), 'i');
  
  return await Contact.find({
    $or: [
      { name: regex },
      { company: regex },
      { role: regex },
      { email: regex },
      { notes: regex }
    ]
  }).limit(20).select('-__v');
};

router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    const relevantContacts = await searchContacts(message);
    
    let fullPrompt;
    
    if (relevantContacts.length > 0) {
      // Format contacts in a readable way
      const contactsList = relevantContacts.map((c, i) => {
        let info = `${i + 1}. ${c.name}`;
        if (c.company) info += ` - ${c.company}`;
        if (c.role) info += ` (${c.role})`;
        if (c.email) info += `\n   Email: ${c.email}`;
        if (c.notes) info += `\n   Notes: ${c.notes}`;
        if (c.attributes && c.attributes.size > 0) {
          const attrs = Array.from(c.attributes.entries())
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          info += `\n   Additional: ${attrs}`;
        }
        return info;
      }).join('\n\n');
      
      fullPrompt = `You are a contact database assistant. Answer the user's question using ONLY the contact information provided below. Do NOT make up information or say you're "looking up" data - the data is already here.

CONTACT DATA:
${contactsList}

USER QUESTION: ${message}

INSTRUCTIONS:
- Answer directly using the contact information above
- If asked about a specific person, provide their details from the list
- If multiple contacts match, list them all
- If no contacts match, say "I couldn't find any contacts matching that query"
- Be concise and factual`;
    } else {
      fullPrompt = `You are a contact database assistant. The user asked: "${message}"

I searched the contacts database but found no matching contacts. Please inform the user that no contacts were found matching their query, and suggest they try:
- Checking the spelling
- Using different keywords
- Browsing the contacts list in the sidebar`;
    }
    
    // Try multiple models in order of preference
    const models = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash'
    ];
    
    let lastError = null;
    
    for (const model of models) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }]
          },
          { timeout: 10000 }
        );
        
        const reply = response.data.candidates[0].content.parts[0].text;
        
        return res.json({
          reply,
          contactsUsed: relevantContacts.length,
          modelUsed: model
        });
      } catch (error) {
        lastError = error;
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError;
    
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || 'AI service temporarily unavailable. Please try again in a moment.' 
    });
  }
});

module.exports = router;
