# LibreChat Contacts Integration

A fullstack contacts workspace that integrates with LibreChat's AI assistant, enabling natural language queries about stored contacts.



*AI-powered contact search showing results for "Ekaja" query*

## Features

- ✅ Contact management (create, view, list)
- ✅ CSV import with streaming for large datasets (1K, 10K, 1M contacts)
- ✅ Arbitrary attributes support (Industry, Location, Tags, etc.)
- ✅ AI-powered chat integration with contact context
- ✅ Intelligent contact retrieval (only relevant contacts sent to AI)
- ✅ Clean, minimal UI with sidebar navigation
- ✅ Advanced analytics and demographic segmentation
- ✅ Campaign recommendations based on contact patterns

## Architecture

### Tech Stack
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React
- **AI Integration**: Google Gemini API
- **CSV Processing**: Streaming parser for memory efficiency

### Design Decisions

#### 1. Contact Data Model
```javascript
{
  name: String (required, indexed),
  company: String (indexed),
  role: String,
  email: String,
  notes: String,
  attributes: Map<String, String>, // Arbitrary key-value pairs
  createdAt: Date
}
```

**Why MongoDB Map type?**
- Flexible schema for arbitrary attributes
- No need to predefine fields
- Efficient querying and storage
- Maintains type safety

#### 2. CSV Import Strategy
- **Streaming approach**: Processes files line-by-line
- **Batch inserts**: 1000 records at a time
- **Memory efficient**: Handles 1M+ contacts without loading entire file
- **Error resilient**: Continues on individual record failures

#### 3. AI Integration Approach
**Chosen: Context Injection with Intelligent Retrieval**

Instead of sending all contacts, the system:
1. Extracts keywords from user query
2. Uses MongoDB text search to find relevant contacts
3. Falls back to regex search if text search yields no results
4. Injects only top 20 relevant contacts into AI context

**Why this approach?**
- Simple to implement and maintain
- Works reliably without complex function calling setup
- Reduces token usage significantly
- Provides good accuracy for most queries

**Alternative approaches considered:**
- Function calling: More complex, requires careful prompt engineering
- Vector embeddings: Overkill for structured data, adds latency
- Send all contacts: Exceeds token limits, expensive

#### 4. Relevance Algorithm
```javascript
1. Extract keywords (remove stop words)
2. MongoDB text search on name, company, role, notes
3. If no results, regex search across same fields
4. Limit to top 20 results
5. Inject into system prompt
```

## Setup Instructions

### Prerequisites
- Node.js 16+
- MongoDB running locally or connection string
- Google API key for Gemini

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd librechat-contacts
```

2. Install dependencies
```bash
npm run install-all
```

3. Configure environment
```bash
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

4. Start MongoDB (if local)
```bash
mongod
```

5. Run the application
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Importing Contacts

1. Click "Import CSV" in the sidebar
2. Select one of the provided CSV files:
   - chat_states_1k.csv (1,000 contacts)
   - chat_states_10k.csv (10,000 contacts)
   - chat_states_1M.csv (1,000,000 contacts)
3. Wait for import confirmation

**Note**: Large imports (1M) may take 2-5 minutes depending on hardware.

## Usage Examples

### Creating a Contact
1. Click "+ New Contact"
2. Fill in the prompts
3. Contact appears in sidebar

### Asking Questions
Type natural language queries in the chat:
- "Who works at Acme Corp?"
- "List all CTOs"
- "What do we know about John Doe?"
- "Which contacts are interested in AI infrastructure?"
- "Show me contacts in San Francisco"

The AI will search your contacts and provide relevant answers.

### Analytics & Campaign Insights
Click the "📊 Analytics" button to view:
- Demographic segmentation by industry, location, and role
- Contact distribution patterns
- Key insights about your network
- Recommended targeted campaigns with strategies
- Sample contacts for each campaign segment

The analytics engine automatically identifies:
- Industry concentrations
- Geographic clusters
- Seniority distribution
- Campaign opportunities based on segments

## Design Questions

### 1. If the system needed to support 1,000,000 contacts, how would you redesign it?

**Current implementation already handles 1M contacts**, but for production scale:

**Database optimizations:**
- Add compound indexes: `{ company: 1, role: 1 }`
- Implement database sharding for horizontal scaling
- Use read replicas for query distribution
- Add caching layer (Redis) for frequent queries

**Search improvements:**
- Implement Elasticsearch for advanced full-text search
- Add vector embeddings for semantic search
- Pre-compute common query results
- Implement search result caching

**API optimizations:**
- Add pagination to all endpoints (already implemented)
- Implement GraphQL for flexible queries
- Add rate limiting and request throttling
- Use CDN for static assets

**Infrastructure:**
- Deploy on container orchestration (Kubernetes)
- Implement horizontal pod autoscaling
- Add load balancer for traffic distribution
- Use managed MongoDB service (Atlas)

### 2. How would you ensure the assistant retrieves the most relevant contacts for a query?

**Current approach:**
- Keyword extraction + MongoDB text search
- Regex fallback for partial matches
- Limit to top 20 results

**Improvements for better relevance:**

**Short-term (next iteration):**
- Add TF-IDF scoring for keyword importance
- Implement query expansion (synonyms)
- Add fuzzy matching for typos
- Weight fields differently (name > company > notes)

**Medium-term:**
- Use vector embeddings (sentence-transformers)
- Implement semantic similarity search
- Add user feedback loop (thumbs up/down)
- Learn from query patterns

**Long-term:**
- Fine-tune embedding model on contact data
- Implement hybrid search (keyword + semantic)
- Add personalization based on user history
- Use LLM to generate search queries from natural language

**Query understanding:**
- Extract entities (company names, roles, locations)
- Identify query intent (list, find, compare)
- Use LLM to reformulate ambiguous queries

### 3. What are the limitations of your current implementation?

**Search limitations:**
- Basic keyword matching may miss semantic queries
- No support for complex boolean queries
- Limited handling of typos and variations
- No ranking beyond text search score

**Scalability limitations:**
- Single MongoDB instance (no sharding)
- No caching layer
- Synchronous CSV import blocks the request
- No background job processing

**Feature limitations:**
- No contact editing or deletion
- No contact tagging or categorization
- No contact deduplication
- No export functionality
- No contact history/audit trail

**AI integration limitations:**
- Fixed 20-contact limit may miss relevant results
- No multi-turn context awareness
- No clarifying questions when query is ambiguous
- No confidence scoring for answers

**Security limitations:**
- No authentication or authorization
- No input validation/sanitization
- No rate limiting
- API keys in environment variables (should use secrets manager)

**UX limitations:**
- No real-time updates
- Basic error handling
- No loading states for long operations
- No search within contacts list
- No bulk operations

**Production readiness:**
- No logging or monitoring
- No error tracking (Sentry)
- No analytics
- No automated tests
- No CI/CD pipeline

## API Endpoints

### Contacts
- `GET /api/contacts` - List contacts (paginated)
- `GET /api/contacts/:id` - Get single contact
- `POST /api/contacts` - Create contact
- `POST /api/contacts/import` - Import CSV
- `POST /api/contacts/search` - Search contacts

### Chat
- `POST /api/chat/message` - Send message to AI

### Analytics
- `GET /api/analytics/segments` - Get demographic segmentation analysis
- `GET /api/analytics/campaigns` - Get campaign recommendations

## Project Structure

```
├── server/
│   ├── index.js           # Express server
│   ├── models/
│   │   └── Contact.js     # Mongoose model
│   └── routes/
│       ├── contacts.js    # Contact CRUD + import
│       └── chat.js        # AI integration
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Styles
│   └── package.json
├── package.json
├── .env.example
└── README.md
```

## Time Spent

- Architecture planning: 1 hour
- Backend implementation: 2.5 hours
- Frontend implementation: 2 hours
- AI integration: 1.5 hours
- Testing and refinement: 1 hour
- Documentation: 1 hour

**Total: ~9 hours**

## Future Enhancements

1. **Contact editing and deletion**
2. **Advanced search with filters**
3. **Contact tagging and categories**
4. **Export to CSV**
5. **Duplicate detection**
6. **Contact merge functionality**
7. **Activity timeline**
8. **Email integration**
9. **Authentication and multi-user support**
10. **Real-time collaboration**

## License

MIT
