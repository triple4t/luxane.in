import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const { cart, isLoading: cartLoading } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await api.getAddresses();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { addressId: string }) => {
      return api.createOrder(data);
    },
  });

  const createPaymentOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return api.createRazorpayOrder(orderId);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.verifyPayment(data);
    },
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [addresses, selectedAddressId]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Please Login
          </h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to checkout
          </p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  if (cartLoading || addressesLoading) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24">
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Your cart is empty
          </h1>
          <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
        </div>
      </Layout>
    );
  }

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast({
        title: "Address required",
        description: "Please select a shipping address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const orderResponse = await createOrderMutation.mutateAsync({
        addressId: selectedAddressId,
      });
      const orderId = orderResponse.data.id;

      // Create Razorpay order
      const paymentResponse = await createPaymentOrderMutation.mutateAsync(orderId);
      const paymentData = paymentResponse.data || paymentResponse;
      const { razorpayOrderId, amount, currency, key } = paymentData;

      // Get selected address
      const selectedAddress = addresses.find((a: any) => a.id === selectedAddressId);

      // Initialize Razorpay
      const options = {
        key: key,
        amount: Math.round(amount * 100), // Convert to paise, ensure whole number
        currency: currency,
        name: "Creative Universe",
        description: `Order #${orderId.slice(0, 8)}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            await verifyPaymentMutation.mutateAsync({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast({
              title: "Payment successful!",
              description: "Your order has been placed successfully",
            });

            navigate("/orders");
          } catch (error: any) {
            toast({
              title: "Payment verification failed",
              description: error.message || "Please contact support",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: selectedAddress?.fullName || user?.name || "",
          email: user?.email || "",
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        notes: {
          orderId: orderId,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Address */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 border rounded-lg">
              <h2 className="font-semibold text-lg mb-4">Shipping Address</h2>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No addresses found. Please add an address.
                  </p>
                  <Button variant="outline" onClick={() => navigate("/addresses")}>
                    Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address: any) => (
                    <label
                      key={address.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/50 ${
                        selectedAddressId === address.id ? "border-foreground bg-secondary" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{address.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Phone: {address.phone}
                        </p>
                        {address.isDefault && (
                          <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded mt-2 inline-block">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => navigate("/addresses")}
                    className="w-full"
                  >
                    Add New Address
                  </Button>
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div className="p-6 border rounded-lg">
              <h2 className="font-semibold text-lg mb-4">Order Items</h2>
              <div className="space-y-3">
                {cart.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 p-6 border rounded-lg bg-secondary/30">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{cart.count}</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={!selectedAddressId || isProcessing || addresses.length === 0}
              >
                {isProcessing ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

