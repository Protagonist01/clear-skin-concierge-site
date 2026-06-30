# Clear Skin Site

Clear Skin is a Next.js marketing and commerce experience for the clinic and skincare brand, including:

- AI concierge chat
- AI skin quiz
- AI upsell rationale
- AI no-show recovery drafting
- email capture and nurture flows
- cart and checkout demo flow

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Setup

Create `.env.local` from [.env.example](.env.example).

Required variables:

```env
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
RESEND_API_KEY=your_resend_key
```

Optional OpenRouter attribution headers:

```env
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Clear Skin Site
```

## AI Provider

All LLM-powered routes now use OpenRouter through [lib/openrouter.ts](lib/openrouter.ts).

Current default model:

```env
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Routes using OpenRouter:

- [app/api/chat/route.ts](app/api/chat/route.ts)
- [app/api/quiz/route.ts](app/api/quiz/route.ts)
- [app/api/upsell/route.ts](app/api/upsell/route.ts)
- [app/api/noshow/route.ts](app/api/noshow/route.ts)

## Verification

Production build:

```bash
npm run build
```
