import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { OrderTrackingBlock } from "@/components/order/OrderTrackingBlock";

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.getOrders();
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            Please Login
          </h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your orders
          </p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 sm:py-12">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="container py-16 sm:py-24 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
            No orders yet
          </h1>
          <p className="text-muted-foreground mb-6">
            Start shopping to see your orders here
          </p>
          <Button asChild>
            <a href="/shop">Continue Shopping</a>
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600";
      case "PROCESSING":
        return "bg-blue-500/10 text-blue-600";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-600";
      case "DELIVERED":
        return "bg-green-500/10 text-green-600";
      case "CANCELLED":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  return (
    <Layout>
      <div className="container py-8 sm:py-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-8">
          My Orders
        </h1>

        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="border rounded-lg p-6 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {order.orderItems.length} item(s)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
                  {order.payment && (
                    <p className="text-xs text-muted-foreground">
                      Payment: {order.payment.status}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {order.orderItems.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-xs font-medium">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <OrderTrackingBlock
                orderId={order.id}
                hasShiprocket={!(order.shiprocketShipmentId == null && order.shiprocketOrderId == null)}
              />

              {order.status === "PENDING" && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await api.cancelOrder(order.id);
                        window.location.reload();
                      } catch (error: any) {
                        alert(error.message || "Failed to cancel order");
                      }
                    }}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;

