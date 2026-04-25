import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FunnelProvider } from './context/FunnelContext';
import GearBackground from './components/GearBackground';

import Screen1A from './screens/Screen1A';
import Screen4 from './screens/Screen4';
import Screen5 from './screens/Screen5';
import Disqualified from './screens/Disqualified';
import LanguageDisqualified from './screens/LanguageDisqualified';
import AdminPage from './admin/AdminPage';
import AdminResetPassword from './admin/AdminResetPassword';

function FunnelRoutes() {
  const location = useLocation();
  return (
    <>
    <GearBackground />
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Screen1A />} />
        <Route path="/language" element={<Navigate to="/" replace />} />
        <Route path="/duration" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Screen4 />} />
        <Route path="/thankyou" element={<Screen5 />} />
        <Route path="/not-eligible" element={<Disqualified />} />
        <Route path="/language-mismatch" element={<LanguageDisqualified />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (location.pathname === '/admin/reset-password') return <AdminResetPassword />;
  if (isAdmin) return <AdminPage />;

  return (
    <FunnelProvider>
      <FunnelRoutes />
    </FunnelProvider>
  );
}
