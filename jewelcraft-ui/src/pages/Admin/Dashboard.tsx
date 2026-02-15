import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, ShoppingCart, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.data?.totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Products",
      value: stats?.data?.totalProducts || 0,
      icon: Package,
      color: "text-green-600",
    },
    {
      title: "Total Orders",
      value: stats?.data?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-purple-600",
    },
    {
      title: "Total Revenue",
      value: formatPrice(stats?.data?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="p-6 border rounded-lg bg-secondary/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Orders */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {stats?.data?.recentOrders?.map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded"
              >
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.user?.email} - {formatPrice(order.total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Low Stock Products</h2>
          <div className="space-y-4">
            {stats?.data?.lowStockProducts?.map((product: any) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded text-sm ${
                    product.stock === 0
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {product.stock === 0 ? "Out of Stock" : "Low Stock"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;

