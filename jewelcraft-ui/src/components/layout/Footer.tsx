import { Link } from "react-router-dom";
import { useState } from "react";
import { Instagram, Facebook, Twitter, Youtube, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

const iconMap: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
};

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: (email: string) => api.subscribeNewsletter(email),
    onSuccess: (data) => {
      toast({
        title: "Subscribed!",
        description: data.message || "Thank you for subscribing to our newsletter!",
      });
      setNewsletterEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    subscribeMutation.mutate(newsletterEmail);
  };

  const { data: footerSections } = useQuery({
    queryKey: ["footer"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/footer");
      return response.json();
    },
  });

  const { data: socialLinksData } = useQuery({
    queryKey: ["social"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/social");
      return response.json();
    },
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/settings");
      return response.json();
    },
  });

  const siteName = siteSettings?.data?.siteName || "Creative Universe";
  const siteDescription = siteSettings?.data?.siteDescription || "Where creativity meets elegance. Discover unique jewelry pieces that reflect your individual style and imagination.";
  const socialLinks = socialLinksData?.data || [];
  const sections = footerSections?.data || [];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/10">
        <div className="container py-12 sm:py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="font-serif text-2xl sm:text-3xl mb-3">Join Our World</h3>
            <p className="text-primary-foreground/70 mb-6 text-sm">
              Subscribe for exclusive offers, new arrivals, and styling inspiration.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 flex-1"
                required
              />
              <Button
                type="submit"
                disabled={subscribeMutation.isPending}
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-8"
              >
                {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="font-serif text-2xl font-semibold tracking-[0.2em] block mb-4">
              {siteName}
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
              {siteDescription}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social: any) => {
                const Icon = iconMap[social.platform.toLowerCase()];
                if (!Icon) return null;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    aria-label={social.platform}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Dynamic Footer Sections */}
          {sections.map((section: any) => (
            <div key={section.id}>
              <h4 className="font-medium text-sm tracking-wider mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links?.map((link: any, index: number) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-xs">
            © 2026 Creative Universe. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-primary-foreground/50 hover:text-primary-foreground/80 text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary-foreground/50 hover:text-primary-foreground/80 text-xs transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
