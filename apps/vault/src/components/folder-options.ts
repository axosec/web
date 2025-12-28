import {
  Folder, Home, Wrench, Briefcase, Heart, Shield, FileText,
  Zap, Star, GraduationCap, Cloud, Camera, Code, CreditCard, Globe, type LucideIcon
} from "lucide-react";

export const FOLDER_COLORS = [
  { id: "default", text: "text-foreground", bg: "bg-slate-200" },
  { id: "red", text: "text-red-500", bg: "bg-red-500" },
  { id: "blue", text: "text-blue-500", bg: "bg-blue-500" },
  { id: "green", text: "text-emerald-500", bg: "bg-emerald-500" },
  { id: "amber", text: "text-amber-500", bg: "bg-amber-500" },
  { id: "purple", text: "text-purple-500", bg: "bg-purple-500" },
  { id: "pink", text: "text-pink-500", bg: "bg-pink-500" },
  { id: "cyan", text: "text-cyan-500", bg: "bg-cyan-500" },
  { id: "teal", text: "text-teal-500", bg: "bg-teal-500" },
  { id: "indigo", text: "text-indigo-500", bg: "bg-indigo-500" },
];

export const FOLDER_ICONS: { id: string, icon: LucideIcon }[] = [
  { id: "default", icon: Folder },
  { id: "home", icon: Home },
  { id: "work", icon: Briefcase },
  { id: "docs", icon: FileText },
  { id: "settings", icon: Wrench },
  { id: "personal", icon: Heart },
  { id: "secure", icon: Shield },
  { id: "idea", icon: Zap },
  { id: "star", icon: Star },
  { id: "school", icon: GraduationCap },
  { id: "cloud", icon: Cloud },
  { id: "camera", icon: Camera },
  { id: "dev", icon: Code },
  { id: "finance", icon: CreditCard },
  { id: "web", icon: Globe },
];

export interface FolderMetadata {
  name: string;
  icon: string;
  color: string;
}