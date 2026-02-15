import { BudgetCard } from "@/components/product/BudgetCard";
import { budgetRanges } from "@/data/products";

export const BudgetSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-cream-dark">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-3">
            Creative Universe
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Shop Within Your Budget
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover exquisite jewelry that fits your style and budget perfectly.
          </p>
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {budgetRanges.map((range) => (
            <BudgetCard
              key={range.id}
              title={range.name}
              href={`/shop?maxPrice=${range.max}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
