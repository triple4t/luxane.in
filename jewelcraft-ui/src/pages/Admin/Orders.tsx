import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { OrderTrackingBlock } from "@/components/order/OrderTrackingBlock";
import { API_BASE_URL } from "@/lib/api";

const Orders = () => {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(
        `${API_BASE_URL}/orders/admin/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-600",
      PROCESSING: "bg-blue-500/10 text-blue-600",
      SHIPPED: "bg-purple-500/10 text-purple-600",
      DELIVERED: "bg-green-500/10 text-green-600",
      CANCELLED: "bg-red-500/10 text-red-600",
    };
    return colors[status] || "bg-gray-500/10 text-gray-600";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Orders</h1>

        <div className="space-y-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : orders?.data?.length === 0 ? (
            <p>No orders found</p>
          ) : (
            orders?.data?.map((order: any) => (
              <div key={order.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.user?.email} - {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Select
                      value={order.status}
                      onValueChange={(status) =>
                        updateStatusMutation.mutate({ id: order.id, status })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Items:</p>
                  <div className="space-y-2">
                    {order.orderItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <p className="text-lg font-semibold">
                      Total: {formatPrice(order.total)}
                    </p>
                  </div>
                  <OrderTrackingBlock
                    orderId={order.id}
                    hasShiprocket={!(order.shiprocketShipmentId == null && order.shiprocketOrderId == null)}
                    compact
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Orders;

