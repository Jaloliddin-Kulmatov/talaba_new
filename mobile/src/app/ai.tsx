import React, { useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { Btn, ErrorBox, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { radius, useTheme } from "@/lib/theme";

interface Turn { role: "user" | "assistant"; content: string }
const SUGGESTIONS = ["Grant va kontrakt farqi nima?", "Yotoqxonaga qanday ariza beraman?", "Stipendiya qachon to'lanadi?", "IELTS ga qanday tayyorlanaman?"];

export default function Ai() {
  const t = useTheme();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList<Turn>>(null);

  const ask = async (q: string) => {
    const message = q.trim();
    if (!message || busy) return;
    const history = turns.slice(-10);
    setTurns((cur) => [...cur, { role: "user", content: message }]);
    setText(""); setBusy(true); setError(null);
    const r = await api.post<{ reply: string }>("/ai/chat", { message, history });
    setBusy(false);
    if (!r.data) { setError(r.error); return; }
    setTurns((cur) => [...cur, { role: "assistant", content: r.data!.reply }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={list} data={turns} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={(
          <View style={{ gap: 10, padding: 8 }}>
            <Txt variant="h2">Nimani bilmoqchisiz?</Txt>
            <Txt tone="muted">Talabalik hayoti haqida so'rang: qabul, stipendiya, turargoh, transport, ish.</Txt>
            {SUGGESTIONS.map((s) => <Btn key={s} label={s} kind="soft" onPress={() => ask(s)} />)}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ alignItems: item.role === "user" ? "flex-end" : "flex-start" }}>
            <View style={{ maxWidth: "88%", backgroundColor: item.role === "user" ? t.primary : t.card, borderColor: t.border, borderWidth: item.role === "user" ? 0 : 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 }}>
              <Txt tone={item.role === "user" ? "onPrimary" : "text"} selectable>{item.content}</Txt>
            </View>
          </View>
        )}
      />
      <View style={{ padding: 10, borderTopColor: t.border, borderTopWidth: 1, backgroundColor: t.card, gap: 6 }}>
        <ErrorBox text={error} />
        <Txt variant="caption" tone="subtle">AI xato qilishi mumkin — muhim ma'lumotni rasmiy manbadan tekshiring.</Txt>
        <Row>
          <TextInput value={text} onChangeText={setText} placeholder="Savolingiz…" placeholderTextColor={t.subtle} accessibilityLabel="Savol" maxLength={600} onSubmitEditing={() => ask(text)}
            style={{ flex: 1, backgroundColor: t.input, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: t.text, fontSize: 15 }} />
          <Btn label="Yuborish" small loading={busy} disabled={!text.trim()} onPress={() => ask(text)} />
        </Row>
      </View>
    </KeyboardAvoidingView>
  );
}
