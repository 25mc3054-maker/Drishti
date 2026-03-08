# Drishti — Hackathon Prototype Submission

## Project Summary

Drishti is a Vision-to-Value Orchestrator that converts images or short videos of real-world business scenarios into actionable business intelligence for small and medium businesses in Bharat. Users upload an image (shelf, handwritten notes, workflow diagram, etc.), the system analyzes visual content using Google Gemini, and returns:
- Problem identification and severity
- Mathematical optimization plan (objectives, constraints, estimated impact)
- Implementation guide with code snippets and dashboard widgets

The prototype is built with Next.js (App Router), TypeScript, Tailwind CSS, and integrates the Google Generative AI SDK for multimodal (vision) analysis. The UI presents a guide, live progress bar, detailed solution preview, and downloadable implementation instructions.

## Problem Statement

Small businesses in India often lack rapid, low-cost access to expert consultants for operational optimization (inventory layout, sales tracking, process bottlenecks). Drishti reduces reliance on paid consultants by providing instant, AI-driven analysis from a smartphone photo, producing prioritized actions and developer-ready guidance.

## Demo Video (instructions & script)

- Length: 3–6 minutes
- Start (0:20): Briefly state the problem and solution (what Drishti does).
- UI walk-through (0:30): Show homepage, upload flow, and design highlights.
- Live demo (2:00): Upload a sample image (pantry/warehouse/handwritten sales), run analysis, show progress bar and final structured result.
- Explain outputs (0:40): Point out severity, optimization metrics, sample code snippets, and timeline.
- Closing (0:20): Mention deployment link, GitHub repo, and AWS credits usage.

Upload video to YouTube or Drive and paste the share link below before final submission.

Demo Video URL: [PASTE LINK HERE]

## Codebase

Public repository (prototype): https://github.com/25mc3054-maker/Drishti

If you want this repo to be set public/private for submission, confirm and I can prepare a cleaned release branch.

## Live Working Prototype

Current local test URL: http://localhost:3000

Recommended deploy: Vercel (fast) or AWS Amplify.

Vercel quick deploy steps:
1. Install Vercel CLI: `npm i -g vercel`
2. From repo root run: `vercel` and follow prompts
3. Add env var in Vercel dashboard: `NEXT_PUBLIC_GEMINI_API_KEY`

AWS Amplify quick deploy:
1. Connect the GitHub repository in Amplify Console
2. Build command: `npm run build`
3. Output directory: `.next`
4. Add `NEXT_PUBLIC_GEMINI_API_KEY` in Amplify environment variables

Live URL: [PASTE LIVE URL HERE]

## Submission Checklist (Hackathon requirements)

- Project Summary: Completed (this file)
- Demonstration: Demo video link added above
- Codebase: GitHub link added above
- Working Link: Live URL added above
- Problem Statement: Included above

## AWS Credits & Team Leader Notes

- AWS credits ($100) will be sent to the Team Leader's registered email as a unique URL or promo code. Keep an eye on the inbox for the separate email from the organizers.
- If you prefer using AWS for deployment, prefer Amplify (free tier) or use the credits for EC2/Elastic Beanstalk if necessary. I can add an `amplify.yml` or CloudFormation snippet on request.

## How to Finalize Before Submission

1. Record and upload the demo video; paste link above.
2. Deploy to Vercel or Amplify and paste the live URL above.
3. Confirm GitHub repo visibility and provide the exact repo URL (if different from the one above).
4. Verify `.env` contains `NEXT_PUBLIC_GEMINI_API_KEY` and do not expose secrets in public repo; use environment variables in the deployment platform.
5. Paste final links into the hackathon dashboard.

---

If you want, I can: create a short README update tailored for the hackathon, record a suggested demo script voiceover, or deploy to Vercel and return the live URL. Which should I do next?
