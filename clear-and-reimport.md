# Clear and Re-import Contacts

## Problem Fixed
The CSV import wasn't properly storing Industry and Location in the attributes Map, causing analytics to show "Unknown" for everything.

## What Was Fixed
- Attributes are now properly converted to MongoDB Map type
- Data is trimmed to remove whitespace
- Proper Map structure: `new Map(Object.entries(attributes))`

## How to Re-import with Fixed Data

### Option 1: Using Browser Console

1. Open your app: `http://localhost:3000`
2. Open browser console (F12)
3. Run this command to clear all contacts:

```javascript
fetch('http://localhost:5000/api/contacts/clear-all', { method: 'DELETE' })
  .then(r => r.json())
  .then(d => console.log(d))
```

4. Click "Import CSV" and select `test-sample.csv` again
5. Wait 2 seconds and refresh
6. Click "📊 Analytics" to see proper data

### Option 2: Using curl

```bash
# Clear all contacts
curl -X DELETE http://localhost:5000/api/contacts/clear-all

# Then import via UI
```

### Option 3: Direct MongoDB

If you have MongoDB Compass or mongosh:

```javascript
// Connect to your database
use librechat-contacts

// Clear all contacts
db.contacts.deleteMany({})

// Verify
db.contacts.countDocuments()
```

Then import via the UI.

## Expected Results After Re-import

### Analytics Dashboard Should Show:

**Industries:**
- AI Infrastructure: 2 contacts (20%)
- Fintech: 1 contact (10%)
- AI Research: 1 contact (10%)
- Cloud Computing: 2 contacts (20%)
- Social Media: 1 contact (10%)
- E-commerce: 1 contact (10%)
- Automotive: 1 contact (10%)
- Entertainment: 1 contact (10%)
- Transportation: 1 contact (10%)

**Locations:**
- San Francisco: 3 contacts (30%)
- Seattle: 2 contacts (20%)
- Mountain View: 1 contact (10%)
- Redmond: 1 contact (10%)
- Menlo Park: 1 contact (10%)
- Palo Alto: 1 contact (10%)
- Los Gatos: 1 contact (10%)

**Roles:**
- CTO: 1 contact
- VP Engineering: 1 contact
- Research Scientist: 1 contact
- Product Manager: 1 contact
- Senior Engineer: 1 contact
- Engineering Manager: 1 contact
- Solutions Architect: 1 contact
- Software Engineer: 1 contact
- Data Scientist: 1 contact
- Backend Engineer: 1 contact

### Campaign Recommendations Should Include:

1. **AI Infrastructure Outreach Campaign** (2 contacts)
2. **Cloud Computing Outreach Campaign** (2 contacts)
3. **San Francisco Regional Event** (3 contacts)
4. **Executive Leadership Campaign** (multiple senior roles)

## Verification

After re-importing, check:

1. ✅ Analytics shows actual industry names (not "Unknown")
2. ✅ Analytics shows actual locations (not "Unknown")
3. ✅ Campaign recommendations are generated
4. ✅ Insights are meaningful

## Why This Happened

The previous code was passing attributes as a plain JavaScript object:
```javascript
{ name, company, role, email, notes, attributes }
```

But MongoDB's Map type requires explicit conversion:
```javascript
{ 
  name, 
  company, 
  role, 
  email, 
  notes, 
  attributes: new Map(Object.entries(attributes)) 
}
```

Now it's fixed and will work correctly!
