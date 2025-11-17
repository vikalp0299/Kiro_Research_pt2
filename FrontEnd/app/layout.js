import '../CSS/globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Class Registration App',
  description: 'Student class registration and management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
