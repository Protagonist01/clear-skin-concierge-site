'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Tag from './Tag';

interface TreatmentCardProps {
  name: string;
  category: string;
  price: string;
  description: string;
  slug: string;
  expectation?: string;
  image?: string;
}

export default function TreatmentCard({
  name,
  category,
  price,
  description,
  slug,
  image,
}: TreatmentCardProps) {
  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    element.style.setProperty('--card-pointer-x', `${event.clientX - rect.left}px`);
    element.style.setProperty('--card-pointer-y', `${event.clientY - rect.top}px`);
  };

  const handleLeave = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget as HTMLElement;
    element.style.setProperty('--card-pointer-x', '50%');
    element.style.setProperty('--card-pointer-y', '50%');
  };

  return (
    <Link
      href={`/treatments/${slug}`}
      className="card-hover group flex h-full flex-col overflow-hidden rounded-[1.85rem] border border-[color:var(--line)] bg-[color:var(--card-strong)] backdrop-blur-sm"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {image && (
        <div className="relative aspect-[1.05/1] overflow-hidden bg-[color:var(--surface)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-[linear-gradient(180deg,rgba(255,250,244,0.48)_0%,rgba(255,250,244,0)_100%)]" />
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        </div>
      )}

      <div className="relative z-[1] flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <Tag>{category}</Tag>
          <span className="glass-pill px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
            {price}
          </span>
        </div>

        <h3 className="font-display text-[28px] leading-[1.05] tracking-[-0.05em] text-[color:var(--ink)]">
          {name}
        </h3>

        <p className="text-[15px] leading-7 text-[color:var(--ink-soft)]">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-[color:var(--line)] pt-5 text-[15px] font-medium text-[color:var(--ink)]">
          <span>Explore treatment</span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:rgba(95,72,54,0.14)] bg-[color:rgba(255,250,244,0.74)] transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight size={18} strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </Link>
  );
}
