import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export const BestSellersSection = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: async () => {
      const response = await api.getProducts({ sortBy: 'popular', limit: 4 });
      return response.data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container">
          <div className="text-center mb-10 sm:mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-3">
            Most Loved
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Best Sellers
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover our most adored pieces, chosen by jewelry lovers worldwide.
          </p>
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} columns={4} />

        {/* View All Button */}
        <div className="text-center mt-10 sm:mt-12">
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link to="/shop?sort=popular">
              View All Best Sellers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
