import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Filter, ChevronDown, Grid3X3, LayoutGrid } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popular", label: "Best Sellers" },
];

const budgetRanges = [
  { id: "under-200", name: "Under ₹200", max: 200 },
  { id: "under-400", name: "Under ₹400", max: 400 },
  { id: "under-600", name: "Under ₹600", max: 600 },
  { id: "under-800", name: "Under ₹800", max: 800 },
  { id: "under-1000", name: "Under ₹1000", max: 1000 },
];

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);

  // Get initial category from URL
  const urlCategory = searchParams.get("category");
  const urlCollection = searchParams.get("collection");
  const urlSort = searchParams.get("sort");

  useEffect(() => {
    if (urlCategory && !selectedCategories.includes(urlCategory)) {
      setSelectedCategories([urlCategory]);
    }
    if (urlCollection && !selectedCollections.includes(urlCollection)) {
      setSelectedCollections([urlCollection]);
    }
    if (urlSort) {
      setSortBy(urlSort);
    }
  }, [urlCategory, urlCollection, urlSort]);

  // Fetch categories and collections
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.getCategories();
      return response.data;
    },
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await api.getCollections();
      return response.data;
    },
  });

  // Build query params for products
  const productParams: any = {
    sortBy,
    limit: 50,
  };

  if (selectedCategories.length > 0) {
    // Send all selected categories as comma-separated string
    productParams.category = selectedCategories.join(',');
  }
  if (selectedCollections.length > 0) {
    // Send all selected collections as comma-separated string
    productParams.collection = selectedCollections.join(',');
  }
  if (selectedBudget) {
    const budget = budgetRanges.find((b) => b.id === selectedBudget);
    if (budget) {
      productParams.maxPrice = budget.max;
    }
  }

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', productParams],
    queryFn: async () => {
      const response = await api.getProducts(productParams);
      return response.data || [];
    },
  });

  const products = productsData || [];
  const categories = categoriesData || [];
  const collections = collectionsData || [];

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleCollection = (collection: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collection) ? prev.filter((c) => c !== collection) : [...prev, collection]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedCollections([]);
    setSelectedBudget(null);
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedCollections.length > 0 || selectedBudget;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-medium text-sm mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map((category: any) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label htmlFor={category.id} className="text-sm cursor-pointer">
                {category.name} ({category.count})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Collections */}
      <div>
        <h4 className="font-medium text-sm mb-3">Collection</h4>
        <div className="space-y-2">
          {collections.map((collection: any) => (
            <div key={collection.id} className="flex items-center space-x-2">
              <Checkbox
                id={collection.id}
                checked={selectedCollections.includes(collection.id)}
                onCheckedChange={() => toggleCollection(collection.id)}
              />
              <Label htmlFor={collection.id} className="text-sm cursor-pointer">
                {collection.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <h4 className="font-medium text-sm mb-3">Price Range</h4>
        <div className="space-y-2">
          {budgetRanges.map((range) => (
            <div key={range.id} className="flex items-center space-x-2">
              <Checkbox
                id={range.id}
                checked={selectedBudget === range.id}
                onCheckedChange={() =>
                  setSelectedBudget(selectedBudget === range.id ? null : range.id)
                }
              />
              <Label htmlFor={range.id} className="text-sm cursor-pointer">
                {range.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-secondary/30 py-12 sm:py-16">
        <div className="container text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
            Shop All Jewelry
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Explore our complete collection of handcrafted jewelry pieces.
          </p>
        </div>
      </div>

      <div className="container py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32">
              <h3 className="font-medium text-lg mb-4">Filters</h3>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-1.5 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {selectedCategories.length + selectedCollections.length + (selectedBudget ? 1 : 0)}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] bg-background">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : `${products.length} products`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Grid Toggle */}
                <div className="hidden sm:flex items-center border border-border rounded-sm overflow-hidden">
                  <button
                    onClick={() => setGridColumns(3)}
                    className={`p-2 transition-colors ${
                      gridColumns === 3 ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setGridColumns(4)}
                    className={`p-2 transition-colors ${
                      gridColumns === 4 ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    {categories.find((c: any) => c.id === cat)?.name}
                    <span className="text-muted-foreground">×</span>
                  </button>
                ))}
                {selectedCollections.map((col) => (
                  <button
                    key={col}
                    onClick={() => toggleCollection(col)}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    {collections.find((c: any) => c.id === col)?.name}
                    <span className="text-muted-foreground">×</span>
                  </button>
                ))}
                {selectedBudget && (
                  <button
                    onClick={() => setSelectedBudget(null)}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    {budgetRanges.find((b) => b.id === selectedBudget)?.name}
                    <span className="text-muted-foreground">×</span>
                  </button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <ProductGrid products={products} columns={gridColumns} />
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  No products found matching your criteria.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Shop;
