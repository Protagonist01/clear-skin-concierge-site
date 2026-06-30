export interface Product {
  name: string;
  concern: string;
  price: string;
  description: string;
  slug: string;
  image?: string;
}

export const PRODUCTS: Product[] = [
  {
    name: "Restore Serum",
    concern: "Hydration",
    price: "£95",
    description: "Ceramide-rich serum rebuilding the skin's protective layer",
    slug: "restore-serum",
    image: "/images/product-restore-serum.png",
  },
  {
    name: "Brightening Complex",
    concern: "Brightening",
    price: "£85",
    description: "20% stabilised Vitamin C for luminosity and even tone",
    slug: "brightening-complex",
    image: "/images/product-brightening-complex.png",
  },
  {
    name: "Renewal Night Cream",
    concern: "Anti-Ageing",
    price: "£110",
    description: "Encapsulated retinol for overnight cell renewal",
    slug: "renewal-night-cream",
    image: "/images/product-renewal-night-cream.png",
  },
  {
    name: "Eye Revival",
    concern: "Eye Area",
    price: "£75",
    description: "Multi-peptide formula targeting dark circles and fine lines",
    slug: "eye-revival",
    image: "/images/product-eye-revival.png",
  },
  {
    name: "Daily Shield SPF50",
    concern: "Protection",
    price: "£65",
    description: "Featherlight mineral SPF, invisible finish",
    slug: "daily-shield-spf50",
    image: "/images/product-daily-shield-spf50.png",
  },
  {
    name: "Purifying Cleanse Balm",
    concern: "Cleansing",
    price: "£70",
    description: "Papaya enzyme balm that melts makeup and impurities",
    slug: "purifying-cleanse-balm",
    image: "/images/product-purifying-cleanse-balm.png",
  },
];
