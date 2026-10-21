import React, { useState } from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Btn, Chips, Ico, Row, Screen, Txt, type IconName } from "@/components/ui";
import { FIELDS, GOALS, LANGUAGE_LEVELS, setPrefs, usePrefs, type Prefs } from "@/lib/prefs";
import { useTheme } from "@/lib/theme";
import { REGIONS } from "@/data/uz";

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: "calendar-outline", title: "Jadval, GPA va vazifalar", text: "Darslar, imtihonlar va baholaringiz bir joyda — hisobingiz bilan telefon va saytda sinxron." },
  { icon: "briefcase-outline", title: "Sizga mos ishlar", text: "Amaliyot va part-time ishlar ko'nikmalaringizga qarab saralanadi." },
  { icon: "people-outline", title: "Klublar va savol-javob", text: "Universitet klublari, talabalar bilan chat va tajriba almashish." },
];

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const { prefs } = usePrefs();
  const [step, setStep] = useState(0);
  if (!prefs) return null;
  const set = (p: Partial<Prefs>) => setPrefs(p);

  const finish = (to: "/register" | "/(tabs)") => {
    setPrefs({ welcomed: true });
    router.replace(to);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Screen style={{ flexGrow: 1 }}>
        <Row style={{ justifyContent: "center", gap: 6, paddingVertical: 8 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? t.primary : t.border }} />
          ))}
        </Row>

        {step === 0 && (
          <View style={{ gap: 18, paddingTop: 12 }}>
            <Txt variant="title">TALABA<Txt variant="title" tone="primary">.</Txt></Txt>
            <Txt variant="h2">O'zbek talabalari uchun bitta ilova</Txt>
            {BENEFITS.map((b) => (
              <Row key={b.title} gap={14} style={{ alignItems: "flex-start" }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <Ico name={b.icon} size={22} tone="primary" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="h3">{b.title}</Txt>
                  <Txt variant="small" tone="muted">{b.text}</Txt>
                </View>
              </Row>
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: 14 }}>
            <Txt variant="h2">Nima izlayapsiz?</Txt>
            <Chips options={GOALS.map((g) => ({ id: g.id, label: g.label }))} value={prefs.goal} onChange={(v) => set({ goal: v })} />
            <Txt variant="h3" style={{ marginTop: 8 }}>Qaysi sohada?</Txt>
            <Chips options={FIELDS.map((f) => ({ id: f.id, label: f.label }))} value={prefs.field} onChange={(v) => set({ field: v })} />
            <Txt variant="caption" tone="subtle">Bu ishlarni siz uchun saralashga yordam beradi. Keyinroq o'zgartirish mumkin.</Txt>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 14 }}>
            <Txt variant="h2">Qayerda va qaysi tilda?</Txt>
            <Txt variant="h3">Shahar / viloyat</Txt>
            <Chips options={REGIONS.map((r) => ({ id: r, label: r }))} value={prefs.city} onChange={(v) => set({ city: v })} />
            <Txt variant="h3" style={{ marginTop: 8 }}>Ingliz tili darajasi</Txt>
            <Chips options={LANGUAGE_LEVELS.map((l) => ({ id: l, label: l }))} value={prefs.languageLevel} onChange={(v) => set({ languageLevel: v })} />
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Txt variant="h3">Yangi ishlar haqida xabar</Txt>
                <Txt variant="caption" tone="subtle">Har kuni soat 10:00 da, faqat yangi ish bo'lsa. Hisob ochgach yoqiladi.</Txt>
              </View>
              <Switch value={prefs.alerts} onValueChange={(v) => set({ alerts: v })} accessibilityLabel="Yangi ishlar haqida xabar" trackColor={{ true: t.primary }} />
            </Row>
          </View>
        )}

        <View style={{ flex: 1 }} />
        <View style={{ gap: 10, paddingTop: 16 }}>
          {step < 2 ? (
            <Btn label={step === 0 ? "Boshlash" : "Davom etish"} icon="arrow-forward" onPress={() => setStep(step + 1)} />
          ) : (
            <>
              <Btn label="Hisob yaratish" onPress={() => finish("/register")} />
              <Btn label="Hozircha mehmon sifatida" kind="ghost" onPress={() => finish("/(tabs)")} />
            </>
          )}
          {step > 0 && <Btn label="Orqaga" kind="ghost" small onPress={() => setStep(step - 1)} />}
          {step < 2 && <Btn label="O'tkazib yuborish" kind="ghost" small onPress={() => finish("/(tabs)")} />}
        </View>
      </Screen>
    </SafeAreaView>
  );
}
