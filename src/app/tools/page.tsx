import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import ToolsHub from "@/components/tools/tools-hub";
import { TOOLS } from "@/lib/toolkit/tools";

export const metadata: Metadata = {
  title: "Talaba asboblari — jadval, GPA, vazifalar, fokus, davomat",
  description:
    "O'zbek talabalari uchun bepul asboblar: dars jadvali, GPA kalkulyator, vazifa va imtihon rejalashtiruvchi, fokus taymer va davomat nazorati. Ro'yxatdan o'tish shart emas.",
  alternates: { canonical: "https://talaba.uz/tools" },
};

// Structured data: each tool is a free, Uzbek-language web application.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Talaba asboblari",
  itemListElement: TOOLS.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "WebApplication",
      name: t.title,
      description: t.blurb,
      url: `https://talaba.uz${t.href}`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      inLanguage: "uz",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "UZS" },
    },
  })),
};

export default function Page() {
  return (
    <ToolsShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ToolsHub />
    </ToolsShell>
  );
}
