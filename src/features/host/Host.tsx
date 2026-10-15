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
  const { presenting, page, sessions, room } = controller;
  return (
    <HostContext.Provider value={controller}>
      <div className={`app-shell ${presenting ? "presentation-shell" : ""}`}>
        {!presenting && <Sidebar />}
        <div className="app-main">
          <TopBar />
          <StatusBanners />
          {(page === "studio" && sessions.length > 0) || presenting ? (
            <StudioPage />
          ) : page === "results" ? (
            <ResultsPage room={room} />
          ) : (
            <LibraryPage />
          )}
          <AppFooter />
        </div>
        <HostModals />
      </div>
    </HostContext.Provider>
  );
}
