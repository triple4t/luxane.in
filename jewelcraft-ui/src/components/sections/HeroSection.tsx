import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const HeroSection = () => {
  const { data: heroData } = useQuery({
    queryKey: ["hero"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/site/hero");
      return response.json();
    },
  });

  const hero = heroData?.data;

  // Fallback to default if no hero data
  const title = hero?.title || "Unleash Your\nCreative Universe";
  const subtitle = hero?.subtitle || "Creative Universe Collection";
  const description = hero?.description || "Explore our unique collection of handcrafted jewelry, where every piece is a work of art designed to inspire your creative spirit.";
  const image = hero?.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop";
  const button1Text = hero?.button1Text || "Explore Collection";
  const button1Link = hero?.button1Link || "/shop";
  const button2Text = hero?.button2Text || "New Arrivals";
  const button2Link = hero?.button2Link || "/shop?new=true";

  return (
    <section className="relative h-[70vh] sm:h-[80vh] lg:h-[90vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/50 via-foreground/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container h-full flex items-center">
        <div className="max-w-xl animate-fade-in">
          {subtitle && (
            <p className="text-card/80 text-sm tracking-[0.3em] uppercase mb-4">
              {subtitle}
            </p>
          )}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-card font-medium leading-tight mb-6 whitespace-pre-line">
            {title}
          </h1>
          {description && (
            <p className="text-card/80 text-base sm:text-lg mb-8 max-w-md">
              {description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            {button1Text && (
              <Button
                asChild
                size="lg"
                className="bg-card text-foreground hover:bg-card/90 px-8"
              >
                <Link to={button1Link}>
                  {button1Text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {button2Text && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-card/80 text-card bg-card/10 hover:bg-card hover:text-foreground px-8"
              >
                <Link to={button2Link}>{button2Text}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-card/60 text-xs tracking-wider">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-card/60 to-transparent" />
      </div>
    </section>
  );
};
