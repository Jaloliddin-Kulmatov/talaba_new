import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import LifeTabs from "@/components/layout/life-tabs";
import NewsApp from "@/components/news/news-app";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LifeTabs active="news" />
      <main className="pb-24 md:pb-0">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <NewsApp />
        </div>
      </main>
      <Footer />
    </div>
  );
}
