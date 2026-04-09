# Quick Test Guide for Analytics Feature

## Step-by-Step Instructions

### 1. Start the Application
```bash
# In your project root directory
npm run dev
```

Wait for both servers to start:
- ✓ Server running on port 5000
- ✓ Client running on port 3000

### 2. Open in Browser
Navigate to: `http://localhost:3000`

### 3. Import Sample Data
- Click **"Import CSV"** button (purple button in sidebar)
- Select the file: `test-sample.csv`
- Wait for "Imported X contacts" message

### 4. View Analytics
- Click **"📊 Analytics"** button (next to Import CSV)
- The analytics dashboard will load

### 5. What You'll See

#### Summary Statistics (Top)
Four cards showing:
- Total Contacts
- Number of Industries
- Number of Locations  
- Campaign Opportunities

#### Demographic Segments
Three sections with bar charts:

**By Industry:**
- Shows distribution across AI Infrastructure, Fintech, Cloud, etc.
- Each row has: Industry name | Visual bar | Count (Percentage)

**By Location:**
- Geographic distribution
- San Francisco, Seattle, New York, etc.

**By Role:**
- Job titles and seniority levels
- CTO, VP, Manager, Engineer, etc.

#### Key Insights
Cards with actionable recommendations:
- Industry concentration analysis
- Geographic distribution insights
- Seniority analysis
- Company diversity metrics

#### Recommended Campaigns
Detailed campaign cards showing:
- Campaign name (e.g., "AI Infrastructure Outreach Campaign")
- Target segment
- Number of contacts to target
- Specific strategy for that segment
- Sample contacts (5 examples with names, roles, companies)

### 6. Navigate Back
Click **"← Back to Chat"** button to return to the main view

## API Testing (Alternative Method)

If you prefer to see raw JSON data:

### Test Segments Endpoint
```bash
curl http://localhost:5000/api/analytics/segments
```

Or open in browser: `http://localhost:5000/api/analytics/segments`

### Test Campaigns Endpoint
```bash
curl http://localhost:5000/api/analytics/campaigns
```

Or open in browser: `http://localhost:5000/api/analytics/campaigns`

## Expected Results

### Sample Segments Output
```json
{
  "totalContacts": 10,
  "segments": {
    "byIndustry": [
      { "name": "AI Infrastructure", "count": 3, "percentage": "30.0" },
      { "name": "Fintech", "count": 2, "percentage": "20.0" }
    ],
    "byLocation": [
      { "name": "San Francisco", "count": 4, "percentage": "40.0" }
    ]
  },
  "insights": [
    {
      "type": "Industry Concentration",
      "finding": "AI Infrastructure represents 30.0% of your contacts",
      "recommendation": "Consider doubling down on AI Infrastructure expertise"
    }
  ]
}
```

### Sample Campaign Output
```json
{
  "totalCampaigns": 3,
  "campaigns": [
    {
      "name": "AI Infrastructure Outreach Campaign",
      "segment": "AI Infrastructure",
      "targetCount": 3,
      "strategy": "Focus on scalability, performance benchmarks...",
      "contacts": [
        { "name": "John Doe", "company": "Acme Corp", "role": "CTO" }
      ]
    }
  ]
}
```

## Troubleshooting

### Analytics button not visible?
- Make sure you've imported contacts first
- Refresh the page

### No data showing?
- Verify contacts were imported successfully
- Check browser console for errors (F12)
- Verify backend is running on port 5000

### API returns empty data?
- Make sure MongoDB is running
- Check that contacts have Industry and Location attributes
- Verify the CSV import completed successfully

## Screenshots Location

After testing, you can take screenshots and save them to:
`docs/screenshots/analytics-dashboard.png`

This will help document the feature visually.
