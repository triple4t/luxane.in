import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  image: string;
  href: string;
  className?: string;
}

export const CategoryCard = ({ title, image, href, className }: CategoryCardProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "group relative block aspect-[3/4] overflow-hidden rounded-sm hover-lift",
        className
      )}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <h3 className="font-serif text-xl sm:text-2xl text-background font-medium">
          {title}
        </h3>
        <span className="text-background/80 text-sm mt-1 block group-hover:underline">
          Shop Now
        </span>
      </div>
    </Link>
  );
};
