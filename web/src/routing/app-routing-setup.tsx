import { Route, Routes, Navigate } from 'react-router';
import { Layout1 } from '@/components/layouts/layout-1';
import { SettingsPage } from '@/pages/settings/page';
import { IntegrationsPage } from '@/pages/integrations/page';

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route element={<Layout1 />}>
        <Route path="/" element={<SettingsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
