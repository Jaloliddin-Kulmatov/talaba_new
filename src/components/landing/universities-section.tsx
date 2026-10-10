import React from "react";
import Link from "next/link";
import { Users, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UNIVERSITIES } from "@/lib/constants";

export default function UniversitiesSection() {
  const featuredUnis = UNIVERSITIES.filter((u) => u.featured);
  const moreCount = UNIVERSITIES.length - featuredUnis.length;

  return (
    <section className="py-24 px-4 sm:px-6" id="universities">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left content */}
          <div className="lg:w-2/5 lg:sticky lg:top-24">
            <Badge variant="violet" className="mb-4 text-xs px-3 py-1">
              Universitetlar tarmog&apos;i
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              {UNIVERSITIES.length} ta universitet,
              <br />
              <span className="gradient-text">bitta platforma</span>
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              O&apos;zbekistondagi har bir yirik universitetda tasdiqlangan elchilar, rasmiy e&apos;lonlar
              va maxsus talabalar kanallari bilan TALABA hamjamiyat markazi mavjud.
            </p>
            <div className="space-y-3 mb-8">
              {[
                "Tasdiqlangan universitet elchilari",
                "Rasmiy stipendiya xabarnomalari",
                "Favqulodda bildirishnomalar tizimi",
                "Kampusga xos tadbirlar va qo'llanmalar",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/universities"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group"
            >
              Barcha universitetlarni ko&apos;rish
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Right: University grid */}
          <div className="lg:w-3/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {featuredUnis.map((uni) => {
              const hasWebsite = Boolean(uni.website);
              return (
                <a
                  key={uni.id}
                  href={uni.website || "/universities"}
                  target={hasWebsite ? "_blank" : undefined}
                  rel={hasWebsite ? "noopener noreferrer" : undefined}
                  className="group p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-blue-500/30 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5"
                >
                  {/* Color stripe */}
                  <div
                    className="h-1 w-8 rounded-full mb-3 opacity-80"
                    style={{ backgroundColor: uni.color }}
                  />
                  <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-blue-400 transition-colors">
                    {uni.shortName}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 leading-tight line-clamp-2">
                    {uni.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                      <Users size={10} />
                      <span>{uni.students.toLocaleString()} talaba</span>
                    </div>
                    <ExternalLink size={10} className="text-muted-foreground/40 group-hover:text-blue-400 transition-colors" />
                  </div>
                </a>
              );
            })}

            {/* More universities teaser */}
            {moreCount > 0 && (
              <div className="p-4 rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center text-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                  +{moreCount}
                </div>
                <p className="text-xs text-muted-foreground">Yana ko&apos;plab universitetlar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
