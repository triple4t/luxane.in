import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Wishlist = () => {
  const { wishlist, isLoading } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Please Login
          </h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your wishlist
          </p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const products = wishlist.map((item: any) => item.product);

  if (products.length === 0) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Your wishlist is empty
          </h1>
          <p className="text-muted-foreground mb-6">
            Start adding products to your wishlist
          </p>
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-8">
          My Wishlist
        </h1>
        <ProductGrid products={products} columns={4} />
      </div>
    </Layout>
  );
};

export default Wishlist;

