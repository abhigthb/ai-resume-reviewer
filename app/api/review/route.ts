import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textInput = formData.get('text') as string | null;
    const docType = (formData.get('type') as 'resume' | 'cover-letter') || 'resume';

    let content = '';

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdf = await import('pdf-parse');
        const data = await pdf.default(buffer);
        content = data.text;
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        content = buffer.toString('utf-8');
      } else {
        return NextResponse.json({ error: 'Only PDF or TXT files allowed' }, { status: 400 });
      }
    } else if (textInput) {
      content = textInput;
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const systemPrompt = `You are an expert career coach and ATS optimization specialist with 15+ years experience.
Analyze the following ${docType} for:
- Clarity (structure, readability)
- Impact (achievements, action verbs, quantifiable results)
- ATS friendliness (keywords, formatting, standard sections)

Return ONLY a valid JSON object (no markdown, no extra text):

{
  "overall_score": 0-100,
  "clarity_score": 0-100,
  "impact_score": 0-100,
  "ats_score": 0-100,
  "summary": "2-3 sentence professional summary",
  "strengths": ["bullet1", "bullet2", ...],
  "weaknesses": ["bullet1", "bullet2", ...],
  "line_by_line_suggestions": [
    {
      "original": "exact original line/phrase",
      "suggestion": "what to change and why",
      "improved_version": "the rewritten version"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'grok-4.20-beta-0309-reasoning',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the ${docType}:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const result = JSON.parse(completion.choices[0].message.content!);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process document. Please try again.' }, { status: 500 });
  }
}