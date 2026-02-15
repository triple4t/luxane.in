import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  title: string;
  description: string;
  href: string;
  className?: string;
}

export const CollectionCard = ({ title, description, href, className }: CollectionCardProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "group block p-6 sm:p-8 bg-card border border-border rounded-sm hover-lift text-center",
        className
      )}
    >
      <h3 className="font-serif text-lg sm:text-xl text-foreground mb-1 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </Link>
  );
};
