'use client';

import { useState } from 'react';

const DETAIL_TABS = ['What it is', 'What to expect', 'Ideal for'] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

interface DetailTabsProps {
  description: string;
  steps: string[];
  idealFor: string[];
}

export default function DetailTabs({
  description,
  steps,
  idealFor,
}: DetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('What it is');

  return (
    <div className="md:hidden">
      <div className="hide-scrollbar mb-6 flex gap-3 overflow-x-auto pb-2">
        {DETAIL_TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="min-h-[40px] rounded-full border px-4 text-[12px] font-medium transition-colors"
              style={{
                borderColor: active ? 'var(--accent-strong)' : 'var(--line)',
                backgroundColor: active ? 'var(--accent-soft)' : 'var(--card)',
                color: active ? 'var(--ink)' : 'var(--ink-soft)',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--card)] p-5">
        {activeTab === 'What it is' && (
          <p className="text-[15px] leading-7 text-[color:var(--ink-soft)]">
            {description}
          </p>
        )}

        {activeTab === 'What to expect' && (
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-[15px] leading-7 text-[color:var(--ink-soft)]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        )}

        {activeTab === 'Ideal for' && (
          <ul className="space-y-3">
            {idealFor.map((concern) => (
              <li key={concern} className="flex gap-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                <span className="text-[color:var(--accent-strong)]">-</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
