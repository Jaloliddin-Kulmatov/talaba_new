import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import ReviewsApp from "@/components/community/reviews-app";

export const metadata: Metadata = {
  title: "Fan sharhlari — o'qituvchi va fanlar haqida anonim fikrlar",
  description: "Universitet fanlari va o'qituvchilari haqida talabalarning anonim sharhlari: baho, qiyinlik darajasi va tavsiyalar.",
  alternates: { canonical: "https://talaba.uz/reviews" },
};

export default function Page() {
  return (
    <ToolsShell>
      <ReviewsApp />
    </ToolsShell>
  );
}
