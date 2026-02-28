import { Helmet } from 'react-helmet-async';
import { LayoutProvider } from './components/context';
import { Main } from './components/main';

export function Layout1() {
  return (
    <>
      <Helmet>
        <title>Notesly Dashboard</title>
      </Helmet>

      <LayoutProvider>
        <Main />
      </LayoutProvider>
    </>
  );
}
