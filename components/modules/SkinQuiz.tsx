'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuizProductFallback, getQuizTreatmentFallback } from '@/lib/knowledge/recommendations';

const QUIZ_COMPLETED_EVENT = 'clearskin:quiz-completed';

// ─── Types ──────────────────────────────────────────────────────────────────
type QuizMode = 'treatment' | 'product';

interface Answers {
  q1: string; // Primary skin concern
  q2: string; // Skin type
  q3: string; // Age
  q4: string; // Midday feel
  q5: string; // Current routine
  q6: string; // Outcome
  q7: string; // Budget (treatment mode only)
}

interface AIResult {
  primary: string;
  secondary: string;
  rationale: string;
  summary: string;
  error?: string;
}

// ─── Global trigger ─────────────────────────────────────────────────────────
let _setQuizOpen: ((open: boolean) => void) | null = null;
let _setQuizMode: ((mode: QuizMode) => void) | null = null;

export function openQuiz(mode: QuizMode = 'treatment') {
  if (_setQuizMode) _setQuizMode(mode);
  if (_setQuizOpen) _setQuizOpen(true);
}

// ─── Static fallback data (from CLEAR_SKIN_BRAND.md Sections 04, 05 & 06) ──
function getConcernKey(q1Answer: string): string {
  if (q1Answer.includes('Ageing') || q1Answer.includes('Fine')) return 'ageing';
  if (q1Answer.includes('Pigmentation')) return 'pigmentation';
  if (q1Answer.includes('Acne')) return 'acne';
  if (q1Answer.includes('Sensitivity') || q1Answer.includes('Redness')) return 'sensitivity';
  if (q1Answer.includes('Dullness') || q1Answer.includes('Uneven')) return 'dullness';
  if (q1Answer.includes('Volume')) return 'volume';
  return 'ageing';
}

interface FallbackItem {
  name: string;
  category: string;
  price: string;
  description: string;
}

function getStaticTreatmentResult(answers: Answers): { primary: FallbackItem; secondary: FallbackItem } {
  const concern = getConcernKey(answers.q1);
  const budget = answers.q7;
  const canonical = getQuizTreatmentFallback(concern, budget);

  if (canonical.primary) {
    const primary = {
      name: canonical.primary.name,
      category: canonical.primary.category,
      price: canonical.primary.price,
      description: canonical.primary.description,
    };
    const secondarySource = canonical.secondary || canonical.primary;
    return {
      primary,
      secondary: {
        name: secondarySource.name,
        category: secondarySource.category,
        price: secondarySource.price,
        description: secondarySource.description,
      },
    };
  }

  const treatments: Record<string, FallbackItem[]> = {
    ageing: [
      { name: 'Laser Renewal', category: 'Laser', price: '£550', description: 'Fractional laser for texture, pigmentation and scarring' },
      { name: 'BioRevive', category: 'Skin Boosters', price: '£380', description: 'Hyaluronic acid bio-remodelling for skin laxity' },
      { name: 'Expression Reset', category: 'Injectables', price: '£300', description: 'Botulinum toxin treatment for expression lines' },
    ],
    pigmentation: [
      { name: 'Laser Renewal', category: 'Laser', price: '£550', description: 'Fractional laser for texture, pigmentation and scarring' },
      { name: 'Clinical Facial', category: 'Facials', price: '£280', description: 'Clinical-grade deep treatment, tailored to skin concern' },
    ],
    acne: [
      { name: 'Clinical Facial', category: 'Facials', price: '£280', description: 'Clinical-grade deep treatment, tailored to skin concern' },
      { name: 'Skin Analysis', category: 'Diagnostics', price: '£150', description: 'Full facial mapping, skin analysis and bespoke treatment plan' },
    ],
    sensitivity: [
      { name: 'Light Therapy', category: 'Recovery', price: '£120', description: 'Red and near-infrared light for healing and rejuvenation' },
      { name: 'HydraRevive', category: 'Facials', price: '£220', description: 'Multi-step cleanse, extract and hydrate treatment' },
    ],
    dullness: [
      { name: 'HydraRevive', category: 'Facials', price: '£220', description: 'Multi-step cleanse, extract and hydrate treatment' },
      { name: 'Clinical Facial', category: 'Facials', price: '£280', description: 'Clinical-grade deep treatment, tailored to skin concern' },
    ],
    volume: [
      { name: 'Volume Treatment', category: 'Injectables', price: '£450+', description: 'Precision lip, cheek and jawline volumisation' },
      { name: 'BioRevive', category: 'Skin Boosters', price: '£380', description: 'Hyaluronic acid bio-remodelling for skin laxity' },
    ],
  };

  const options = treatments[concern] || treatments.ageing;

  if (concern === 'ageing' && options.length >= 3) {
    if (budget === '£500+') return { primary: options[0], secondary: options[1] };
    if (budget === '£350–£500') return { primary: options[1], secondary: options[0] };
    return { primary: options[2], secondary: options[1] };
  }

  return { primary: options[0], secondary: options[1] || options[0] };
}

function getStaticProductResult(answers: Answers): { primary: FallbackItem; secondary: FallbackItem | null } {
  const concern = getConcernKey(answers.q1);
  const canonical = getQuizProductFallback(concern);

  if (canonical.primary) {
    return {
      primary: {
        name: canonical.primary.name,
        category: canonical.primary.concern,
        price: canonical.primary.price,
        description: canonical.primary.description,
      },
      secondary: canonical.secondary
        ? {
            name: canonical.secondary.name,
            category: canonical.secondary.concern,
            price: canonical.secondary.price,
            description: canonical.secondary.description,
          }
        : null,
    };
  }

  const map: Record<string, { primary: FallbackItem; secondary: FallbackItem | null }> = {
    ageing: {
      primary: { name: 'Renewal Night Cream', category: 'Anti-Ageing', price: '£110', description: 'Encapsulated retinol for overnight cell renewal' },
      secondary: { name: 'Eye Revival', category: 'Eye Area', price: '£75', description: 'Multi-peptide formula targeting dark circles and fine lines' },
    },
    pigmentation: {
      primary: { name: 'Brightening Complex', category: 'Brightening', price: '£85', description: '20% stabilised Vitamin C for luminosity and even tone' },
      secondary: { name: 'Daily Shield SPF50', category: 'Protection', price: '£65', description: 'Featherlight mineral SPF, invisible finish' },
    },
    acne: {
      primary: { name: 'Purifying Cleanse Balm', category: 'Cleansing', price: '£70', description: 'Papaya enzyme balm that melts makeup and impurities' },
      secondary: { name: 'Restore Serum', category: 'Hydration', price: '£95', description: 'Ceramide-rich serum rebuilding the skin\'s protective layer' },
    },
    sensitivity: {
      primary: { name: 'Restore Serum', category: 'Hydration', price: '£95', description: 'Ceramide-rich serum rebuilding the skin\'s protective layer' },
      secondary: { name: 'Daily Shield SPF50', category: 'Protection', price: '£65', description: 'Featherlight mineral SPF, invisible finish' },
    },
    dullness: {
      primary: { name: 'Brightening Complex', category: 'Brightening', price: '£85', description: '20% stabilised Vitamin C for luminosity and even tone' },
      secondary: { name: 'Purifying Cleanse Balm', category: 'Cleansing', price: '£70', description: 'Papaya enzyme balm that melts makeup and impurities' },
    },
    volume: {
      primary: { name: 'Renewal Night Cream', category: 'Anti-Ageing', price: '£110', description: 'Encapsulated retinol for overnight cell renewal' },
      secondary: null,
    },
  };

  return map[concern] || map.ageing;
}

function buildFallbackSummary(answers: Answers, mode: QuizMode): string {
  const concern = answers.q1.toLowerCase().replace(' & ', ' and ');
  const skinType = answers.q2.toLowerCase();

  if (mode === 'treatment') {
    return `Based on your concern with ${concern} and ${skinType} skin, we recommend beginning with a targeted clinical treatment designed to address your specific profile.`;
  }
  return `Based on your concern with ${concern} and ${skinType} skin type, we have selected a focused two-product protocol to begin restoring your skin's function and clarity.`;
}

// ─── Treatment lookup for fallback result cards ──────────────────────────────
const TREATMENT_LOOKUP: Record<string, { category: string; price: string; description: string }> = {
  'Skin Analysis': { category: 'Diagnostics', price: '£150', description: 'Full facial mapping, skin analysis and bespoke treatment plan' },
  'Clinical Facial': { category: 'Facials', price: '£280', description: 'Clinical-grade deep treatment, tailored to skin concern' },
  'Volume Treatment': { category: 'Injectables', price: '£450+', description: 'Precision lip, cheek and jawline volumisation' },
  'Expression Reset': { category: 'Injectables', price: '£300', description: 'Botulinum toxin treatment for expression lines' },
  'Laser Renewal': { category: 'Laser', price: '£550', description: 'Fractional laser for texture, pigmentation and scarring' },
  'HydraRevive': { category: 'Facials', price: '£220', description: 'Multi-step cleanse, extract and hydrate treatment' },
  'BioRevive': { category: 'Skin Boosters', price: '£380', description: 'Hyaluronic acid bio-remodelling for skin laxity' },
  'Light Therapy': { category: 'Recovery', price: '£120', description: 'Red and near-infrared light for healing and rejuvenation' },
};

const PRODUCT_LOOKUP: Record<string, { category: string; price: string; description: string }> = {
  'Restore Serum': { category: 'Hydration', price: '£95', description: 'Ceramide-rich serum rebuilding the skin\'s protective layer' },
  'Brightening Complex': { category: 'Brightening', price: '£85', description: '20% stabilised Vitamin C for luminosity and even tone' },
  'Renewal Night Cream': { category: 'Anti-Ageing', price: '£110', description: 'Encapsulated retinol for overnight cell renewal' },
  'Eye Revival': { category: 'Eye Area', price: '£75', description: 'Multi-peptide formula targeting dark circles and fine lines' },
  'Daily Shield SPF50': { category: 'Protection', price: '£65', description: 'Featherlight mineral SPF, invisible finish' },
  'Purifying Cleanse Balm': { category: 'Cleansing', price: '£70', description: 'Papaya enzyme balm that melts makeup and impurities' },
};

function lookupItem(name: string, mode: QuizMode): FallbackItem {
  const lookup = mode === 'treatment' ? TREATMENT_LOOKUP : PRODUCT_LOOKUP;
  const match = lookup[name];
  if (match) return { name, ...match };
  // Partial match attempt
  for (const [key, data] of Object.entries(lookup)) {
    if (name.includes(key) || key.includes(name)) return { name: key, ...data };
  }
  return { name, category: '', price: '', description: '' };
}

// ─── Questions data ─────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: 'q1' as keyof Answers,
    text: 'What is your primary skin concern?',
    options: [
      'Ageing & Fine Lines',
      'Pigmentation',
      'Acne & Breakouts',
      'Sensitivity & Redness',
      'Dullness & Uneven Tone',
      'Loss of Volume',
    ],
    grid: true,
  },
  {
    key: 'q2' as keyof Answers,
    text: 'How would you describe your skin type?',
    options: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'],
    grid: false,
  },
  {
    key: 'q3' as keyof Answers,
    text: 'How old are you?',
    options: ['Under 25', '25–34', '35–44', '45–54', '55+'],
    grid: false,
  },
  {
    key: 'q4' as keyof Answers,
    text: 'How does your skin feel by midday?',
    options: [
      'Shiny and congested',
      'Tight and flaky',
      'Balanced',
      'Reactive and red',
      'Changes day to day',
    ],
    grid: true,
  },
  {
    key: 'q5' as keyof Answers,
    text: 'What is your current skincare routine?',
    options: [
      'Minimal (cleanser only)',
      'Basic (cleanser + moisturiser)',
      'Established (multi-step)',
      'Advanced (actives and SPF)',
    ],
    grid: true,
  },
  {
    key: 'q6' as keyof Answers,
    text: 'What outcome matters most to you right now?',
    options: [
      'Reduce lines and restore firmness',
      'Even out my skin tone',
      'Clear and prevent breakouts',
      'Calm and strengthen my skin',
      'Restore radiance and glow',
    ],
    grid: true,
  },
  {
    key: 'q7' as keyof Answers,
    text: 'What is your budget for a clinic treatment?',
    options: ['Up to £200', '£200–£350', '£350–£500', '£500+'],
    grid: false,
    treatmentOnly: true,
  },
];

// ─── Main component ─────────────────────────────────────────────────────────
export default function SkinQuiz() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<QuizMode>('treatment');
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '' });

  // Result states
  const [showResults, setShowResults] = useState(false);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  // Email gate
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultDispatchRef = useRef(false);

  // Register global triggers
  useEffect(() => {
    _setQuizOpen = setIsOpen;
    _setQuizMode = setMode;
    return () => {
      _setQuizOpen = null;
      _setQuizMode = null;
    };
  }, []);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDirection(1);
      setAnswers({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '' });
      setShowResults(false);
      setIsLoadingResult(false);
      setAiResult(null);
      setUsedFallback(false);
      setEmail('');
      setEmailSubmitted(false);
      resultDispatchRef.current = false;
    }
  }, [isOpen]);

  // Visible questions (filter Q7 for product mode)
  const visibleQuestions = QUESTIONS.filter(q => {
    if (q.treatmentOnly && mode !== 'treatment') return false;
    return true;
  });
  const totalSteps = visibleQuestions.length;
  const currentQ = visibleQuestions[step];
  const currentAnswer = currentQ ? answers[currentQ.key] : '';

  const selectAnswer = useCallback((value: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.key]: value }));
  }, [currentQ]);

  // ─── API call ─────────────────────────────────────────────────────────────
  const callQuizAPI = useCallback(async (collectedAnswers: Answers, quizMode: QuizMode) => {
    setIsLoadingResult(true);
    setShowResults(true);

    const apiAnswers = {
      concern: collectedAnswers.q1,
      skinType: collectedAnswers.q2,
      age: collectedAnswers.q3,
      midday: collectedAnswers.q4,
      routine: collectedAnswers.q5,
      outcome: collectedAnswers.q6,
      budget: quizMode === 'treatment' ? collectedAnswers.q7 : undefined,
    };

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: apiAnswers, mode: quizMode }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const result: AIResult = await res.json();

      if (result.error) throw new Error('API error response');

      setAiResult(result);
      setUsedFallback(false);
    } catch (err) {
      console.error('[SkinQuiz] API call failed, using static fallback:', err);
      setAiResult(null);
      setUsedFallback(true);
    } finally {
      setIsLoadingResult(false);
    }
  }, []);

  const goNext = useCallback(() => {
    if (!currentAnswer) return;
    if (step === totalSteps - 1) {
      setDirection(1);
      callQuizAPI(answers, mode);
    } else {
      setDirection(1);
      setStep(s => s + 1);
    }
  }, [currentAnswer, step, totalSteps, callQuizAPI, answers, mode]);

  const goBack = useCallback(() => {
    if (step === 0) return;
    setDirection(-1);
    setStep(s => s - 1);
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // POST to email capture endpoint (Module 03)
    try {
      await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'quiz',
          quizResult: {
            concern: answers.q1,
            primary: primaryItem?.name || '',
            secondary: secondaryItem?.name || '',
          },
        }),
      });
    } catch {
      // Email capture failure should not block the result
      console.warn('[SkinQuiz] Email capture request failed');
    }

    setEmailSubmitted(true);
  };

  const handleEmailFocus = () => {
    setTimeout(() => {
      emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // ─── Derived display data ─────────────────────────────────────────────────
  // For fallback results
  const staticTreatment = getStaticTreatmentResult(answers);
  const staticProduct = getStaticProductResult(answers);
  const fallbackSummary = buildFallbackSummary(answers, mode);

  // Build result cards from AI result or fallback
  const primaryItem: FallbackItem = aiResult
    ? lookupItem(aiResult.primary, mode)
    : (mode === 'treatment' ? staticTreatment.primary : staticProduct.primary);

  const secondaryItem: FallbackItem | null = aiResult
    ? lookupItem(aiResult.secondary, mode)
    : (mode === 'treatment' ? staticTreatment.secondary : staticProduct.secondary);

  const summaryText = aiResult ? aiResult.summary : fallbackSummary;

  // Progress
  const progressPct = showResults ? 100 : ((step) / totalSteps) * 100;
  const displayStep = showResults ? totalSteps : step + 1;
  const isLastQuestion = step === totalSteps - 1;

  useEffect(() => {
    if (!emailSubmitted || isLoadingResult || resultDispatchRef.current) return;
    if (!primaryItem.name) return;

    resultDispatchRef.current = true;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(QUIZ_COMPLETED_EVENT, {
        detail: {
          mode,
          summary: summaryText,
          primary: primaryItem,
          secondary: secondaryItem,
          usedFallback,
        },
      }));
    }
  }, [emailSubmitted, isLoadingResult, mode, primaryItem, secondaryItem, summaryText, usedFallback]);

  return (
    <>
      {/* ── Styles ─────────────────────────────────────────────────────────── */}
      <style>{`
        /* Overlay */
        .quiz-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background-color: rgba(247,243,238,0.97);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          overflow-y: auto;
        }
        @media (max-width: 767px) {
          .quiz-overlay {
            padding: 0;
            align-items: flex-start;
          }
        }

        /* Panel */
        .quiz-panel {
          position: relative;
          width: 100%;
          max-width: 640px;
          background-color: var(--parchment);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 40px;
          margin: auto;
          transform-origin: center center;
        }
        @media (max-width: 767px) {
          .quiz-panel {
            max-width: 100%;
            border-radius: 0;
            border-left: none;
            border-right: none;
            min-height: 100dvh;
            padding: 24px 20px 40px;
          }
        }

        /* Close button */
        .quiz-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 22px;
          color: var(--muted);
          transition: color 0.15s ease;
          padding: 0;
          line-height: 1;
          z-index: 2;
        }
        .quiz-close:hover { color: var(--espresso); }

        /* Progress bar */
        .quiz-progress-track {
          width: 100%;
          height: 2px;
          background-color: var(--border);
          border-radius: 2px;
          margin-bottom: 6px;
          overflow: hidden;
        }
        .quiz-progress-fill {
          height: 100%;
          background-color: var(--gold);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .quiz-progress-label {
          font-family: monospace;
          font-size: 10px;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 32px;
          display: block;
        }

        /* Question text */
        .quiz-question {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 300;
          color: var(--espresso);
          line-height: 1.25;
          margin-bottom: 28px;
          text-wrap: balance;
        }
        @media (max-width: 767px) {
          .quiz-question {
            font-size: 22px;
          }
        }

        /* Options container */
        .quiz-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 32px;
        }
        .quiz-options-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 32px;
        }
        @media (max-width: 767px) {
          .quiz-options-grid,
          .quiz-options-flex {
            grid-template-columns: 1fr;
            display: flex;
            flex-direction: column;
          }
        }

        /* Answer pill */
        .quiz-pill {
          padding: 12px 18px;
          min-height: 48px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--parchment);
          color: var(--muted-mid);
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          line-height: 1.4;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
          white-space: normal;
        }
        .quiz-pill:hover {
          border-color: rgba(158,122,82,0.4);
        }
        .quiz-pill--selected {
          border-color: var(--gold);
          background-color: rgba(168,132,74,0.12);
          color: var(--espresso);
        }
        .quiz-pill:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .quiz-pill {
            width: 100%;
            display: flex;
            align-items: center;
          }
        }

        /* Navigation */
        .quiz-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        @media (max-width: 767px) {
          .quiz-nav {
            flex-direction: column-reverse;
            align-items: stretch;
          }
        }
        .quiz-back {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--muted);
          padding: 8px 0;
          transition: color 0.15s ease;
          text-align: center;
        }
        .quiz-back:hover { color: var(--espresso); }
        .quiz-next {
          background-color: var(--gold);
          color: var(--linen);
          border: none;
          border-radius: 4px;
          padding: 12px 28px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }
        .quiz-next:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .quiz-next:not(:disabled):hover { opacity: 0.88; }
        @media (max-width: 767px) {
          .quiz-next {
            width: 100%;
            text-align: center;
            padding: 14px 28px;
          }
        }

        /* Loading state */
        .quiz-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          gap: 20px;
        }
        .quiz-loading-text {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 22px;
          font-weight: 300;
          color: var(--bronze);
          text-align: center;
        }
        .quiz-loading-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .quiz-loading-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--gold);
          animation: quiz-dot-pulse 1.4s ease-in-out infinite;
        }
        .quiz-loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .quiz-loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes quiz-dot-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }

        /* Results screen */
        .quiz-results-heading {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 300;
          color: var(--espresso);
          margin-bottom: 12px;
          line-height: 1.15;
        }
        .quiz-results-summary {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 14px;
          color: var(--muted-mid);
          line-height: 1.65;
          margin-bottom: 28px;
          max-width: 520px;
        }

        /* Email gate */
        .quiz-email-gate {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 24px;
          background-color: var(--white, #FEFCFA);
          margin-bottom: 28px;
        }
        .quiz-email-label {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--espresso);
          margin-bottom: 12px;
          display: block;
        }
        .quiz-email-row {
          display: flex;
          gap: 8px;
        }
        .quiz-email-input {
          flex: 1;
          padding: 10px 14px;
          font-family: var(--font-body);
          font-size: 16px;
          background-color: var(--stone);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          outline: none;
          transition: border-color 0.15s ease;
        }
        .quiz-email-input::placeholder { color: var(--muted); }
        .quiz-email-input:focus { border-color: var(--gold); }
        .quiz-email-submit {
          background-color: var(--gold);
          color: var(--linen);
          border: none;
          border-radius: 4px;
          padding: 10px 18px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }
        .quiz-email-submit:hover { opacity: 0.88; }
        .quiz-email-disclaimer {
          font-family: monospace;
          font-size: 11px;
          color: var(--muted);
          margin-top: 10px;
          display: block;
        }
        @media (max-width: 767px) {
          .quiz-email-row { flex-direction: column; }
          .quiz-email-submit { width: 100%; text-align: center; font-size: 16px; }
          .quiz-email-input { font-size: 16px; }
        }

        /* AI Rationale panel */
        .quiz-rationale-panel {
          background-color: var(--parchment);
          border-left: 2px solid var(--gold);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .quiz-rationale-label {
          font-family: monospace;
          font-size: 9px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          display: block;
          margin-bottom: 8px;
        }
        .quiz-rationale-text {
          font-family: var(--font-body);
          font-size: 13px;
          font-style: italic;
          color: var(--text);
          line-height: 1.7;
          margin: 0;
        }

        /* Result card */
        .quiz-result-card {
          background-color: var(--linen);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px 28px;
          margin-bottom: 16px;
        }
        .quiz-result-card-label {
          font-family: monospace;
          font-size: 10px;
          font-weight: 600;
          color: var(--gold);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }
        .quiz-result-card-name {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 300;
          color: var(--espresso);
          margin-bottom: 4px;
          line-height: 1.2;
        }
        .quiz-result-card-price {
          font-family: monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--gold);
          margin-bottom: 8px;
          display: block;
        }
        .quiz-result-card-desc {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--muted-mid);
          line-height: 1.55;
        }

        /* Result CTAs */
        .quiz-result-ctas {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .quiz-cta-primary {
          background-color: var(--gold);
          color: var(--linen);
          border: none;
          border-radius: 4px;
          padding: 12px 24px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          text-align: center;
          transition: opacity 0.2s ease;
          display: block;
          text-decoration: none;
        }
        .quiz-cta-primary:hover { opacity: 0.88; }
        .quiz-cta-ghost {
          background: none;
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 11px 24px;
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 400;
          color: var(--muted-mid);
          cursor: pointer;
          text-align: center;
          transition: border-color 0.2s ease, color 0.2s ease;
          display: block;
          width: 100%;
        }
        .quiz-cta-ghost:hover {
          border-color: var(--bronze);
          color: var(--espresso);
        }

        /* Secondary recommendation */
        .quiz-also-consider {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .quiz-also-consider-label {
          font-family: monospace;
          font-size: 10px;
          font-weight: 600;
          color: var(--muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
        }
      `}</style>

      {/* ── Overlay ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="quiz-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Clear Skin Assessment Quiz"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            <motion.div
              ref={panelRef}
              className="quiz-panel"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                className="quiz-close"
                onClick={handleClose}
                aria-label="Close quiz"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Progress bar */}
              <div className="quiz-progress-track" aria-hidden="true">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="quiz-progress-label">
                Step {displayStep} of {totalSteps}
              </span>

              {/* ── Question screen ─────────────────────────────────────── */}
              {!showResults && (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={{
                      enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
                      center: { x: 0, opacity: 1 },
                      exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {/* Question */}
                    <p className="quiz-question">{currentQ?.text}</p>

                    {/* Answer options */}
                    <div className={currentQ?.grid ? 'quiz-options-grid' : 'quiz-options-flex'}>
                      {currentQ?.options.map((opt) => (
                        <a
                          href="/book"
                          key={opt}
                          className={`quiz-pill${currentAnswer === opt ? ' quiz-pill--selected' : ''}`}
                          onClick={() => selectAnswer(opt)}
                        >
                          {opt}
                        </a>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="quiz-nav">
                      {step > 0 ? (
                        <button className="quiz-back" onClick={goBack}>
                          ← Back
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        className="quiz-next"
                        onClick={goNext}
                        disabled={!currentAnswer}
                      >
                        {isLastQuestion ? 'See my results →' : 'Next →'}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* ── Loading state ───────────────────────────────────────── */}
              {showResults && isLoadingResult && (
                <motion.div
                  className="quiz-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <p className="quiz-loading-text">Analysing your skin profile...</p>
                  <div className="quiz-loading-dots">
                    <span className="quiz-loading-dot" />
                    <span className="quiz-loading-dot" />
                    <span className="quiz-loading-dot" />
                  </div>
                </motion.div>
              )}

              {/* ── Results screen ──────────────────────────────────────── */}
              {showResults && !isLoadingResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <p className="quiz-results-heading">Your skin profile.</p>
                  <p className="quiz-results-summary">{summaryText}</p>

                  {/* Email gate */}
                  {!emailSubmitted ? (
                    <div className="quiz-email-gate">
                      <span className="quiz-email-label">
                        Enter your email to receive your full skin profile.
                      </span>
                      <form onSubmit={handleEmailSubmit}>
                        <div className="quiz-email-row">
                          <input
                            ref={emailInputRef}
                            type="email"
                            className="quiz-email-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={handleEmailFocus}
                            required
                          />
                          <button type="submit" className="quiz-email-submit">
                            →
                          </button>
                        </div>
                        <span className="quiz-email-disclaimer">
                          No promotions. Unsubscribe anytime.
                        </span>
                      </form>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {/* ── AI Rationale panel (only if AI result is available) ── */}
                      {aiResult && !usedFallback && (
                        <div className="quiz-rationale-panel">
                          <span className="quiz-rationale-label">Clinical Reasoning</span>
                          <p className="quiz-rationale-text">{aiResult.rationale}</p>
                        </div>
                      )}

                      {/* Primary recommendation card */}
                      <div className="quiz-result-card">
                        <span className="quiz-result-card-label">
                          {primaryItem.category ? `${primaryItem.category} · ` : ''}Recommended
                        </span>
                        <p className="quiz-result-card-name">{primaryItem.name}</p>
                        {primaryItem.price && (
                          <span className="quiz-result-card-price">{primaryItem.price}</span>
                        )}
                        {primaryItem.description && (
                          <p className="quiz-result-card-desc">{primaryItem.description}</p>
                        )}
                      </div>

                      {/* CTAs */}
                      <div className="quiz-result-ctas">
                        {mode === 'treatment' ? (
                          <a
                            href="/book"
                            className="quiz-cta-primary"
                            onClick={handleClose}
                          >
                            Book this treatment →
                          </a>
                        ) : (
                          <a
                            href="/skincare"
                            className="quiz-cta-primary"
                            onClick={handleClose}
                          >
                            Shop now →
                          </a>
                        )}
                        <button
                          className="quiz-cta-ghost"
                          onClick={() => {
                            handleClose();
                          }}
                        >
                          Speak to a practitioner about your results →
                        </button>
                      </div>

                      {/* Secondary recommendation */}
                      {secondaryItem && secondaryItem.name !== primaryItem.name && (
                        <div className="quiz-also-consider">
                          <span className="quiz-also-consider-label">Also consider:</span>
                          <div className="quiz-result-card" style={{ marginBottom: 0 }}>
                            <span className="quiz-result-card-label">
                              {secondaryItem.category || ''}
                            </span>
                            <p className="quiz-result-card-name">{secondaryItem.name}</p>
                            {secondaryItem.price && (
                              <span className="quiz-result-card-price">{secondaryItem.price}</span>
                            )}
                            {secondaryItem.description && (
                              <p className="quiz-result-card-desc">{secondaryItem.description}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Volume concern — BioRevive fallback for product mode */}
                      {mode === 'product' && !secondaryItem && !aiResult && (
                        <div className="quiz-also-consider">
                          <span className="quiz-also-consider-label">Also consider:</span>
                          <div className="quiz-result-card" style={{ marginBottom: 0 }}>
                            <span className="quiz-result-card-label">
                              Skin Boosters · Clinic Recommendation
                            </span>
                            <p className="quiz-result-card-name">BioRevive</p>
                            <span className="quiz-result-card-price">£380</span>
                            <p className="quiz-result-card-desc">
                              For your concern with loss of volume, a clinical BioRevive
                              treatment addresses skin laxity from within — a level of
                              restoration that topical products alone cannot achieve.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
