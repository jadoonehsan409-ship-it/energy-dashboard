# ⚡ AI Energy Monitoring Dashboard
**Final Year Project — Electrical Engineering**

Real-time energy monitoring dashboard connected to PZEM-004T sensor via ESP32 → Google Sheets.

## Quick Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
- `SHEETS_CSV_URL` — Your Google Sheet published as CSV (File → Share → Publish to web → CSV)
- `GMAIL_USER` — Your Gmail address
- `GMAIL_APP_PASSWORD` — Gmail App Password (Google Account → Security → App Passwords)

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel
1. Push to GitHub
2. Connect repo on vercel.com
3. Add env variables in Vercel dashboard (Settings → Environment Variables)
4. Deploy

## Google Sheet Format
Columns required: `Time | Voltage | Current | Power | Energy | Frequency | Power Factor | Load_Label`

## Pages
| Page | Description |
|------|-------------|
| Overview | Live gauge, today/month stats, forecast chart |
| Realtime | Date-range graphs, raw data table |
| Forecast | 7-day prediction with confidence bands |
| Appliances | Per-load energy breakdown |
| Alerts | Active alerts + email notifications |
| Settings | Price, currency, email, thresholds |

## Stack
Next.js 14 · Tailwind CSS · Recharts · Nodemailer · Google Sheets CSV API
