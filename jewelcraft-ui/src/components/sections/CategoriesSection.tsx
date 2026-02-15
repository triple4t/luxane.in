import { CategoryCard } from "@/components/product/CategoryCard";

const categories = [
  { 
    title: "Rings", 
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=800&fit=crop", 
    href: "/shop?category=rings" 
  },
  { 
    title: "Earrings", 
    image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&h=800&fit=crop", 
    href: "/shop?category=earrings" 
  },
  { 
    title: "Necklaces", 
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop", 
    href: "/shop?category=necklaces" 
  },
  { 
    title: "Bracelets", 
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop", 
    href: "/shop?category=bracelets" 
  },
];

export const CategoriesSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-3">
            Find Your Perfect Piece
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Shop by Category
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.title}
              title={category.title}
              image={category.image}
              href={category.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
