const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Get comprehensive analytics and segmentation
router.get('/segments', async (req, res) => {
  try {
    const contacts = await Contact.find({});
    
    // Industry segmentation
    const industryMap = new Map();
    const locationMap = new Map();
    const roleMap = new Map();
    const companyMap = new Map();
    
    contacts.forEach(contact => {
      // Industry analysis
      const industry = contact.attributes?.get('Industry') || 'Unknown';
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
      
      // Location analysis
      const location = contact.attributes?.get('Location') || 'Unknown';
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
      
      // Role analysis
      const role = contact.role || 'Unknown';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
      
      // Company analysis
      const company = contact.company || 'Unknown';
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    });
    
    // Convert to sorted arrays
    const industries = Array.from(industryMap.entries())
      .map(([name, count]) => ({ name, count, percentage: ((count / contacts.length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
    
    const locations = Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count, percentage: ((count / contacts.length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
    
    const roles = Array.from(roleMap.entries())
      .map(([name, count]) => ({ name, count, percentage: ((count / contacts.length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
    
    const companies = Array.from(companyMap.entries())
      .map(([name, count]) => ({ name, count, percentage: ((count / contacts.length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 companies
    
    res.json({
      totalContacts: contacts.length,
      segments: {
        byIndustry: industries,
        byLocation: locations,
        byRole: roles,
        byCompany: companies
      },
      insights: generateInsights(industries, locations, roles, companies, contacts.length)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate campaign recommendations
router.get('/campaigns', async (req, res) => {
  try {
    const contacts = await Contact.find({});
    
    const campaigns = [];
    
    // Group contacts by industry
    const industryGroups = new Map();
    contacts.forEach(contact => {
      const industry = contact.attributes?.get('Industry') || 'Unknown';
      if (!industryGroups.has(industry)) {
        industryGroups.set(industry, []);
      }
      industryGroups.get(industry).push(contact);
    });
    
    // Generate industry-specific campaigns
    industryGroups.forEach((contactList, industry) => {
      if (industry !== 'Unknown' && contactList.length >= 3) {
        campaigns.push({
          name: `${industry} Outreach Campaign`,
          segment: industry,
          targetCount: contactList.length,
          strategy: getCampaignStrategy(industry),
          contacts: contactList.slice(0, 5).map(c => ({ name: c.name, company: c.company, role: c.role }))
        });
      }
    });
    
    // Location-based campaigns
    const locationGroups = new Map();
    contacts.forEach(contact => {
      const location = contact.attributes?.get('Location') || 'Unknown';
      if (!locationGroups.has(location)) {
        locationGroups.set(location, []);
      }
      locationGroups.get(location).push(contact);
    });
    
    locationGroups.forEach((contactList, location) => {
      if (location !== 'Unknown' && contactList.length >= 5) {
        campaigns.push({
          name: `${location} Regional Event`,
          segment: location,
          targetCount: contactList.length,
          strategy: `Host an in-person networking event or workshop in ${location} to engage local contacts`,
          contacts: contactList.slice(0, 5).map(c => ({ name: c.name, company: c.company, role: c.role }))
        });
      }
    });
    
    // Role-based campaigns
    const seniorRoles = contacts.filter(c => 
      c.role && (c.role.includes('VP') || c.role.includes('CTO') || c.role.includes('Director') || c.role.includes('Manager'))
    );
    
    if (seniorRoles.length >= 3) {
      campaigns.push({
        name: 'Executive Leadership Campaign',
        segment: 'Senior Leadership',
        targetCount: seniorRoles.length,
        strategy: 'Personalized outreach focusing on strategic partnerships, thought leadership content, and executive briefings',
        contacts: seniorRoles.slice(0, 5).map(c => ({ name: c.name, company: c.company, role: c.role }))
      });
    }
    
    res.json({
      totalCampaigns: campaigns.length,
      campaigns: campaigns
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateInsights(industries, locations, roles, companies, total) {
  const insights = [];
  
  // Industry insights
  if (industries.length > 0 && industries[0].count > total * 0.2) {
    insights.push({
      type: 'Industry Concentration',
      finding: `${industries[0].name} represents ${industries[0].percentage}% of your contacts`,
      recommendation: `Consider diversifying outreach or doubling down on ${industries[0].name} expertise`
    });
  }
  
  // Location insights
  if (locations.length > 0) {
    const topLocations = locations.slice(0, 3);
    insights.push({
      type: 'Geographic Distribution',
      finding: `Top 3 locations: ${topLocations.map(l => `${l.name} (${l.percentage}%)`).join(', ')}`,
      recommendation: 'Consider hosting regional events or meetups in these high-concentration areas'
    });
  }
  
  // Role insights
  const seniorRoles = roles.filter(r => 
    r.name.includes('VP') || r.name.includes('CTO') || r.name.includes('Director') || r.name.includes('Manager')
  );
  const seniorCount = seniorRoles.reduce((sum, r) => sum + r.count, 0);
  
  insights.push({
    type: 'Seniority Analysis',
    finding: `${((seniorCount / total) * 100).toFixed(1)}% of contacts hold senior positions`,
    recommendation: seniorCount > total * 0.3 
      ? 'Strong executive network - focus on strategic partnerships and thought leadership'
      : 'Consider expanding senior-level connections for strategic influence'
  });
  
  // Company diversity
  insights.push({
    type: 'Company Diversity',
    finding: `Contacts span ${companies.length} different companies`,
    recommendation: companies.length > 20 
      ? 'Broad network - segment campaigns by industry or use case'
      : 'Consider expanding to more companies for wider market reach'
  });
  
  return insights;
}

function getCampaignStrategy(industry) {
  const strategies = {
    'AI Infrastructure': 'Focus on scalability, performance benchmarks, and cost optimization. Share case studies on AI workload management.',
    'Fintech': 'Emphasize security, compliance, and transaction speed. Highlight payment processing innovations.',
    'AI Research': 'Share cutting-edge research, invite to technical workshops, and offer early access to new AI tools.',
    'Cloud Computing': 'Discuss multi-cloud strategies, cost optimization, and infrastructure automation.',
    'Social Media': 'Focus on user engagement metrics, content moderation tools, and scalability solutions.',
    'E-commerce': 'Highlight conversion optimization, personalization engines, and inventory management.',
    'Automotive': 'Discuss IoT integration, autonomous systems, and real-time data processing.',
    'Entertainment': 'Focus on content delivery, recommendation algorithms, and user analytics.',
    'Transportation': 'Emphasize real-time tracking, route optimization, and payment integration.'
  };
  
  return strategies[industry] || 'Personalized outreach based on company needs and industry trends';
}

module.exports = router;
