import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar: only visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 md:pb-6">
          <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation: only visible on mobile */}
      <BottomNav />
    </div>
  );
};
