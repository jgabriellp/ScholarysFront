import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import { ROLES } from './utils/constants';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AnoLetivo from './pages/AnoLetivo';
import Turmas from './pages/Turmas';
import Disciplinas from './pages/Disciplinas';
import Usuarios from './pages/Usuarios';
import Alunos from './pages/Alunos';
import Vinculos from './pages/Vinculos';
import Frequencia from './pages/Frequencia';
import Notas from './pages/Notas';
import Maternal from './pages/Maternal';
import Diario from './pages/Diario';

const adminOnly = [ROLES.Admin];
const gestao = [ROLES.Admin, ROLES.Diretor, ROLES.Coordenador];
const academico = [ROLES.Admin, ROLES.Professor, ROLES.Diretor, ROLES.Coordenador];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="anoletivo" element={<PrivateRoute allowedRoles={adminOnly}><AnoLetivo /></PrivateRoute>} />
            <Route path="turmas" element={<PrivateRoute allowedRoles={gestao}><Turmas /></PrivateRoute>} />
            <Route path="disciplinas" element={<Disciplinas />} />
            <Route path="usuarios" element={<PrivateRoute allowedRoles={adminOnly}><Usuarios /></PrivateRoute>} />
            <Route path="alunos" element={<PrivateRoute allowedRoles={[...gestao, ROLES.Professor]}><Alunos /></PrivateRoute>} />
            <Route path="vinculos" element={<PrivateRoute allowedRoles={gestao}><Vinculos /></PrivateRoute>} />
            <Route path="frequencia" element={<PrivateRoute allowedRoles={academico}><Frequencia /></PrivateRoute>} />
            <Route path="notas" element={<PrivateRoute allowedRoles={academico}><Notas /></PrivateRoute>} />
            <Route path="maternal" element={<PrivateRoute allowedRoles={[ROLES.Admin, ROLES.Professor]}><Maternal /></PrivateRoute>} />
            <Route path="diario" element={<Diario />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
