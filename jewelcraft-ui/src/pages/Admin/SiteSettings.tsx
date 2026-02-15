import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";

const SiteSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    siteName: "",
    siteLogo: "",
    siteDescription: "",
    contactEmail: "",
    contactPhone: "",
  });

  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/settings");
      return response.json();
    },
    onSuccess: (data) => {
      setSettings({
        siteName: data.data?.siteName || "",
        siteLogo: data.data?.siteLogo || "",
        siteDescription: data.data?.siteDescription || "",
        contactEmail: data.data?.contactEmail || "",
        contactPhone: data.data?.contactPhone || "",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch(
        `http://localhost:5001/api/site/settings/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ value, type: "text", category: "general" }),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Setting updated" });
    },
  });

  const handleUpdate = (key: string, value: string) => {
    updateMutation.mutate({ key, value });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Site Settings</h1>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="border rounded-lg p-6 space-y-4">
              <div>
                <Label>Site Name</Label>
                <Input
                  value={settings.siteName}
                  onChange={(e) => {
                    setSettings({ ...settings, siteName: e.target.value });
                  }}
                  onBlur={() => handleUpdate("siteName", settings.siteName)}
                />
              </div>
              <div>
                <Label>Site Logo URL</Label>
                <Input
                  value={settings.siteLogo}
                  onChange={(e) => {
                    setSettings({ ...settings, siteLogo: e.target.value });
                  }}
                  onBlur={() => handleUpdate("siteLogo", settings.siteLogo)}
                />
              </div>
              <div>
                <Label>Site Description</Label>
                <textarea
                  className="w-full border rounded p-2 min-h-[100px]"
                  value={settings.siteDescription}
                  onChange={(e) => {
                    setSettings({ ...settings, siteDescription: e.target.value });
                  }}
                  onBlur={() => handleUpdate("siteDescription", settings.siteDescription)}
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => {
                    setSettings({ ...settings, contactEmail: e.target.value });
                  }}
                  onBlur={() => handleUpdate("contactEmail", settings.contactEmail)}
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={settings.contactPhone}
                  onChange={(e) => {
                    setSettings({ ...settings, contactPhone: e.target.value });
                  }}
                  onBlur={() => handleUpdate("contactPhone", settings.contactPhone)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="navigation">
            <NavigationManager />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManager />
          </TabsContent>

          <TabsContent value="hero">
            <HeroManager />
          </TabsContent>

          <TabsContent value="footer">
            <FooterManager />
          </TabsContent>

          <TabsContent value="social">
            <SocialLinksManager />
          </TabsContent>

          <TabsContent value="homepage">
            <HomepageSectionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

// Navigation Manager Component
const NavigationManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", href: "", order: 0, isActive: true });

  const { data: links } = useQuery({
    queryKey: ["admin-navigation-links"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/admin/navigation", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://localhost:5001/api/site/navigation", {
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
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({ title: "Navigation link created" });
      setIsDialogOpen(false);
      setFormData({ name: "", href: "", order: 0, isActive: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(
        `http://localhost:5001/api/site/navigation/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({ title: "Navigation link updated" });
      setIsDialogOpen(false);
      setEditingLink(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `http://localhost:5001/api/site/navigation/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-navigation-links"] });
      queryClient.invalidateQueries({ queryKey: ["navigation-links"] });
      toast({ title: "Navigation link deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Navigation Links</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingLink(null);
              setFormData({ name: "", href: "", order: 0, isActive: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? "Edit Link" : "Add Link"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Link (href)</Label>
                <Input
                  value={formData.href}
                  onChange={(e) =>
                    setFormData({ ...formData, href: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingLink) {
                      updateMutation.mutate({ id: editingLink.id, data: formData });
                    } else {
                      createMutation.mutate(formData);
                    }
                  }}
                >
                  {editingLink ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingLink(null);
                    setFormData({ name: "", href: "", order: 0, isActive: true });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Link</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links?.data?.map((link: any) => (
              <tr key={link.id} className="border-t">
                <td className="px-4 py-3">{link.name}</td>
                <td className="px-4 py-3">{link.href}</td>
                <td className="px-4 py-3">{link.order}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${link.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {link.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingLink(link);
                        setFormData({
                          name: link.name,
                          href: link.href,
                          order: link.order,
                          isActive: link.isActive,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this navigation link?")) {
                          deleteMutation.mutate(link.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Announcements Manager
const AnnouncementsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({ text: "", order: 0, isActive: true });

  const { data: announcements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/admin/announcements", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://localhost:5001/api/site/announcements", {
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
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Announcement created" });
      setIsDialogOpen(false);
      setFormData({ text: "", order: 0, isActive: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(
        `http://localhost:5001/api/site/announcements/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Announcement updated" });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `http://localhost:5001/api/site/announcements/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Announcement deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAnnouncement(null);
              setFormData({ text: "", order: 0, isActive: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Add Announcement"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Text</Label>
                <Input
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingAnnouncement) {
                      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
                    } else {
                      createMutation.mutate(formData);
                    }
                  }}
                >
                  {editingAnnouncement ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingAnnouncement(null);
                    setFormData({ text: "", order: 0, isActive: true });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left">Text</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements?.data?.map((announcement: any) => (
              <tr key={announcement.id} className="border-t">
                <td className="px-4 py-3">{announcement.text}</td>
                <td className="px-4 py-3">{announcement.order}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${announcement.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {announcement.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAnnouncement(announcement);
                        setFormData({
                          text: announcement.text,
                          order: announcement.order,
                          isActive: announcement.isActive,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this announcement?")) {
                          deleteMutation.mutate(announcement.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Hero Manager
const HeroManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    button1Text: "",
    button1Link: "",
    button2Text: "",
    button2Link: "",
    isActive: true,
  });

  const { data: heroes } = useQuery({
    queryKey: ["admin-hero"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/admin/hero", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://localhost:5001/api/site/hero", {
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
      queryClient.invalidateQueries({ queryKey: ["admin-hero"] });
      queryClient.invalidateQueries({ queryKey: ["hero"] });
      toast({ title: "Hero section created" });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        image: "",
        button1Text: "",
        button1Link: "",
        button2Text: "",
        button2Link: "",
        isActive: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(
        `http://localhost:5001/api/site/hero/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero"] });
      queryClient.invalidateQueries({ queryKey: ["hero"] });
      toast({ title: "Hero section updated" });
      setIsDialogOpen(false);
      setEditingHero(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `http://localhost:5001/api/site/hero/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero"] });
      queryClient.invalidateQueries({ queryKey: ["hero"] });
      toast({ title: "Hero section deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Hero Section</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingHero(null);
              setFormData({
                title: "",
                subtitle: "",
                description: "",
                image: "",
                button1Text: "",
                button1Link: "",
                button2Text: "",
                button2Link: "",
                isActive: true,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hero Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingHero ? "Edit Hero Section" : "Add Hero Section"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
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
              <div>
                <Label>Image URL *</Label>
                <Input
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Button 1 Text</Label>
                  <Input
                    value={formData.button1Text}
                    onChange={(e) =>
                      setFormData({ ...formData, button1Text: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Button 1 Link</Label>
                  <Input
                    value={formData.button1Link}
                    onChange={(e) =>
                      setFormData({ ...formData, button1Link: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Button 2 Text</Label>
                  <Input
                    value={formData.button2Text}
                    onChange={(e) =>
                      setFormData({ ...formData, button2Text: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Button 2 Link</Label>
                  <Input
                    value={formData.button2Link}
                    onChange={(e) =>
                      setFormData({ ...formData, button2Link: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingHero) {
                      updateMutation.mutate({ id: editingHero.id, data: formData });
                    } else {
                      createMutation.mutate(formData);
                    }
                  }}
                >
                  {editingHero ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingHero(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {heroes?.data?.map((hero: any) => (
          <div key={hero.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{hero.title}</h3>
                <p className="text-sm text-muted-foreground">{hero.subtitle}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${hero.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {hero.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingHero(hero);
                  setFormData({
                    title: hero.title,
                    subtitle: hero.subtitle || "",
                    description: hero.description || "",
                    image: hero.image,
                    button1Text: hero.button1Text || "",
                    button1Link: hero.button1Link || "",
                    button2Text: hero.button2Text || "",
                    button2Link: hero.button2Link || "",
                    isActive: hero.isActive,
                  });
                  setIsDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this hero section?")) {
                    deleteMutation.mutate(hero.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Footer Manager
const FooterManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    links: [{ name: "", href: "" }],
    order: 0,
    isActive: true,
  });

  const { data: sections } = useQuery({
    queryKey: ["admin-footer"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/admin/footer", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://localhost:5001/api/site/footer", {
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
      queryClient.invalidateQueries({ queryKey: ["admin-footer"] });
      queryClient.invalidateQueries({ queryKey: ["footer"] });
      toast({ title: "Footer section created" });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        links: [{ name: "", href: "" }],
        order: 0,
        isActive: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(
        `http://localhost:5001/api/site/footer/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-footer"] });
      queryClient.invalidateQueries({ queryKey: ["footer"] });
      toast({ title: "Footer section updated" });
      setIsDialogOpen(false);
      setEditingSection(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `http://localhost:5001/api/site/footer/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-footer"] });
      queryClient.invalidateQueries({ queryKey: ["footer"] });
      toast({ title: "Footer section deleted" });
    },
  });

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { name: "", href: "" }],
    });
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    });
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, links: newLinks });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Footer Sections</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSection(null);
              setFormData({
                title: "",
                links: [{ name: "", href: "" }],
                order: 0,
                isActive: true,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSection ? "Edit Footer Section" : "Add Footer Section"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Links</Label>
                {formData.links.map((link, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Name"
                      value={link.name}
                      onChange={(e) => updateLink(index, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Href"
                      value={link.href}
                      onChange={(e) => updateLink(index, "href", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addLink} className="mt-2">
                  Add Link
                </Button>
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingSection) {
                      updateMutation.mutate({ id: editingSection.id, data: formData });
                    } else {
                      createMutation.mutate(formData);
                    }
                  }}
                >
                  {editingSection ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSection(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sections?.data?.map((section: any) => (
          <div key={section.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {section.links?.length || 0} links
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${section.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {section.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingSection(section);
                  setFormData({
                    title: section.title,
                    links: section.links || [{ name: "", href: "" }],
                    order: section.order,
                    isActive: section.isActive,
                  });
                  setIsDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this footer section?")) {
                    deleteMutation.mutate(section.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Social Links Manager
const SocialLinksManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [formData, setFormData] = useState({
    platform: "",
    url: "",
    icon: "",
    order: 0,
    isActive: true,
  });

  const { data: links } = useQuery({
    queryKey: ["admin-social"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/admin/social", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("http://localhost:5001/api/site/social", {
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
      queryClient.invalidateQueries({ queryKey: ["admin-social"] });
      queryClient.invalidateQueries({ queryKey: ["social"] });
      toast({ title: "Social link created" });
      setIsDialogOpen(false);
      setFormData({
        platform: "",
        url: "",
        icon: "",
        order: 0,
        isActive: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(
        `http://localhost:5001/api/site/social/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social"] });
      queryClient.invalidateQueries({ queryKey: ["social"] });
      toast({ title: "Social link updated" });
      setIsDialogOpen(false);
      setEditingLink(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `http://localhost:5001/api/site/social/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social"] });
      queryClient.invalidateQueries({ queryKey: ["social"] });
      toast({ title: "Social link deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Social Links</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingLink(null);
              setFormData({
                platform: "",
                url: "",
                icon: "",
                order: 0,
                isActive: true,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Social Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? "Edit Social Link" : "Add Social Link"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Platform *</Label>
                <Input
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  placeholder="instagram, facebook, twitter, youtube"
                  required
                />
              </div>
              <div>
                <Label>URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Icon (optional)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (editingLink) {
                      updateMutation.mutate({ id: editingLink.id, data: formData });
                    } else {
                      createMutation.mutate(formData);
                    }
                  }}
                >
                  {editingLink ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingLink(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="px-4 py-3 text-left">Platform</th>
              <th className="px-4 py-3 text-left">URL</th>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links?.data?.map((link: any) => (
              <tr key={link.id} className="border-t">
                <td className="px-4 py-3">{link.platform}</td>
                <td className="px-4 py-3">{link.url}</td>
                <td className="px-4 py-3">{link.order}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${link.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {link.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingLink(link);
                        setFormData({
                          platform: link.platform,
                          url: link.url,
                          icon: link.icon || "",
                          order: link.order,
                          isActive: link.isActive,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this social link?")) {
                          deleteMutation.mutate(link.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Homepage Sections Manager (simplified - can be expanded)
const HomepageSectionsManager = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Homepage Sections</h2>
      <p className="text-muted-foreground">
        Manage homepage sections like Best Sellers, Trending, Categories, etc.
      </p>
      <p className="text-sm text-muted-foreground">
        This feature can be expanded to allow reordering and configuring each section.
      </p>
    </div>
  );
};

export default SiteSettings;

