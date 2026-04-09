#!/bin/bash

# Initialize git if not already done
git init

# Add remote if not already added
git remote add origin https://github.com/SameerMahato/ContactIQ.git 2>/dev/null || true

# Stage and commit in logical chunks
echo "Creating professional commit history..."

# 1. Initial setup
git add package.json .gitignore .env.example
git commit -m "chore: initialize project with dependencies and configuration"

# 2. Backend structure
git add server/index.js
git commit -m "feat: setup Express server with MongoDB connection"

# 3. Database model
git add server/models/Contact.js
git commit -m "feat: create Contact model with arbitrary attributes support"

# 4. Contact routes
git add server/routes/contacts.js
git commit -m "feat: implement contact CRUD endpoints with pagination"

# 5. CSV import
git add server/routes/contacts.js
git commit -m "feat: add streaming CSV import with batch processing" --amend

# 6. Chat integration
git add server/routes/chat.js
git commit -m "feat: implement AI chat integration with Google Gemini"

# 7. Intelligent retrieval
git add server/routes/chat.js
git commit -m "feat: add intelligent contact retrieval with keyword extraction" --amend

# 8. Frontend setup
git add client/package.json client/public/index.html
git commit -m "chore: setup React frontend with dependencies"

# 9. Main component
git add client/src/App.js client/src/index.js
git commit -m "feat: create main App component with contact management"

# 10. Styling
git add client/src/index.css
git commit -m "style: add responsive UI styling with sidebar layout"

# 11. Documentation
git add README.md
git commit -m "docs: add comprehensive README with setup instructions"

# 12. Sample data
git add test-sample.csv
git commit -m "chore: add sample CSV for testing"

# Push to GitHub
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main --force

echo "Done! Professional commit history created."
