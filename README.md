# SRM BFHL Challenge - Single Link Deployment

This project is cleaned to run as one hosted app with:

- frontend at `/`
- API at `POST /bfhl`

## Identity Fields

- `user_id`: `khushalnarsaria_13072006`
- `email_id`: `kn4379@srmist.edu.in`
- `college_roll_number`: `RA2311026010175`

You can override these via env vars:

- `BFHL_USER_ID`
- `BFHL_EMAIL_ID`
- `BFHL_ROLL_NUMBER`

## Structure

```txt
server.js                  # single Node server for frontend + /bfhl
index.html                 # frontend page
app.js                     # frontend logic
App.css                    # frontend styling
lib/bfhlProcessor.js       # hierarchy algorithm
api/bfhl.js                # optional Vercel serverless handler
tests/bfhlProcessor.test.js
vercel.json
```

## Local Run

```bash
npm install
npm test
npm start
```

Open `http://localhost:5000`

## Render Deployment (Single Link)

1. Push repo to GitHub (public).
2. In Render: `New` -> `Web Service` -> connect repo.
3. Use these settings:
   - Root Directory: leave empty
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Deploy.

After deploy, both URLs are on the same domain:

- frontend: `https://your-service.onrender.com`
- API: `https://your-service.onrender.com/bfhl`

## Important Fix for Your Current Render Error

If your existing service still has:

- build command: `cd backend && npm install`
- start command: `cd backend && npm start`

change them to:

- `npm install`
- `npm start`

Then click `Manual Deploy` -> `Deploy latest commit`.

## Submission Values

1. Hosted API base URL: `https://your-service.onrender.com`
2. Hosted frontend URL: `https://your-service.onrender.com`
3. GitHub repo URL
