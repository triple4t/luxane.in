import necklace1 from "@/assets/products/necklace-1.jpg";
import necklace2 from "@/assets/products/necklace-2.jpg";
import earrings1 from "@/assets/products/earrings-1.jpg";
import earrings2 from "@/assets/products/earrings-2.jpg";
import bracelet1 from "@/assets/products/bracelet-1.jpg";
import ring1 from "@/assets/products/ring-1.jpg";
import ring2 from "@/assets/products/ring-2.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  collection: string;
  badge?: "sale" | "trending" | "new";
  likes?: number;
  inStock: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Celestial Pendant Necklace",
    price: 89,
    originalPrice: 129,
    image: necklace1,
    category: "necklaces",
    collection: "celestial",
    badge: "sale",
    inStock: true,
  },
  {
    id: "2",
    name: "Classic Gold Hoops",
    price: 45,
    image: earrings1,
    category: "earrings",
    collection: "minimal",
    badge: "trending",
    likes: 245000,
    inStock: true,
  },
  {
    id: "3",
    name: "Delicate Chain Bracelet",
    price: 65,
    originalPrice: 85,
    image: bracelet1,
    category: "bracelets",
    collection: "everyday",
    badge: "sale",
    inStock: true,
  },
  {
    id: "4",
    name: "Diamond Solitaire Ring",
    price: 199,
    image: ring1,
    category: "rings",
    collection: "bridal",
    badge: "new",
    inStock: true,
  },
  {
    id: "5",
    name: "Pearl Stud Earrings",
    price: 55,
    image: earrings2,
    category: "earrings",
    collection: "classic",
    badge: "trending",
    likes: 189000,
    inStock: true,
  },
  {
    id: "6",
    name: "Layered Chain Necklace",
    price: 120,
    originalPrice: 150,
    image: necklace2,
    category: "necklaces",
    collection: "statement",
    badge: "sale",
    inStock: true,
  },
  {
    id: "7",
    name: "Minimalist Signet Ring",
    price: 78,
    image: ring2,
    category: "rings",
    collection: "minimal",
    badge: "trending",
    likes: 156000,
    inStock: true,
  },
  {
    id: "8",
    name: "Vintage Pearl Pendant",
    price: 95,
    originalPrice: 125,
    image: necklace1,
    category: "necklaces",
    collection: "vintage",
    badge: "sale",
    inStock: true,
  },
];

export const categories = [
  { id: "rings", name: "Rings", count: 124 },
  { id: "earrings", name: "Earrings", count: 89 },
  { id: "necklaces", name: "Necklaces", count: 156 },
  { id: "bracelets", name: "Bracelets", count: 67 },
];

export const collections = [
  { id: "anti-tarnish", name: "Anti-Tarnish", description: "Long-lasting beauty" },
  { id: "korean-style", name: "Korean Style", description: "K-beauty inspired" },
  { id: "minimal", name: "Minimal", description: "Less is more" },
  { id: "statement", name: "Statement", description: "Bold & beautiful" },
  { id: "vintage", name: "Vintage", description: "Timeless classics" },
  { id: "bridal", name: "Bridal", description: "Your special day" },
];

export const budgetRanges = [
  { id: "under-200", name: "Under ₹200", max: 200 },
  { id: "under-400", name: "Under ₹400", max: 400 },
  { id: "under-600", name: "Under ₹600", max: 600 },
  { id: "under-800", name: "Under ₹800", max: 800 },
  { id: "under-1000", name: "Under ₹1000", max: 1000 },
];
