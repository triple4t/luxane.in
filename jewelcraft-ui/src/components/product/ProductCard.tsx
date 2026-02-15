import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string | string[]; // Can be single image or array
  category: string;
  collection: string;
  badge?: string | null;
  likes?: number | null;
  averageRating?: number;
  reviewCount?: number;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

const formatLikes = (likes: number): string => {
  if (likes >= 1000000) {
    return `${(likes / 1000000).toFixed(1)}M`;
  }
  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(0)}k`;
  }
  return likes.toString();
};

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, isAdding } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to add items to cart",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!product.inStock) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    addToCart({ productId: product.id, quantity: 1 });
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to add items to wishlist",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <div
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-cream rounded-sm mb-4">
        <Link to={`/product/${product.slug || product.id}`} className="block w-full h-full">
          <img
            src={Array.isArray(product.image) && product.image.length > 0
              ? product.image[0]
              : typeof product.image === 'string'
              ? product.image
              : '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 cursor-pointer"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badge === "sale" && discount > 0 && (
            <Badge className="bg-accent text-accent-foreground font-medium text-xs px-2.5 py-1">
              -{discount}%
            </Badge>
          )}
          {product.badge === "trending" && (
            <Badge className="bg-primary text-primary-foreground font-medium text-xs px-2.5 py-1">
              Trending
            </Badge>
          )}
          {product.badge === "new" && (
            <Badge className="bg-foreground text-background font-medium text-xs px-2.5 py-1">
              New
            </Badge>
          )}
        </div>

        {/* Likes Badge */}
        {product.likes && product.likes > 0 && (
          <div className="absolute top-3 right-3">
            <div className="bg-background/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-soft">
              <Heart className="w-3.5 h-3.5 fill-destructive text-destructive" />
              <span className="text-xs font-medium">{formatLikes(product.likes)}</span>
            </div>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlist();
          }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-soft transition-all duration-300 z-10",
            product.likes ? "hidden" : "block",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isWishlisted(product.id) ? "fill-destructive text-destructive" : "text-foreground"
            )}
          />
        </button>

        {/* Quick Add Button */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 z-10",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={!product.inStock || isAdding}
            className="w-full bg-background text-foreground hover:bg-foreground hover:text-background transition-colors shadow-elegant"
            size="sm"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {isAdding ? "Adding..." : product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1.5">
        <Link to={`/product/${product.slug || product.id}`}>
          <h3 className="font-medium text-sm text-foreground group-hover:text-accent transition-colors line-clamp-1 cursor-pointer">
            {product.name}
          </h3>
        </Link>
        {/* Rating */}
        {product.averageRating && product.averageRating > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(product.averageRating!)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-muted-foreground line-through text-sm">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
