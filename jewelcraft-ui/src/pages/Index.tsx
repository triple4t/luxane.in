import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { BestSellersSection } from "@/components/sections/BestSellersSection";
import { TrendingSection } from "@/components/sections/TrendingSection";
import { CategoriesSection } from "@/components/sections/CategoriesSection";
import { BudgetSection } from "@/components/sections/BudgetSection";
import { CollectionsSection } from "@/components/sections/CollectionsSection";
import { PromoBanner } from "@/components/sections/PromoBanner";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <BestSellersSection />
      <CategoriesSection />
      <TrendingSection />
      <BudgetSection />
      <PromoBanner />
      <CollectionsSection />
    </Layout>
  );
};

export default Index;
