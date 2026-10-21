import React from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleProp, StyleSheet, Text, TextInput,
  TextInputProps, TextStyle, View, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { radius, space, useTheme } from "@/lib/theme";
import { initials } from "@/lib/time";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];

/* ── Text ─────────────────────────────────────────── */
type Variant = "title" | "h2" | "h3" | "body" | "small" | "caption";
const sizes: Record<Variant, TextStyle> = {
  title: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  h2: { fontSize: 19, fontWeight: "700", lineHeight: 25 },
  h3: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 11.5, lineHeight: 15 },
};

export function Txt({ variant = "body", tone = "text", style, children, ...rest }: {
  variant?: Variant; tone?: "text" | "muted" | "subtle" | "primary" | "success" | "danger" | "warn" | "onPrimary";
  style?: StyleProp<TextStyle>; children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Text>, "style">) {
  const t = useTheme();
  const color = tone === "onPrimary" ? t.onPrimary : tone === "primary" ? t.primary : t[tone];
  return <Text {...rest} style={[sizes[variant], { color }, style]}>{children}</Text>;
}

/* ── Layout ───────────────────────────────────────── */
export function Screen({ children, refreshing, onRefresh, padded = true, scroll = true, style }: {
  children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void; padded?: boolean; scroll?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: t.bg }, padded && styles.padded, style]}>{children}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[padded && styles.padded, { paddingBottom: 40, gap: space.md }, style]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={t.primary} colors={[t.primary]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, onPress, style, accessibilityLabel }: {
  children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const t = useTheme();
  const base: ViewStyle = { backgroundColor: t.card, borderColor: t.border, borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: radius.lg, padding: space.lg };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

export function Row({ children, style, gap = space.sm }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: string; action?: { label: string; onPress: () => void } }) {
  return (
    <Row style={{ justifyContent: "space-between", marginTop: space.sm }}>
      <Txt variant="h3">{children}</Txt>
      {action && <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8}><Txt variant="small" tone="primary" style={{ fontWeight: "700" }}>{action.label}</Txt></Pressable>}
    </Row>
  );
}

/* ── Controls ─────────────────────────────────────── */
export function Btn({ label, onPress, kind = "primary", icon, loading, disabled, small, style }: {
  label: string; onPress: () => void; kind?: "primary" | "soft" | "ghost" | "danger"; icon?: IconName;
  loading?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = kind === "primary" ? t.primary : kind === "soft" ? t.primarySoft : kind === "danger" ? t.dangerSoft : "transparent";
  const fg = kind === "primary" ? t.onPrimary : kind === "soft" ? t.onPrimarySoft : kind === "danger" ? t.danger : t.primary;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled: !!off, busy: !!loading }} accessibilityLabel={label}
      disabled={off} onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: bg, borderRadius: radius.md, paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 12 : 18,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: off ? 0.55 : pressed ? 0.85 : 1,
          minHeight: small ? 36 : 48 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Ionicons name={icon} size={small ? 15 : 18} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: small ? 13 : 15, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, error, hint, style, ...input }: { label: string; error?: string | null; hint?: string; style?: StyleProp<ViewStyle> } & TextInputProps) {
  const t = useTheme();
  return (
    <View style={[{ gap: 6 }, style]}>
      <Txt variant="small" tone="muted" style={{ fontWeight: "600" }}>{label}</Txt>
      <TextInput
        {...input}
        accessibilityLabel={label}
        placeholderTextColor={t.subtle}
        style={[{
          backgroundColor: t.input, borderColor: error ? t.danger : t.border, borderWidth: 1, borderRadius: radius.md,
          paddingHorizontal: 14, paddingVertical: input.multiline ? 12 : 11, fontSize: 15, color: t.text,
          minHeight: input.multiline ? 96 : 46, textAlignVertical: input.multiline ? "top" : "center",
        }]}
      />
      {error ? <Txt variant="caption" tone="danger">{error}</Txt> : hint ? <Txt variant="caption" tone="subtle">{hint}</Txt> : null}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}
      style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1,
        borderColor: active ? t.primary : t.border, backgroundColor: active ? t.primary : t.card }}>
      <Text style={{ color: active ? t.onPrimary : t.muted, fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {options.map((o) => <Chip key={o.id} label={o.label} active={o.id === value} onPress={() => onChange(o.id)} />)}
    </ScrollView>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: t.border, borderRadius: radius.md, padding: 3 }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} accessibilityRole="tab" accessibilityState={{ selected: on }}
            style={{ flex: 1, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: on ? t.card : "transparent", alignItems: "center" }}>
            <Text style={{ color: on ? t.text : t.muted, fontSize: 13, fontWeight: "700" }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Display ──────────────────────────────────────── */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const t = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: t.primary, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: t.onPrimary, fontWeight: "800", fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

export function Badge({ label, tone = "primary", icon }: { label: string; tone?: "primary" | "success" | "warn" | "danger" | "violet"; icon?: IconName }) {
  const t = useTheme();
  const map = {
    primary: [t.primarySoft, t.onPrimarySoft], success: [t.successSoft, t.success], warn: [t.warnSoft, t.warn],
    danger: [t.dangerSoft, t.danger], violet: [t.violetSoft, t.onViolet],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: "flex-start" }}>
      {icon && <Ionicons name={icon} size={11} color={fg} />}
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function Empty({ icon = "file-tray-outline", title, text, action }: { icon?: IconName; title: string; text?: string; action?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 36, paddingHorizontal: 24, gap: 8 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: t.primarySoft, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={26} color={t.onPrimarySoft} />
      </View>
      <Txt variant="h3" style={{ textAlign: "center" }}>{title}</Txt>
      {text ? <Txt variant="small" tone="muted" style={{ textAlign: "center" }}>{text}</Txt> : null}
      {action}
    </View>
  );
}

export function ErrorBox({ text, onRetry }: { text: string | null; onRetry?: () => void }) {
  const t = useTheme();
  if (!text) return null;
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: t.dangerSoft, borderRadius: radius.md, padding: 12, gap: 8 }}>
      <Txt variant="small" tone="danger" style={{ fontWeight: "600" }}>{text}</Txt>
      {onRetry && <Btn label="Qayta urinish" kind="ghost" small onPress={onRetry} />}
    </View>
  );
}

export function Skeleton({ height = 80 }: { height?: number }) {
  const t = useTheme();
  return <View style={{ height, borderRadius: radius.lg, backgroundColor: t.border, opacity: 0.55 }} />;
}

export function Loading({ rows = 3, height = 84 }: { rows?: number; height?: number }) {
  return <>{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={height} />)}</>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: t.border }} />;
}

export function Ico({ name, size = 20, tone = "muted" }: { name: IconName; size?: number; tone?: "text" | "muted" | "primary" | "success" | "danger" | "subtle" }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={tone === "primary" ? t.primary : t[tone]} />;
}

const styles = StyleSheet.create({ padded: { padding: space.lg } });
