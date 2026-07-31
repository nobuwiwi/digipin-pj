import { LayoutDashboard, Trophy, Image, Settings } from "lucide-react";

export type TabKey = "dashboard" | "competitions" | "evidence" | "settings";

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  dashboardBadge?: number;
}

const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { key: "competitions", label: "コンペ", icon: Trophy },
  { key: "evidence", label: "証拠画像", icon: Image },
  { key: "settings", label: "設定", icon: Settings },
];

export function BottomNav({ activeTab, onTabChange, dashboardBadge = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-forest-100 shadow-lg safe-bottom z-40">
      <div className="max-w-lg mx-auto flex items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === "dashboard" && dashboardBadge > 0;
          return (
            <button type="button"
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all duration-200 ${
                isActive
                  ? "text-forest-600"
                  : "text-gray-400 hover:text-forest-500"
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? "bg-forest-50" : ""
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-scale-in">
                    {dashboardBadge > 99 ? "99+" : dashboardBadge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "font-bold" : ""
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
