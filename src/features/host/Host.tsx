import { ResultsPage } from "../sessions/ResultsPage";
import { HostContext } from "./HostContext";
import { HostModals } from "./HostModals";
import { AppFooter } from "./layout/AppFooter";
import { Sidebar } from "./layout/Sidebar";
import { StatusBanners } from "./layout/StatusBanners";
import { TopBar } from "./layout/TopBar";
import { LibraryPage } from "./library/LibraryPage";
import { StudioPage } from "./studio/StudioPage";
import { useHostController } from "./useHostController";

export function Host() {
  const controller = useHostController();
  const { presenting, fullscreen, page, sessions, room } = controller;
  const slideOnly = presenting && fullscreen.fullscreen;
  return (
    <HostContext.Provider value={controller}>
      <div
        className={`app-shell ${presenting ? "presentation-shell" : ""} ${slideOnly ? "slide-only-shell" : ""}`}
      >
        {!presenting && <Sidebar />}
        <div className="app-main">
          {!slideOnly && <TopBar />}
          {!slideOnly && <StatusBanners />}
          {(page === "studio" && sessions.length > 0) || presenting ? (
            <StudioPage />
          ) : page === "results" ? (
            <ResultsPage room={room} />
          ) : (
            <LibraryPage />
          )}
          {!slideOnly && <AppFooter />}
        </div>
        <HostModals />
      </div>
    </HostContext.Provider>
  );
}
