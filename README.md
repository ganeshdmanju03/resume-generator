Resume Generator – Claude + Next.js (Private Tool)

A private, access-key protected resume generator built with Next.js App Router and the Anthropic Claude API.

This tool generates an ATS-friendly resume from a job description and a base resume, and then runs a second strict audit pass to prevent hallucinated claims.

This project is designed as a personal tool (for family use), not as a public SaaS product.

⸻

What this project does

	1.	The user pastes a job description.
	2.	The user pastes a base resume.
	3.	The user selects a tone.
	4.	The user enters an access key.
	5.	The user clicks Generate.
	6.	The system generates a tailored resume.
	7.	The system runs a second AI pass to validate the content.
	8.	The final resume is returned in Markdown format.

⸻

Architecture

Browser (UI)

  → Next.js page (page.tsx)
  → POST /api/generate
  → Claude (first pass – resume writer)
  → Claude (second pass – strict auditor)
  → Final Markdown output

⸻

Key features
	•	Two-stage generation (writer + auditor)
	•	Shared access-key protection
	•	Request validation using Zod
	•	Input size guards to control cost
	•	API keys are used only on the server
	•	Deployed on Vercel

⸻

Technology stack
	•	Next.js (App Router)
	•	React
	•	TypeScript
	•	Zod
	•	Anthropic Claude SDK
	•	Vercel

⸻

Why two Claude calls are used

The first call generates the resume.

The second call verifies that:
	•	no facts are invented
	•	all claims are supported by the base resume
	•	unsupported bullets are replaced with [NEEDS INPUT]

This significantly reduces hallucination risk.

⸻

Security model

The application is protected using a shared secret.

Each request must contain a secret value that matches the server environment variable APP_SECRET.

This prevents public users from abusing the API and consuming credits.

This is not a login system.
It is a simple private access gate for a personal tool.

⸻

Environment variables

For local development, create a file named .env.local

ANTHROPIC_API_KEY=your_claude_api_key
APP_SECRET=your_private_access_key

Do not expose any secrets using NEXT_PUBLIC_* variables.

⸻

Local development

Install dependencies:

npm install

Start the development server:

npm run dev

Open in browser:

http://localhost:3000

⸻

API endpoint

POST /api/generate

Request body format:

  {
  jobDescription: string
  baseResume: string
  tone: professional | confident | concise
  secret: string
  targetRole: optional string
  }
  
  Response format:
  
  {
  resumeMarkdown: string
  }

⸻

Deployment using Vercel

	1.	Import the GitHub repository into Vercel.
	2.	Add the following environment variables in the Vercel project:

  ANTHROPIC_API_KEY
  APP_SECRET
  
	3.	Deploy the project.

Only the Production deployment URL should be shared.

Preview deployment URLs require a Vercel login.

⸻

Important cost note

Each resume generation triggers two Claude API calls:

	•	one call for generating the resume
	•	one call for auditing the resume

This means the cost per request is approximately double that of a single LLM call.

Downloading the result as Word or PDF (if added later) does not increase AI usage cost.

⸻

Input size limits

To avoid accidental high-cost requests, the backend rejects:

	•	job descriptions longer than 15,000 characters
	•	base resumes longer than 15,000 characters

⸻

Common problems and fixes

Problem: 401 Unauthorized
Cause: The access key sent from the UI does not match APP_SECRET.

Problem: Missing APP_SECRET
Cause: The APP_SECRET variable is not set on the server.
Fix: Add it in .env.local or in Vercel environment variables and restart / redeploy.

Problem: Model not found
Cause: The configured model is not available for the account.
Fix: Use a valid model such as claude-3-haiku-20240307.

Problem: Vercel asks for login
Cause: A Preview deployment URL is being used.
Fix: Always use the Production deployment URL.

⸻

Known limitations

The system cannot verify facts outside of the provided base resume.

If information is missing, the output will contain placeholders such as:

[NEEDS INPUT]

This is intentional and helps prevent hallucinated claims.

⸻

Why this project is intentionally private

This tool is designed only for personal and family use.

It intentionally does not include:
	
    •	user accounts
	  •	databases
	  •	resume history
	  •	analytics
	  •	role or permission systems

This keeps the system simple, low-cost and safe.

⸻

Important files in the project
  src/app/page.tsx
  src/app/api/generate/route.ts

⸻

Author

Built by Ganesh as a personal AI-assisted resume generator using Claude and Next.js.

⸻

License

Private / personal use only.
