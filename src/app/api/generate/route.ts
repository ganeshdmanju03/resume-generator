import { NextResponse } from "next/server";


import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BodySchema = z.object({
  jobDescription: z.string().min(50),
  baseResume: z.string().min(50),
  targetRole: z.string().min(2).optional(),
  tone: z.enum(["professional", "confident", "concise"]).default("professional"),
});

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = BodySchema.parse(await req.json());

    // basic size guards to avoid runaway token costs
if (body.jobDescription.length > 15000) {
  return NextResponse.json({ error: "Job description too long" }, { status: 400 });
}
if (body.baseResume.length > 15000) {
  return NextResponse.json({ error: "Base resume too long" }, { status: 400 });
}

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
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1600,
      temperature: 0.3,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text =
      msg.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n") || "";

   const draft = text;

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
  model: "claude-sonnet-4-5-20250929",
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

// ---------------------------------------------------------

return NextResponse.json({ resumeMarkdown: auditedText });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 400 }
    );
  }
}
