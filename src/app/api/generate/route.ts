import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const BodySchema = z.object({
  jobDescription: z.string().min(50),
  baseResume: z.string().min(50),
  tone: z.enum(["professional", "confident", "concise"]).default("professional"),
  secret: z.string().min(1),
  targetRole: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // Ensure secrets exist on the server
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY (set it in Vercel env vars)" },
        { status: 500 }
      );
    }

    if (!process.env.APP_SECRET) {
      return NextResponse.json(
        { error: "Missing APP_SECRET (set it in Vercel env vars)" },
        { status: 500 }
      );
    }

    const body = BodySchema.parse(await request.json());

    // Hard auth gate (prevents strangers burning credits)
    if (body.secret !== process.env.APP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // basic size guards to avoid runaway token costs
    if (body.jobDescription.length > 15000) {
      return NextResponse.json({ error: "Job description too long" }, { status: 400 });
    }
    if (body.baseResume.length > 15000) {
      return NextResponse.json({ error: "Base resume too long" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // IMPORTANT: set this to a model that exists for your account.
    // Use the same one that worked when you tested earlier (e.g. "claude-3-haiku-20240307").
    const MODEL = "claude-3-haiku-20240307";

    const system = `
You are a resume writer.
Rules:
- Do NOT invent employers, dates, degrees, certifications, tools, achievements.
- If info is missing, write a placeholder like "[Add metric]" or "[Add project name]".
- Optimize for ATS: clear headings, bullet points, no tables.
- Output in plain text Markdown with sections:
  Summary, Skills, Experience, Projects (optional), Education, Certifications (optional).
- Tailor to the job description using the provided base resume only.
`.trim();

    const user = `
JOB DESCRIPTION:
${body.jobDescription}

BASE RESUME:
${body.baseResume}

TARGET ROLE (optional):
${body.targetRole ?? ""}

TONE:
${body.tone}

Now produce the tailored resume in Markdown.
`.trim();

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      temperature: 0.3,
      system,
      messages: [{ role: "user", content: user }],
    });

    const draft =
      msg.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n") || "";

    // ---------- STRICT RESUME AUDITOR (second pass) ----------
    const auditSystem = `
You are a strict resume auditor.

Rules:
- You must NOT invent any facts.
- Every claim must be supported by the BASE RESUME.
- If a bullet is not supported, replace it with [NEEDS INPUT].
- Keep the structure ATS-friendly.
- Return only the corrected resume in Markdown.
`.trim();

    const auditUser = `
BASE RESUME:
${body.baseResume}

DRAFT RESUME:
${draft}

Return the corrected resume in Markdown only.
`.trim();

    const auditedMsg = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      temperature: 0.1,
      system: auditSystem,
      messages: [{ role: "user", content: auditUser }],
    });

    const auditedText =
      auditedMsg.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n") || "";

    return NextResponse.json({ resumeMarkdown: auditedText });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}