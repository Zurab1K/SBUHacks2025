# Auto Notes to Sheets (Frontend)

Production-ready React + Vite experience for “Auto Notes to Sheets,” a tool that converts raw sales or CS call transcripts into structured notes that can be exported to Google Sheets.

## Features

- **Transcript ingestion** – Upload files or paste raw transcript text, capture call metadata, and kick off AI processing.
- **AI notes dashboard** – See every processed call in an interactive table with summaries, next steps, sentiment, and objection tracking.
- **Detail view** – Inspect individual calls with executive summaries, action items, tags, and metadata.
- **Sheets settings** – Manage Google Sheet destinations, auto-sync cadence, and integration health checks.
- **CSV export** – One-click export mirrors the Google Sheet schema for quick RevOps handoffs.

## Tech stack

- React 18 + TypeScript + Vite
- React Router for client-side routing
- Tailwind CSS for responsive UI

## Getting started

```bash
# install deps
npm install

# start dev server
npm run dev

# type-check and build for production
npm run build
```

The app launches at `http://localhost:5173`. No backend is required; AI outputs are mocked client-side for showcasing flows.

## NeuralSeek integration

The upload flow can call your NeuralSeek mAIstro agent directly. Provide the endpoint details via `.env`:

```bash
cp .env.example .env
# then edit the values:
# VITE_NEURALSEEK_BASE_URL=https://stagingapi.neuralseek.com/v1/<instance>
# VITE_NEURALSEEK_AGENT=<Agent_Name>
# VITE_NEURALSEEK_API_KEY=<Bearer token from Integrate > API Keys>
```

When all three env vars are present, uploads invoke `POST <BASE_URL>/maistro` with the transcript and metadata parameters you saw in the editor. The agent’s variables (`summary`, `actionItems`, `sentimentAnalysis`, etc.) are mapped into the dashboard. If any variable is missing (or the env vars are not set), the UI falls back to the original in-browser mock summarizer so you can still demo without the API.

## Project structure

```
src/
  components/     // layout + reusable UI
  context/        // calls + sheet state management
  data/           // seeded mock calls
  pages/          // route-level screens
  types/          // shared TypeScript contracts
  utils/          // transcript parser, CSV export, formatters
```

## Notes

- CSV exports run fully in the browser using the current in-memory dataset.
- `CallsContext` simulates AI + Google Sheets responses so the UI feels production-ready even without APIs.
