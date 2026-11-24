import { useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout.jsx';
import MobileDashboardPage from './MobileDashboardPage.jsx';
import MobileWorkspaceFrame from './MobileWorkspaceFrame.jsx';

const MOBILE_QUERY = '(max-width: 760px)';
const mobileDashboardPages = new Set(['dashboard', 'company', 'admin']);

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const update = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export default function ResponsiveWorkspace({ page, setPage, bright, setBright, onLoggedOut, children }) {
  const isMobile = useMobileViewport();
  const pageContent = isMobile && mobileDashboardPages.has(page)
    ? <MobileDashboardPage page={page} setPage={setPage} />
    : children;

  return (
    <div className={`responsive-experience ${isMobile ? 'is-mobile' : 'is-desktop'}`}>
      <AppLayout page={page} setPage={setPage} bright={bright} setBright={setBright} onLoggedOut={onLoggedOut}>
        <MobileWorkspaceFrame
          page={page}
          setPage={setPage}
          isMobile={isMobile}
          bright={bright}
          setBright={setBright}
          onLoggedOut={onLoggedOut}
        >
          {pageContent}
        </MobileWorkspaceFrame>
      </AppLayout>
    </div>
  );
}
