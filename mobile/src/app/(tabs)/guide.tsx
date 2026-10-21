import React, { useCallback, useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Badge, Btn, Card, Empty, ErrorBox, Ico, Loading, Row, Screen, Segmented, SectionTitle, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { timeAgo } from "@/lib/time";
import { GUIDE_TOPICS } from "@/data/uz";
import { apps, budget, essentials, seasons, tips, transport } from "@/data/dailyLife";
import type { NewsItem } from "@/types";

type Tab = "guides" | "life" | "news";
const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));

export default function Guide() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("guides");
  return (
    <Screen>
      <Segmented options={[{ id: "guides" as Tab, label: "Qo'llanmalar" }, { id: "life" as Tab, label: "Kundalik hayot" }, { id: "news" as Tab, label: "Yangiliklar" }]} value={tab} onChange={setTab} />
      {tab === "guides" && (
        <>
          <Card onPress={() => router.push("/ai")} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ico name="sparkles" tone="primary" size={26} />
            <View style={{ flex: 1 }}><Txt variant="h3">AI yordamchiga so'rang</Txt><Txt variant="small" tone="muted">Qabul, stipendiya, turargoh haqida darhol javob.</Txt></View>
            <Ico name="chevron-forward" size={18} />
          </Card>
          {GUIDE_TOPICS.map((g) => (
            <Card key={g.id} onPress={() => open(`${SITE_URL}/support/${g.id}`)} accessibilityLabel={g.title}>
              <Row style={{ justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}><Txt variant="h3">{g.title}</Txt><Txt variant="small" tone="muted">{g.description}</Txt></View>
                <Ico name="open-outline" size={18} />
              </Row>
            </Card>
          ))}
          <Btn label="Ko'p so'raladigan savollar" kind="soft" onPress={() => open(`${SITE_URL}/support/faq`)} />
        </>
      )}
      {tab === "life" && <Life />}
      {tab === "news" && <News />}
    </Screen>
  );
}

function Life() {
  const group = (title: string, items: { emoji?: string; icon?: string; title?: string; name?: string; body?: string; note?: string; link?: string }[]) => (
    <>
      <SectionTitle>{title}</SectionTitle>
      {items.map((it, i) => {
        const name = it.title || it.name || "";
        const text = it.body || it.note || "";
        return (
          <Card key={i} onPress={it.link ? () => open(it.link!) : undefined}>
            <Row gap={10} style={{ alignItems: "flex-start" }}>
              <Txt variant="h2">{it.emoji || it.icon}</Txt>
              <View style={{ flex: 1 }}><Txt variant="h3">{name}</Txt><Txt variant="small" tone="muted">{text}</Txt></View>
            </Row>
          </Card>
        );
      })}
    </>
  );
  return (
    <>
      {group("Transport", transport)}
      {group("Kundalik ehtiyojlar", essentials)}
      {group("Zarur ilovalar", apps)}
      <SectionTitle>Oylik byudjet (taxminiy)</SectionTitle>
      <Card style={{ gap: 8 }}>
        {budget.map((b) => (
          <Row key={b.item} style={{ justifyContent: "space-between" }}><Txt variant="small" style={{ flex: 1 }}>{b.item}</Txt><Txt variant="small" tone="success" style={{ fontWeight: "700" }}>{b.range}</Txt></Row>
        ))}
      </Card>
      <SectionTitle>Fasllar</SectionTitle>
      {seasons.map((s) => (
        <Card key={s.s}><Txt variant="h3">{s.emoji} {s.s} · {s.m} · {s.t}</Txt><Txt variant="small" tone="muted">{s.tip}</Txt></Card>
      ))}
      <SectionTitle>Tezkor maslahatlar</SectionTitle>
      {tips.map((c) => <Card key={c.tip}><Txt variant="small">{c.emoji} {c.tip}</Txt></Card>)}
    </>
  );
}

function News() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api.get<{ items: NewsItem[] }>("/news?limit=50");
    if (r.data) { setItems(r.data.items); setError(null); } else { setError(r.error); setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <>
      <ErrorBox text={error} onRetry={load} />
      {items === null ? <Loading /> : items.length === 0 ? <Empty icon="newspaper-outline" title="Hozircha yangiliklar yo'q" text="Yangi xabarlar paydo bo'lganda shu yerda ko'rasiz." /> : items.map((n) => (
        <Card key={n.id} onPress={n.url ? () => open(n.url) : undefined}>
          <Row style={{ marginBottom: 4 }} gap={6}>{n.source ? <Badge label={n.source} tone="success" /> : null}<Txt variant="caption" tone="subtle">{timeAgo(n.published_at)}</Txt></Row>
          <Txt variant="h3">{n.title}</Txt>
          {n.summary ? <Txt variant="small" tone="muted" style={{ marginTop: 2 }}>{n.summary}</Txt> : null}
          {n.url ? <Txt variant="small" tone="primary" style={{ marginTop: 6, fontWeight: "700" }}>Manbada o'qish</Txt> : null}
        </Card>
      ))}
    </>
  );
}
