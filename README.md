This is a [Next.js](https://nextjs.org) project with async workflows powered by Inngest.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Job Analysis MVP (LinkedIn jobs + pasted JD)

This repo now includes an async job-fit analysis flow:

1. `POST /api/analyses` accepts `resumeText` and either:
- `jobUrl` (LinkedIn jobs URL only), or
- `jobDescription` (pasted text)
2. Route stores analysis row and emits `jobs/analysis.requested`.
3. Inngest function `process-job-analysis`:
- Scrapes LinkedIn job text via Bright Data (for URL input),
- Runs Anthropic compatibility analysis,
- Saves final score + guidance.
4. `GET /api/analyses/:analysisId` returns status/result.

Required environment variables:

```env
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-haiku-4-5
BRIGHTDATA_API_KEY=...
BRIGHTDATA_LINKEDIN_JOBS_DATASET_ID=gd_lpfll7v5hcqtkxl6l
```

Run migrations after pulling changes:

```bash
npm run db:migrate
```

### Example requests

```bash
curl -X POST http://localhost:3000/api/analyses \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "Senior frontend engineer with 6 years ...",
    "jobUrl": "https://www.linkedin.com/jobs/view/4321442384/"
  }'
```

```bash
curl http://localhost:3000/api/analyses/<analysisId>
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
