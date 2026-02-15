import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const PromoBanner = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-primary-foreground/70 text-sm tracking-[0.2em] uppercase mb-3">
            Limited Time Offer
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-4">
            Up to 40% Off
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Shop our exclusive holiday sale and find the perfect gift for your loved ones.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-8"
          >
            <Link to="/shop?sale=true">
              Shop Sale
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
