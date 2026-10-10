import { CalendarDays, Calculator, FileText, ListChecks, Sprout, Timer, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ToolMeta {
  id: "timetable" | "gpa" | "planner" | "focus" | "attendance" | "skills" | "cv";
  href: string;
  title: string;
  /** one-line pitch shown on cards */
  blurb: string;
  icon: LucideIcon;
  /** gradient for the icon tile */
  gradient: string;
  /** soft tint for chips / backgrounds */
  tint: string;
}

export const TOOLS: ToolMeta[] = [
  {
    id: "timetable",
    href: "/tools/timetable",
    title: "Dars jadvali",
    blurb: "Haftalik jadval, toq/juft hafta, hozirgi va keyingi dars.",
    icon: CalendarDays,
    gradient: "from-blue-500 to-cyan-500",
    tint: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    id: "gpa",
    href: "/tools/gpa",
    title: "GPA kalkulyator",
    blurb: "5 ballik va 4.0 shkala. Maqsadli GPA uchun qanday baho kerakligini hisoblaydi.",
    icon: Calculator,
    gradient: "from-violet-500 to-purple-500",
    tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  {
    id: "planner",
    href: "/tools/planner",
    title: "Vazifa va imtihonlar",
    blurb: "Topshiriq muddatlari va imtihongacha qolgan kunlar sanog'i.",
    icon: ListChecks,
    gradient: "from-amber-500 to-orange-500",
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    id: "focus",
    href: "/tools/focus",
    title: "Fokus taymer",
    blurb: "Pomodoro, kunlik statistika va ketma-ket o'qigan kunlar.",
    icon: Timer,
    gradient: "from-emerald-500 to-teal-500",
    tint: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "attendance",
    href: "/tools/attendance",
    title: "Davomat nazorati",
    blurb: "Qoldirilgan soatlar va imtihonga ruxsat chegarasi.",
    icon: UserCheck,
    gradient: "from-rose-500 to-pink-500",
    tint: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  {
    id: "skills",
    href: "/tools/skills",
    title: "Ko'nikmalar",
    blurb: "IELTS, dasturlash, Excel — daraja, maqsad va har kungi mashq vaqtini kuzating. Mos ishlar topiladi.",
    icon: Sprout,
    gradient: "from-lime-500 to-green-500",
    tint: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
  },
  {
    id: "cv",
    href: "/tools/cv",
    title: "CV yaratuvchi",
    blurb: "O'zbek, ingliz yoki rus tilida tayyor CV — PDF qilib saqlang. Ko'nikmalaringiz avtomatik qo'shiladi.",
    icon: FileText,
    gradient: "from-indigo-500 to-blue-500",
    tint: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
];

export const toolById = (id: ToolMeta["id"]) => TOOLS.find((t) => t.id === id) as ToolMeta;
