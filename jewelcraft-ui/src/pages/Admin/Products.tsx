import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, X, Upload } from "lucide-react";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const Products = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    images: [] as string[], // Array of image URLs
    category: "",
    collection: "",
    badge: "",
    description: "",
    stock: "",
    inStock: true,
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const response = await api.getProducts({ limit: 100 });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://localhost:5001/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`http://localhost:5001/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product updated successfully" });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`http://localhost:5001/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      originalPrice: "",
      images: [],
      category: "",
      collection: "",
      badge: "",
      description: "",
      stock: "",
      inStock: true,
    });
    setImageFiles([]);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    // Handle both single image (string) and multiple images (array)
    const images = Array.isArray(product.image) ? product.image : product.image ? [product.image] : [];
    setFormData({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      images: images,
      category: product.category,
      collection: product.collection,
      badge: product.badge || "",
      description: product.description || "",
      stock: product.stock.toString(),
      inStock: product.inStock,
    });
    setImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First, upload any new image files
    let uploadedImageUrls: string[] = [];
    if (imageFiles.length > 0 && editingProduct) {
      setUploadingImages(true);
      try {
        const response = await api.uploadProductImages(editingProduct.id, imageFiles);
        uploadedImageUrls = response.data.image || [];
      } catch (error: any) {
        toast({
          title: "Error uploading images",
          description: error.message || "Failed to upload images",
          variant: "destructive",
        });
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    // Combine existing images with newly uploaded ones
    const allImages = [...formData.images, ...uploadedImageUrls];

    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : null,
      image: allImages.length > 0 ? allImages : [], // Send as array
      category: formData.category,
      collection: formData.collection,
      badge: formData.badge || null,
      description: formData.description || null,
      stock: parseInt(formData.stock) || 0,
      inStock: formData.inStock,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...files]);
    }
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImageUrl = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const deleteImageMutation = useMutation({
    mutationFn: async ({ productId, imageUrl }: { productId: string; imageUrl: string }) => {
      return api.deleteProductImage(productId, imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Image deleted successfully" });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Products</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add Product"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Original Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, originalPrice: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Product Images *</Label>
                  <div className="space-y-4">
                    {/* Existing Images */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            {editingProduct && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm("Delete this image?")) {
                                    deleteImageMutation.mutate({
                                      productId: editingProduct.id,
                                      imageUrl: img,
                                    });
                                    removeImageUrl(index);
                                  }
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload New Images */}
                    {editingProduct && (
                      <div>
                        <Label>Upload Additional Images</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-secondary"
                          >
                            <Upload className="h-4 w-4" />
                            Select Images
                          </label>
                        </div>
                        {imageFiles.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {imageFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-secondary rounded"
                              >
                                <span className="text-sm truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeImageFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* For new products, allow URL input */}
                    {!editingProduct && (
                      <div>
                        <Label>Image URL (you can add more after creating)</Label>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          onChange={(e) => {
                            if (e.target.value) {
                              setFormData({
                                ...formData,
                                images: [e.target.value],
                              });
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          You can upload more images after creating the product
                        </p>
                      </div>
                    )}

                    {formData.images.length === 0 && !editingProduct && (
                      <p className="text-sm text-red-500">At least one image is required</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Collection *</Label>
                    <Input
                      value={formData.collection}
                      onChange={(e) =>
                        setFormData({ ...formData, collection: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Badge (sale, trending, new)</Label>
                  <Input
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    className="w-full border rounded p-2 min-h-[100px]"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) =>
                        setFormData({ ...formData, inStock: e.target.checked })
                      }
                    />
                    <Label>In Stock</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || uploadingImages || (formData.images.length === 0 && !editingProduct)}
                  >
                    {uploadingImages 
                      ? "Uploading..." 
                      : editingProduct 
                        ? "Update" 
                        : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Stock</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : products?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products?.map((product: any) => (
                    <tr key={product.id} className="border-t">
                      <td className="px-4 py-3">
                        <img
                          src={Array.isArray(product.image) && product.image.length > 0 
                            ? product.image[0] 
                            : product.image || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        {Array.isArray(product.image) && product.image.length > 1 && (
                          <span className="text-xs text-muted-foreground">
                            +{product.image.length - 1} more
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">{product.category}</td>
                      <td className="px-4 py-3">{product.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this product?")) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Products;

