"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  Calendar, 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Settings,
  GraduationCap
} from "lucide-react";

const navigation = [
  {
    name: "Assistant Chat",
    href: "/dashboard/chat",
    icon: MessageSquare,
    description: "Main chatbot interface"
  },
  {
    name: "My Schedule",
    href: "/dashboard/schedule",
    icon: Calendar,
    description: "View and manage class schedule"
  },
  {
    name: "Note Summarizer",
    href: "/dashboard/notes",
    icon: FileText,
    description: "Upload and summarize notes"
  },
  {
    name: "Study Plan",
    href: "/dashboard/study-plan",
    icon: BookOpen,
    description: "Personalized study timeline"
  },
  {
    name: "Progress Tracker",
    href: "/dashboard/progress",
    icon: TrendingUp,
    description: "Track completed tasks and study hours"
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Profile settings and preferences"
  }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex items-center h-16 px-6 border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Budi
          </span>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className={cn(
                      "text-xs opacity-70",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
} 