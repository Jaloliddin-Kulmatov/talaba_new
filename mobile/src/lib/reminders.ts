import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { classesOn, parityOf, type TimetableData } from "@shared/toolkit/timetable";
import { dayIndex, toMin } from "@shared/toolkit/time";

/**
 * Local class reminders: schedules a notification `minutesBefore` each class for the next 7 days.
 * Done on the phone (works offline and without a server). Re-run whenever the timetable changes or the app opens.
 */
export async function scheduleClassReminders(data: TimetableData, minutesBefore: number, now: Date = new Date()): Promise<number> {
  if (Platform.OS === "web") return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (minutesBefore <= 0 || data.classes.length === 0) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted") return 0;
  let count = 0;
  for (let i = 0; i < 7 && count < 60; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    for (const c of classesOn(data, dayIndex(day), parityOf(day, data.anchor))) {
      const start = toMin(c.start);
      if (Number.isNaN(start)) continue;
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, start - minutesBefore);
      if (at.getTime() <= now.getTime()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: `${minutesBefore} daqiqadan keyin: ${c.subject}`, body: [c.start, c.room && `${c.room}-xona`].filter(Boolean).join(" · ") },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
      count++;
    }
  }
  return count;
}
