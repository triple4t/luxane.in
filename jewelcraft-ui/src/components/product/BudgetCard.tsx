import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  title: string;
  href: string;
  className?: string;
}

export const BudgetCard = ({ title, href, className }: BudgetCardProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center justify-center py-8 sm:py-12 px-6 bg-secondary rounded-sm transition-all duration-300 hover:bg-accent hover:shadow-elegant",
        className
      )}
    >
      <span className="font-serif text-lg sm:text-xl text-secondary-foreground group-hover:text-accent-foreground transition-colors">
        {title}
      </span>
    </Link>
  );
};
