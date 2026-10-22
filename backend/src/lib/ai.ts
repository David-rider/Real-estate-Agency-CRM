import Anthropic from '@anthropic-ai/sdk';

/**
 * Real-estate AI "skills": focused prompt recipes the agent can run from the CRM.
 * The playbooks are inspired by common agent workflows seen in open-source
 * realtor toolkits (listing copy, objection handling, follow-up cadences,
 * seller discovery), written for this product.
 */

export type SkillId =
    | 'listing_description'
    | 'social_post'
    | 'listing_email'
    | 'follow_up'
    | 'objection_handler'
    | 'open_house_follow_up'
    | 'seller_discovery'
    | 'listing_presentation';

export interface Skill {
    id: SkillId;
    name: string;
    description: string;
    minTier: 'CORE' | 'PRO' | 'ELITE';
    // Which CRM records the skill can pull in as context
    uses: ('property' | 'client')[];
    // Extra free-text input the agent provides (label shown in the UI)
    inputLabel?: string;
    instructions: string;
}

export const SKILLS: Skill[] = [
    {
        id: 'listing_description',
        name: 'Listing description',
        description: 'MLS-ready listing copy built from the property record.',
        minTier: 'CORE',
        uses: ['property'],
        inputLabel: 'Highlights to emphasise (optional)',
        instructions: `Write an MLS-ready listing description.
- 150-250 words, 3-4 short paragraphs, no headings, no emoji.
- Lead with the single most compelling feature, then layout, finishes, building/neighbourhood amenities, and a clear call to action.
- Only state facts present in the property data or the agent's highlights. Never invent square footage, views, renovations or amenities.
- Then add a line "Headline:" with a 6-10 word headline.`,
    },
    {
        id: 'social_post',
        name: 'Social media post',
        description: 'Instagram / Facebook caption with hashtags for a listing.',
        minTier: 'PRO',
        uses: ['property'],
        inputLabel: 'Angle or event (e.g. "Open house Sunday 1-3pm")',
        instructions: `Write one social media caption for this listing.
- Under 120 words, a strong first line hook, 3-5 short benefit lines, a call to action, then 5-8 relevant local hashtags.
- Light emoji use is fine. Facts only from the data provided.
- Then provide a second, shorter variant (under 40 words) for Stories / X, labelled "Short version:".`,
    },
    {
        id: 'listing_email',
        name: 'New-listing email',
        description: 'Email to your buyer list announcing a listing.',
        minTier: 'PRO',
        uses: ['property', 'client'],
        inputLabel: 'Anything to mention (optional)',
        instructions: `Write a short email announcing this listing.
- Start with "Subject:" (under 60 characters), then the body: 90-160 words, warm and specific, one clear ask (book a private showing).
- If a client is provided, personalise to their stated budget/needs without exaggerating fit.
- Sign off with the agent's name from the context.`,
    },
    {
        id: 'follow_up',
        name: 'Client follow-up',
        description: 'A personal check-in text and email based on the client record and recent notes.',
        minTier: 'CORE',
        uses: ['client', 'property'],
        inputLabel: 'Goal of this follow-up (e.g. "book a showing", "re-engage")',
        instructions: `Write a follow-up for this client that sounds like a real person, not a template.
- Reference something specific from their record or recent notes when available.
- Give: "Text:" (under 300 characters), "Email subject:", "Email:" (80-140 words), and "Next step:" — one concrete action and when to follow up again if there is no reply.
- No pressure tactics, no false urgency.`,
    },
    {
        id: 'objection_handler',
        name: 'Objection handler',
        description: 'Turn a buyer or seller objection into a calm, honest response.',
        minTier: 'PRO',
        uses: ['client'],
        inputLabel: 'The exact objection (e.g. "Your commission is too high")',
        instructions: `Help the agent answer this objection without being defensive or pushy.
Objections usually come from a gap in trust, value, risk, timing or understanding of the process. Use: acknowledge → clarify → reframe → evidence → ask for a small next step.
Output these sections:
1. "What they may really mean:" one or two sentences.
2. "Say it like this:" a short spoken response (under 90 words).
3. "Question to ask:" one open question that moves things forward.
4. "Text version:" under 300 characters.
5. "Avoid saying:" 3 bullet phrases that would hurt trust or create compliance risk.
Use only facts provided; where data would help (comps, days on market), say what to pull rather than inventing numbers.`,
    },
    {
        id: 'open_house_follow_up',
        name: 'Open house follow-up',
        description: 'Thank-you message for an open-house visitor.',
        minTier: 'PRO',
        uses: ['client', 'property'],
        inputLabel: 'What you learned at the open house (optional)',
        instructions: `Write a same-day follow-up to someone who visited the open house.
- "Text:" under 300 characters, and "Email:" 60-120 words.
- Thank them, mention one feature of the home, offer a useful next step (disclosure package, private second showing, or similar homes), and ask one easy question about their search.`,
    },
    {
        id: 'seller_discovery',
        name: 'Seller discovery questions',
        description: 'Questions to ask before a listing appointment to understand motivation and timeline.',
        minTier: 'ELITE',
        uses: ['client', 'property'],
        inputLabel: 'What you know so far (optional)',
        instructions: `Prepare the agent for a first conversation with a potential seller.
Output:
1. "Goal of the call:" one sentence.
2. "Questions:" 10-12 questions grouped under Motivation, Timeline, Property condition, Pricing expectations, Decision makers. Plain, friendly wording.
3. "Listen for:" 4-5 signals that indicate urgency or hesitation.
4. "Bring to the appointment:" a short checklist.`,
    },
    {
        id: 'listing_presentation',
        name: 'Listing presentation outline',
        description: 'Talking points for a listing appointment built from the property and seller record.',
        minTier: 'ELITE',
        uses: ['property', 'client'],
        inputLabel: 'Market context or seller concerns (optional)',
        instructions: `Create a concise listing-presentation outline the agent can talk through in 20 minutes.
Sections: About the seller's goals; Pricing approach (explain how to build the price from comps — do not invent comp numbers); Marketing plan (photography, launch timeline, online and offline channels); Showing & offer process; What the seller can do to prepare; Next steps.
Use bullet points, keep each section to 3-5 bullets.`,
    },
];

const SYSTEM_PROMPT = `You are an assistant for licensed real estate agents, working inside their CRM.
Write in the language requested. Be concrete, warm and professional.
Always follow fair-housing rules: never describe or target people by race, colour, religion, national origin, sex, disability, familial status, age or other protected characteristics, and never describe a neighbourhood's demographics. Describe the property and amenities instead (e.g. "three bedrooms" not "perfect for families").
Never invent facts about a property or client. If something important is missing, write around it or note what the agent should fill in using [square brackets].
Return plain text only — no markdown headings or bold.`;

const LANG_NAMES: Record<string, string> = { en: 'English', zh: 'Simplified Chinese', 'zh-TW': 'Traditional Chinese', es: 'Spanish' };

// The assistant is still in development: it stays off unless explicitly enabled.
export function aiEnabled(): boolean {
    return process.env.AI_ASSISTANT_ENABLED === 'true';
}

export function aiConfigured(): boolean {
    return aiEnabled() && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient() {
    if (!client) client = new Anthropic();
    return client;
}

export class AiUnavailableError extends Error {}

/**
 * Runs a skill. `context` is a plain-text block of CRM facts (property, client,
 * recent notes, agent name). Returns the generated text.
 */
export async function runSkill(skill: Skill, opts: { context: string; input?: string; language?: string; tone?: string }) {
    if (!aiEnabled()) throw new AiUnavailableError('The AI assistant is in development and not available yet.');
    if (!aiConfigured()) throw new AiUnavailableError('AI assistant is not configured (set ANTHROPIC_API_KEY on the server).');

    const language = LANG_NAMES[opts.language || 'en'] || 'English';
    const userText = [
        `Task: ${skill.name}`,
        skill.instructions,
        `Write the output in ${language}.`,
        opts.tone ? `Tone of voice: ${opts.tone}.` : '',
        '',
        '<crm_context>',
        opts.context || '(no CRM records attached)',
        '</crm_context>',
        opts.input ? `\n<agent_input>\n${opts.input}\n</agent_input>` : '',
    ].filter(Boolean).join('\n');

    const response = await getClient().beta.messages.create({
        model: process.env.AI_MODEL || 'claude-opus-5-5',
        max_tokens: 16000,
        // Short copywriting: low effort keeps it fast and cheap
        output_config: { effort: 'low' },
        // If a safety classifier declines, let the API retry on a fallback model
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userText }],
    });

    if (response.stop_reason === 'refusal') {
        throw new Error('The AI declined this request. Try rephrasing it.');
    }
    const text = response.content
        .map(b => (b.type === 'text' ? b.text : ''))
        .join('')
        .trim();
    if (!text) throw new Error('The AI returned an empty response. Please try again.');
    return text;
}

const TIER_WEIGHT: Record<string, number> = { CORE: 1, PRO: 2, ELITE: 3 };
export function tierAllows(userTier: string, role: string, minTier: string) {
    if (role === 'SUPERADMIN') return true;
    return (TIER_WEIGHT[userTier] || 0) >= (TIER_WEIGHT[minTier] || 0);
}
