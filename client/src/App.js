import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

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

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Contacts</h2>
          <div>
            <button className="btn btn-primary" onClick={createContact}>
              + New Contact
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
        <div className="contacts-list">
          {contacts.map(contact => (
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
      </div>
    </div>
  );
}

export default App;
