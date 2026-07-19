import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import ProtectedRoute from './components/ProtectedRoute';
import RequireGroup from './components/RequireGroup';
import Login from './pages/Login';
import Register from './pages/Register';
import Group from './pages/Group';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import Polls from './pages/Polls';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GroupProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/group"
                element={
                  <ProtectedRoute>
                    <Group />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/polls"
                element={
                  <ProtectedRoute>
                    <RequireGroup>
                      <Polls />
                    </RequireGroup>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RequireGroup>
                      <Calendar />
                    </RequireGroup>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </GroupProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
