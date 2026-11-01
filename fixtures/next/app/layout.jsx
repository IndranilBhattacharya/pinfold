import '@pinfold/css/core.css';
import '@pinfold/css/accordion.css';
import { PinfoldProvider } from '@pinfold/react';
import config from '../pinfold.config';

export const metadata = { title: 'Pinfold fixture' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PinfoldProvider config={config}>{children}</PinfoldProvider>
      </body>
    </html>
  );
}
