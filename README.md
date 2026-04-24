# SRM BFHL Challenge (Single-Link Deployment)

This repo is cleaned to deploy as one link on Vercel:

- Frontend: `/`
- API endpoint: `POST /bfhl`

The API implements the hierarchy rules from the SRM challenge, including:

- strict edge validation (`X->Y`, uppercase single letters)
- invalid entry collection
- duplicate edge tracking (unique duplicate list)
- first-parent-wins handling for multi-parent children
- cycle detection by connected component
- tree depth and summary generation

## Identity Fields Used

- `user_id`: `khushalnarsaria_13072006`
- `email_id`: `kn4379@srmist.edu.in`
- `college_roll_number`: `RA2311026010175`

If needed, set env vars on Vercel to override:

- `BFHL_USER_ID`
- `BFHL_EMAIL_ID`
- `BFHL_ROLL_NUMBER`

## Project Structure

```txt
api/bfhl.js              # Vercel serverless API handler
lib/bfhlProcessor.js     # Core hierarchy processing logic
index.html               # Frontend page
app.js                   # Frontend behavior
App.css                  # Frontend styles
tests/bfhlProcessor.test.js
vercel.json              # rewrite /bfhl -> /api/bfhl
```

## Local Validation

```bash
npm install
npm test
```

## Deploy (One Link)

1. Push this repo to GitHub (public).
2. Go to Vercel and import the repo.
3. Framework preset: `Other` (or leave auto-detect).
4. Build command: leave empty.
5. Output directory: leave empty.
6. Deploy.

After deploy:

- frontend URL: `https://your-project.vercel.app`
- API URL for submission: `https://your-project.vercel.app/bfhl`

## Quick API Test

```bash
curl -X POST https://your-project.vercel.app/bfhl \
  -H "Content-Type: application/json" \
  -d "{\"data\":[\"A->B\",\"A->C\",\"B->D\"]}"
```

## Submission Fields

1. Hosted API base URL: `https://your-project.vercel.app`
2. Hosted frontend URL: `https://your-project.vercel.app`
3. Public GitHub repo URL
