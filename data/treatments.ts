export interface Treatment {
  name: string;
  category: string;
  price: string;
  description: string;
  slug: string;
  image?: string;
  expectation: string;
  steps: string[];
  idealFor: string[];
}

export const TREATMENTS: Treatment[] = [
  {
    name: "Skin Analysis",
    category: "Diagnostics",
    price: "£150",
    description: "Full facial mapping, skin analysis and bespoke treatment plan",
    slug: "skin-analysis",
    image: "/images/treatment-skin-analysis.png",
    expectation: "Your clinician completes a full facial mapping and presents a written treatment plan at your appointment.",
    steps: [
      "Arrive with a clean face — no makeup or SPF. Your clinician will review your skin history and current concerns.",
      "A detailed facial mapping assessment is performed under clinical lighting, assessing texture, tone, pore structure and hydration levels.",
      "Digital skin analysis captures baseline measurements for future comparison.",
      "You leave with a written, prioritised treatment plan and product recommendations specific to your skin.",
    ],
    idealFor: [
      "Ageing & Fine Lines",
      "Pigmentation",
      "Acne & Breakouts",
      "Sensitivity & Redness",
      "Dullness & Uneven Tone",
      "Loss of Volume",
    ],
  },
  {
    name: "Clinical Facial",
    category: "Facials",
    price: "£280",
    description: "Clinical-grade deep treatment, tailored to skin concern",
    slug: "clinical-facial",
    image: "/images/treatment-clinical-facial.png",
    expectation: "A 75-minute clinical facial tailored to your active skin concern, using prescription-grade actives.",
    steps: [
      "Double cleanse with enzymatic exfoliation to remove surface debris and prepare the skin for active ingredient penetration.",
      "Manual extraction and high-frequency treatment where clinically appropriate, followed by a targeted active mask.",
      "Treatment-specific serums are applied and worked into the skin using facial massage techniques to promote absorption.",
      "SPF application and a brief homecare debrief from your clinician.",
    ],
    idealFor: [
      "Acne & Breakouts",
      "Dullness & Uneven Tone",
      "Sensitivity & Redness",
      "Pigmentation",
    ],
  },
  {
    name: "Volume Treatment",
    category: "Injectables",
    price: "£450+",
    description: "Precision lip, cheek and jawline volumisation",
    slug: "volume-treatment",
    image: "/images/treatment-volume-treatment.png",
    expectation: "Results are visible immediately and improve over 2–4 weeks as the hyaluronic acid settles into the tissue.",
    steps: [
      "A pre-treatment consultation reviews your facial anatomy and agrees the precise treatment zones — no two plans are identical.",
      "Topical numbing cream is applied for 20 minutes prior to injection to ensure comfort throughout.",
      "Hyaluronic acid filler is placed using either a fine needle or blunt cannula depending on the treatment area.",
      "Immediate post-treatment review and written aftercare instructions provided. A complimentary 2-week review is included.",
    ],
    idealFor: [
      "Loss of Volume",
      "Ageing & Fine Lines",
    ],
  },
  {
    name: "Expression Reset",
    category: "Injectables",
    price: "£300",
    description: "Botulinum toxin treatment for expression lines",
    slug: "expression-reset",
    image: "/images/treatment-expression-reset.png",
    expectation: "Treatment takes under 20 minutes. Results develop over 10–14 days and are reviewed at a complimentary follow-up.",
    steps: [
      "Anatomy assessment in a neutral and active expression to determine injection sites with precision — the clinician maps each point before treatment begins.",
      "Injections are administered using the smallest gauge needle available. The procedure takes under 20 minutes from first injection to completion.",
      "Post-treatment care instructions are provided. Downtime is typically minimal, with some clients experiencing minor site redness.",
      "A complimentary 2-week review appointment is scheduled to assess results and make any clinical adjustments.",
    ],
    idealFor: [
      "Ageing & Fine Lines",
      "Dullness & Uneven Tone",
    ],
  },
  {
    name: "Laser Renewal",
    category: "Laser",
    price: "£550",
    description: "Fractional laser for texture, pigmentation and scarring",
    slug: "laser-renewal",
    image: "/images/treatment-laser-renewal.png",
    expectation: "Skin appears pink and slightly swollen for 3–5 days post-treatment; visible improvement in texture from day 7.",
    steps: [
      "A pre-treatment skin preparation protocol begins 2 weeks before your appointment — your clinician will advise on the appropriate topical regimen.",
      "Numbing cream is applied 45 minutes prior to treatment. Protective eyewear is worn throughout the procedure.",
      "The fractional laser handpiece is passed in a grid pattern across the treatment area. Session duration varies from 20–45 minutes depending on the zones treated.",
      "Medical-grade post-laser recovery products are applied immediately. A strict sun avoidance protocol must be followed for a minimum of 4 weeks.",
    ],
    idealFor: [
      "Pigmentation",
      "Ageing & Fine Lines",
      "Acne & Breakouts",
      "Dullness & Uneven Tone",
    ],
  },
  {
    name: "HydraRevive",
    category: "Facials",
    price: "£220",
    description: "Multi-step cleanse, extract and hydrate treatment",
    slug: "hydrarevive",
    image: "/images/treatment-hydrarevive.png",
    expectation: "No downtime. Skin appears visibly cleaner, more hydrated and more even immediately post-treatment.",
    steps: [
      "Vortex cleansing and light resurfacing removes dead cells and opens pores using a spiral-tipped handpiece.",
      "Automated extraction uses a gentle vortex suction to remove impurities — a comfortable mechanism suitable even for sensitive skin.",
      "Hydration serums containing hyaluronic acid, peptides and antioxidants are infused into the freshly cleared skin.",
      "LED light therapy is applied as a final step to calm the skin and support post-treatment recovery.",
    ],
    idealFor: [
      "Dullness & Uneven Tone",
      "Acne & Breakouts",
      "Sensitivity & Redness",
    ],
  },
  {
    name: "BioRevive",
    category: "Skin Boosters",
    price: "£380",
    description: "Hyaluronic acid bio-remodelling for skin laxity",
    slug: "biorevive",
    image: "/images/treatment-biorevive.png",
    expectation: "Two sessions, 4 weeks apart, are required for the full protocol — results are cumulative and most visible 6 weeks after the second session.",
    steps: [
      "Pre-treatment assessment reviews skin laxity and hydration levels. The 5-point injection map (Bio Aesthetic Points) is marked on the skin.",
      "BioRevive is injected at five defined points per side of the face using a fine needle. The entire injection process takes under 10 minutes.",
      "The product disperses under the skin over 24–48 hours — some mild swelling at the injection points is expected and temporary.",
      "A second session is scheduled 4 weeks after the first to complete the protocol. Maintenance is recommended twice yearly.",
    ],
    idealFor: [
      "Loss of Volume",
      "Ageing & Fine Lines",
      "Dullness & Uneven Tone",
    ],
  },
  {
    name: "Light Therapy",
    category: "Recovery",
    price: "£120",
    description: "Red and near-infrared light for healing and rejuvenation",
    slug: "light-therapy",
    image: "/images/treatment-light-therapy.png",
    expectation: "A 30-minute, completely pain-free session. Most clients use LED as a recovery protocol after more intensive treatments.",
    steps: [
      "The skin is cleansed and any active serums appropriate to your concern are applied before the panel is positioned.",
      "The LED panel is placed 2–5cm from the skin surface. Red (633nm) and near-infrared (830nm) wavelengths are delivered simultaneously for 25 minutes.",
      "No downtime. Serums applied pre-treatment remain active in the skin post-session — no washing the face for at least 4 hours.",
      "LED is most effective as a series of 6–8 sessions. Your clinician will advise on optimal frequency based on the concern being addressed.",
    ],
    idealFor: [
      "Sensitivity & Redness",
      "Ageing & Fine Lines",
      "Acne & Breakouts",
    ],
  },
];
