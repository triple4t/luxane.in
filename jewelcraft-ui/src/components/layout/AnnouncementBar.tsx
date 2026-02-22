import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";

export const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: announcementsData } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/site/announcements`);
      return response.json();
    },
  });

  const announcements = announcementsData?.data || [];

  if (!isVisible || announcements.length === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 relative">
      <div className="container flex items-center justify-center">
        <p className="text-xs sm:text-sm font-medium tracking-wide text-center">
          {announcements[currentIndex]}
        </p>
        <div className="hidden sm:flex absolute left-1/2 transform -translate-x-1/2 gap-1.5 mt-0 bottom-0.5">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1 h-1 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary-foreground" : "bg-primary-foreground/40"
              }`}
              aria-label={`Show announcement ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
        aria-label="Close announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
