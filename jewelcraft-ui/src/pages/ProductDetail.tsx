import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag, Minus, Plus, ArrowLeft, Star, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { ProductGrid } from "@/components/product/ProductGrid";
import api from "@/lib/api";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { addToCart, isAdding } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch product details
  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Product slug is required");
      const response = await api.getProductBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });

  // Fetch similar products (same category)
  const { data: similarProducts = [] } = useQuery({
    queryKey: ["similar-products", productData?.category],
    queryFn: async () => {
      if (!productData?.category) return [];
      const response = await api.getProducts({
        category: productData.category,
        limit: 4,
      });
      // Exclude current product
      return (response.data || []).filter((p: any) => p.id !== productData.id);
    },
    enabled: !!productData?.category,
  });

  // Fetch reviews
  const { data: reviewsData = [] } = useQuery({
    queryKey: ["reviews", productData?.id],
    queryFn: async () => {
      if (!productData?.id) return [];
      const response = await api.getProductReviews(productData.id);
      return response.data || [];
    },
    enabled: !!productData?.id,
  });

  // Fetch user's review
  const { data: userReview } = useQuery({
    queryKey: ["user-review", productData?.id],
    queryFn: async () => {
      if (!productData?.id || !isAuthenticated) return null;
      try {
        const response = await api.getUserReview(productData.id);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!productData?.id && isAuthenticated,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: { productId: string; rating: number; comment?: string }) =>
      api.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", product?.id] });
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
      queryClient.invalidateQueries({ queryKey: ["user-review", product?.id] });
      setReviewRating(0);
      setReviewComment("");
      setShowReviewForm(false);
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => api.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", product?.id] });
      queryClient.invalidateQueries({ queryKey: ["product", slug] });
      queryClient.invalidateQueries({ queryKey: ["user-review", product?.id] });
      toast({
        title: "Review deleted",
        description: "Your review has been removed",
      });
    },
  });

  const product = productData;

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Get product images (array or single image)
  const productImages = product?.image
    ? Array.isArray(product.image) 
      ? product.image 
      : [product.image]
    : [];

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

    if (!product?.inStock) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    addToCart({ productId: product.id, quantity });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please login",
        description: "You need to login to proceed",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!product?.inStock) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    // Add to cart and navigate to checkout
    addToCart({ productId: product.id, quantity });
    navigate("/checkout");
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

    if (isWishlisted(product?.id || "")) {
      removeFromWishlist(product?.id || "");
      toast({
        title: "Removed from wishlist",
        description: `${product?.name} has been removed from your wishlist`,
      });
    } else {
      addToWishlist(product?.id || "");
      toast({
        title: "Added to wishlist",
        description: `${product?.name} has been added to your wishlist`,
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Product Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist.
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
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden bg-cream rounded-sm">
              <img
                src={productImages[selectedImage] || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-sm border-2 transition-all ${
                      selectedImage === index
                        ? "border-foreground"
                        : "border-transparent hover:border-foreground/50"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Badge */}
            {product.badge && (
              <Badge
                className={
                  product.badge === "sale"
                    ? "bg-accent text-accent-foreground"
                    : product.badge === "trending"
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground text-background"
                }
              >
                {product.badge === "sale" && discount > 0
                  ? `-${discount}%`
                  : product.badge.charAt(0).toUpperCase() + product.badge.slice(1)}
              </Badge>
            )}

            {/* Product Name */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground">
              {product.name}
            </h1>

            {/* Rating */}
            {product.averageRating && product.averageRating > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(product.averageRating!)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="font-semibold text-2xl text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-muted-foreground line-through text-lg">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.inStock ? (
                <p className="text-green-600 text-sm font-medium">
                  ✓ In Stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-red-600 text-sm font-medium">✗ Out of Stock</p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center border rounded-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                size="lg"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {isAdding ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
              >
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={handleWishlist}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted(product.id)
                      ? "fill-destructive text-destructive"
                      : ""
                  }`}
                />
              </Button>
            </div>

            {/* Product Info */}
            <div className="border-t pt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collection:</span>
                <span className="font-medium capitalize">{product.collection}</span>
              </div>
              {product.likes && product.likes > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes:</span>
                  <span className="font-medium">{product.likes.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-2">
                Customer Reviews
              </h2>
              {product.averageRating && product.averageRating > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(product.averageRating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">
                    {product.averageRating?.toFixed(1)} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet</p>
              )}
            </div>
            {isAuthenticated && !userReview && (
              <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                Write a Review
              </Button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && isAuthenticated && !userReview && (
            <div className="mb-8 p-6 border rounded-lg bg-muted/50">
              <h3 className="font-medium mb-4">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= reviewRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (reviewRating === 0) {
                        toast({
                          title: "Rating required",
                          description: "Please select a rating",
                          variant: "destructive",
                        });
                        return;
                      }
                      createReviewMutation.mutate({
                        productId: product.id,
                        rating: reviewRating,
                        comment: reviewComment || undefined,
                      });
                    }}
                    disabled={createReviewMutation.isPending}
                  >
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewComment("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User's Review */}
          {userReview && (
            <div className="mb-8 p-6 border rounded-lg bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Your Review</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= userReview.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {userReview.comment && (
                    <p className="text-muted-foreground">{userReview.comment}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(userReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete your review?")) {
                      deleteReviewMutation.mutate(userReview.id);
                    }
                  }}
                  disabled={deleteReviewMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviewsData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No reviews yet. Be the first to review this product!
              </p>
            ) : (
              reviewsData
                .filter((review: any) => review.id !== userReview?.id)
                .map((review: any) => (
                  <div key={review.id} className="border-b pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {review.user?.name || review.user?.email?.split("@")[0] || "Anonymous"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground mt-2">{review.comment}</p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
                Similar Products
              </h2>
              <p className="text-muted-foreground">
                You might also like these products
              </p>
            </div>
            <ProductGrid products={similarProducts} columns={4} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;

