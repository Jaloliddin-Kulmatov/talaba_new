import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Card, Ico, Row, Screen, Txt, type IconName } from "@/components/ui";

const TOOLS: { href: string; icon: IconName; title: string; text: string }[] = [
  { href: "/tools/timetable", icon: "calendar-outline", title: "Dars jadvali", text: "Toq/juft hafta bilan, eslatmalar bilan" },
  { href: "/tools/planner", icon: "checkbox-outline", title: "Vazifalar va imtihonlar", text: "Muddatlar va imtihongacha qolgan kunlar" },
  { href: "/tools/gpa", icon: "calculator-outline", title: "GPA kalkulyator", text: "5 ballik va 4.0 shkala" },
];

export default function Tools() {
  const router = useRouter();
  return (
    <Screen>
      <Txt tone="muted">Ma'lumotlaringiz hisobingiz bilan telefon va saytda avtomatik sinxron bo'ladi. Hisobsiz ham ishlaydi — faqat shu telefonda saqlanadi.</Txt>
      {TOOLS.map((t) => (
        <Card key={t.href} onPress={() => router.push(t.href)} accessibilityLabel={t.title}>
          <Row gap={14}>
            <Ico name={t.icon} size={26} tone="primary" />
            <View style={{ flex: 1 }}><Txt variant="h3">{t.title}</Txt><Txt variant="small" tone="muted">{t.text}</Txt></View>
            <Ico name="chevron-forward" size={18} />
          </Row>
        </Card>
      ))}
      <Txt variant="caption" tone="subtle">Fokus taymer, davomat, ko'nikmalar va CV yaratuvchi hozircha saytda: talaba.uz/tools</Txt>
    </Screen>
  );
}
