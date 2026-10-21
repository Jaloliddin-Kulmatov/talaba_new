import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Btn, Card, Chips, Empty, ErrorBox, Loading, Row, Screen, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, useTheme } from "@/lib/theme";
import type { Club } from "@/types";

type Tab = "mine" | "club" | "community";

export default function Clubs() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("club");
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get<{ clubs: Club[] }>("/clubs");
    if (r.data) { setClubs(r.data.clubs); setError(null); } else { setError(r.error); setClubs((c) => c ?? []); }
  }, []);
  useEffect(() => { load(); }, [load, user?.id]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (clubs ?? []).filter((c) => {
      if (tab === "mine" ? !(c.my_status === "approved" || c.is_creator) : (c.club_type || "club") !== tab) return false;
      return !needle || c.name.toLowerCase().includes(needle) || (c.description || "").toLowerCase().includes(needle);
    });
  }, [clubs, tab, q]);

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Chips options={[{ id: "club" as Tab, label: "Universitet klublari" }, { id: "community" as Tab, label: "Hamjamiyatlar" }, { id: "mine" as Tab, label: "Meniki" }]} value={tab} onChange={setTab} />
      <TextInput value={q} onChangeText={setQ} placeholder="Klub qidirish" placeholderTextColor={t.subtle} accessibilityLabel="Klub qidirish"
        style={{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: t.text }} />
      <ErrorBox text={error} onRetry={load} />
      {clubs === null ? <Loading /> : shown.length === 0 ? (
        <Empty icon="people-outline" title={tab === "mine" ? "Hali klubga a'zo emassiz" : "Klub topilmadi"}
          text={tab === "mine" ? "“Universitet klublari” bo'limidan o'zingizga mosini toping." : undefined}
          action={tab === "mine" && !user ? <Btn label="Kirish" small onPress={() => router.push("/login")} /> : undefined} />
      ) : shown.map((c) => (
        <Card key={c.id} onPress={() => router.push(`/club/${c.id}`)} accessibilityLabel={c.name}>
          <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="h3">{c.name}</Txt>
              <Txt variant="small" tone="muted" numberOfLines={2}>{c.description || "Tavsif yo'q"}</Txt>
            </View>
            {c.is_creator ? <Badge label="Egasi" tone="violet" /> : c.my_status === "approved" ? <Badge label="A'zo" tone="success" /> : c.my_status === "pending" ? <Badge label="Kutilmoqda" tone="warn" /> : null}
          </Row>
          <Txt variant="caption" tone="subtle" style={{ marginTop: 8 }}>{c.member_count} a'zo{c.university ? ` · ${c.university}` : ""}{c.region ? ` · ${c.region}` : ""}</Txt>
        </Card>
      ))}
    </Screen>
  );
}
