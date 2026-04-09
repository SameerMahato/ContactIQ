const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Get comprehensive analytics and segmentation
router.get('/segments', async (req, res) => {
  try {
    // Get total count
    const totalContacts = await Contact.countDocuments({});
    
    // Use aggregation for efficient grouping
    const [stateGroups, cityGroups, roleGroups, companyGroups] = await Promise.all([
      // Group by state (from attributes.state)
      Contact.aggregate([
        { $group: { _id: '$attributes.state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      
      // Group by city (from attributes.city)
      Contact.aggregate([
        { $group: { _id: '$attributes.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      
      // Group by role
      Contact.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      
      // Group by company
      Contact.aggregate([
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    // Format results
    const states = stateGroups.map(g => ({
      name: g._id || 'Unknown',
      count: g.count,
      percentage: ((g.count / totalContacts) * 100).toFixed(1)
    }));
    
    const cities = cityGroups.map(g => ({
      name: g._id || 'Unknown',
      count: g.count,
      percentage: ((g.count / totalContacts) * 100).toFixed(1)
    }));
    
    const roles = roleGroups.map(g => ({
      name: g._id || 'Unknown',
      count: g.count,
      percentage: ((g.count / totalContacts) * 100).toFixed(1)
    }));
    
    const companies = companyGroups.map(g => ({
      name: g._id || 'Unknown',
      count: g.count,
      percentage: ((g.count / totalContacts) * 100).toFixed(1)
    }));
    
    res.json({
      totalContacts,
      segments: {
        byIndustry: states, // Using state as industry proxy
        byLocation: cities,
        byRole: roles,
        byCompany: companies
      },
      insights: generateInsights(states, cities, roles, companies, totalContacts)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate campaign recommendations
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = [];
    
    // Get top states for state-based campaigns
    const stateGroups = await Contact.aggregate([
      { $match: { 'attributes.state': { $exists: true, $ne: '' } } },
      { $group: { _id: '$attributes.state', count: { $sum: 1 } } },
      { $match: { count: { $gte: 1000 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    for (const group of stateGroups) {
      const sampleContacts = await Contact.find({ 'attributes.state': group._id })
        .limit(5)
        .select('name company role');
      
      campaigns.push({
        name: `${group._id} State Campaign`,
        segment: group._id,
        targetCount: group.count,
        strategy: `Targeted outreach to ${group.count.toLocaleString()} contacts in ${group._id}. Focus on regional events and local partnerships.`,
        contacts: sampleContacts.map(c => ({ name: c.name, company: c.company || 'N/A', role: c.role || 'N/A' }))
      });
    }
    
    // Get top cities for city-based campaigns
    const cityGroups = await Contact.aggregate([
      { $match: { 'attributes.city': { $exists: true, $ne: '' } } },
      { $group: { _id: '$attributes.city', count: { $sum: 1 } } },
      { $match: { count: { $gte: 500 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    for (const group of cityGroups) {
      const sampleContacts = await Contact.find({ 'attributes.city': group._id })
        .limit(5)
        .select('name company role');
      
      campaigns.push({
        name: `${group._id} City Event`,
        segment: group._id,
        targetCount: group.count,
        strategy: `Host networking event in ${group._id} for ${group.count.toLocaleString()} local contacts.`,
        contacts: sampleContacts.map(c => ({ name: c.name, company: c.company || 'N/A', role: c.role || 'N/A' }))
      });
    }
    
    // Application status campaigns
    const statusGroups = await Contact.aggregate([
      { $match: { 'attributes.application_status': { $exists: true, $ne: '' } } },
      { $group: { _id: '$attributes.application_status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    
    for (const group of statusGroups) {
      const sampleContacts = await Contact.find({ 'attributes.application_status': group._id })
        .limit(5)
        .select('name company role');
      
      campaigns.push({
        name: `${group._id} Follow-up Campaign`,
        segment: group._id,
        targetCount: group.count,
        strategy: `Follow up with ${group.count.toLocaleString()} contacts in ${group._id} status. Personalized messaging based on application stage.`,
        contacts: sampleContacts.map(c => ({ name: c.name, company: c.company || 'N/A', role: c.role || 'N/A' }))
      });
    }
    
    res.json({
      totalCampaigns: campaigns.length,
      campaigns: campaigns
    });
  } catch (error) {
    console.error('Campaign error:', error);
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
