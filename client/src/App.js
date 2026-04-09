import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const res = await axios.get('/api/contacts?limit=100');
      setContacts(res.data.contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [segmentsRes, campaignsRes] = await Promise.all([
        axios.get('/api/analytics/segments'),
        axios.get('/api/analytics/campaigns')
      ]);
      setAnalytics({
        segments: segmentsRes.data,
        campaigns: campaignsRes.data
      });
      setShowAnalytics(true);
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Failed to load analytics');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/contacts/import', formData);
      alert(res.data.message);
      loadContacts();
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat/message', {
        message: input,
        history: messages
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    const name = prompt('Contact name:');
    if (!name) return;

    const company = prompt('Company:');
    const role = prompt('Role:');
    const email = prompt('Email:');

    try {
      await axios.post('/api/contacts', { name, company, role, email });
      loadContacts();
    } catch (error) {
      alert('Error creating contact: ' + error.message);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.role?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Contacts</h2>
          <div>
            <button className="btn btn-primary" onClick={createContact}>
              + New Contact
            </button>
            <button className="btn btn-secondary" onClick={loadAnalytics}>
              📊 Analytics
            </button>
            <label className="btn btn-secondary">
              Import CSV
              <input
                type="file"
                className="file-input"
                accept=".csv"
                onChange={handleImport}
                disabled={importing}
              />
            </label>
          </div>
          {importing && <div className="loading">Importing...</div>}
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="contacts-list">
          {filteredContacts.map(contact => (
            <div
              key={contact._id}
              className={`contact-item ${selectedContact?._id === contact._id ? 'active' : ''}`}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="contact-name">{contact.name}</div>
              <div className="contact-company">{contact.company || 'No company'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        {showAnalytics && analytics ? (
          <div className="analytics-container">
            <div className="analytics-header">
              <h2>Contact Analytics & Campaign Insights</h2>
              <button className="btn btn-secondary" onClick={() => setShowAnalytics(false)}>
                ← Back to Chat
              </button>
            </div>

            <div className="analytics-summary">
              <div className="stat-card">
                <h3>{analytics.segments.totalContacts}</h3>
                <p>Total Contacts</p>
              </div>
              <div className="stat-card">
                <h3>{analytics.segments.segments.byIndustry.length}</h3>
                <p>Industries</p>
              </div>
              <div className="stat-card">
                <h3>{analytics.segments.segments.byLocation.length}</h3>
                <p>Locations</p>
              </div>
              <div className="stat-card">
                <h3>{analytics.campaigns.totalCampaigns}</h3>
                <p>Campaign Opportunities</p>
              </div>
            </div>

            <div className="analytics-section">
              <h3>📊 Demographic Segments</h3>
              
              <div className="segment-group">
                <h4>By Industry</h4>
                <div className="segment-list">
                  {analytics.segments.segments.byIndustry.map((item, idx) => (
                    <div key={idx} className="segment-item">
                      <span className="segment-name">{item.name}</span>
                      <span className="segment-bar" style={{width: `${item.percentage}%`}}></span>
                      <span className="segment-count">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="segment-group">
                <h4>By Location</h4>
                <div className="segment-list">
                  {analytics.segments.segments.byLocation.map((item, idx) => (
                    <div key={idx} className="segment-item">
                      <span className="segment-name">{item.name}</span>
                      <span className="segment-bar" style={{width: `${item.percentage}%`}}></span>
                      <span className="segment-count">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="segment-group">
                <h4>By Role</h4>
                <div className="segment-list">
                  {analytics.segments.segments.byRole.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="segment-item">
                      <span className="segment-name">{item.name}</span>
                      <span className="segment-bar" style={{width: `${item.percentage}%`}}></span>
                      <span className="segment-count">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>💡 Key Insights</h3>
              <div className="insights-list">
                {analytics.segments.insights.map((insight, idx) => (
                  <div key={idx} className="insight-card">
                    <h4>{insight.type}</h4>
                    <p className="insight-finding">{insight.finding}</p>
                    <p className="insight-recommendation">💡 {insight.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h3>🎯 Recommended Campaigns</h3>
              <div className="campaigns-list">
                {analytics.campaigns.campaigns.map((campaign, idx) => (
                  <div key={idx} className="campaign-card">
                    <h4>{campaign.name}</h4>
                    <div className="campaign-meta">
                      <span className="campaign-segment">Segment: {campaign.segment}</span>
                      <span className="campaign-target">Target: {campaign.targetCount} contacts</span>
                    </div>
                    <p className="campaign-strategy">{campaign.strategy}</p>
                    <div className="campaign-contacts">
                      <strong>Sample contacts:</strong>
                      <ul>
                        {campaign.contacts.map((contact, cidx) => (
                          <li key={cidx}>{contact.name} - {contact.role} at {contact.company}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-container">
          {selectedContact && (
            <div className="contact-detail">
              <h3>{selectedContact.name}</h3>
              {selectedContact.company && (
                <div className="detail-row">
                  <div className="detail-label">Company</div>
                  <div className="detail-value">{selectedContact.company}</div>
                </div>
              )}
              {selectedContact.role && (
                <div className="detail-row">
                  <div className="detail-label">Role</div>
                  <div className="detail-value">{selectedContact.role}</div>
                </div>
              )}
              {selectedContact.email && (
                <div className="detail-row">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{selectedContact.email}</div>
                </div>
              )}
              {selectedContact.notes && (
                <div className="detail-row">
                  <div className="detail-label">Notes</div>
                  <div className="detail-value">{selectedContact.notes}</div>
                </div>
              )}
              {selectedContact.attributes && Object.keys(selectedContact.attributes).length > 0 && (
                <div className="attributes">
                  <div className="detail-label">Additional Attributes</div>
                  {Object.entries(selectedContact.attributes).map(([key, value]) => (
                    <div key={key} className="attribute-item">
                      <span className="attribute-key">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="loading">Thinking...</div>}
          </div>

          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your contacts..."
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
