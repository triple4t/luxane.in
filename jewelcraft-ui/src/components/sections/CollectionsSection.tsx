import { CollectionCard } from "@/components/product/CollectionCard";
import { collections } from "@/data/products";

export const CollectionsSection = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-3">
            Curated For You
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Our Collections
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Explore thoughtfully curated collections for every style and occasion.
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              title={collection.name}
              description={collection.description}
              href={`/shop?collection=${collection.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
