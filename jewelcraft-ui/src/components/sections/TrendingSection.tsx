import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export const TrendingSection = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const response = await api.getProducts({ 
        sortBy: 'popular',
        limit: 4 
      });
      // Filter products with likes > 0 or badge = trending
      const trending = (response.data || []).filter(
        (p: any) => (p.likes && p.likes > 0) || p.badge === 'trending'
      ).slice(0, 4);
      return trending;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-secondary/30">
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
    <section className="py-16 sm:py-20 lg:py-24 bg-secondary/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-muted-foreground text-sm tracking-[0.2em] uppercase mb-3">
            Community Favorites
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Trending Online
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            See what's capturing hearts across social media right now.
          </p>
        </div>

        {/* Products Grid */}
        <ProductGrid products={products} columns={4} />

        {/* View All Button */}
        <div className="text-center mt-10 sm:mt-12">
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link to="/shop?sort=popular">
              Explore Trending
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
