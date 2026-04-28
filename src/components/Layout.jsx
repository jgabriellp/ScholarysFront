import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  UserCog,
  GraduationCap,
  GitMerge,
  ClipboardList,
  Star,
  Baby,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: null },
  { section: 'Gestão' },
  { to: '/anoletivo', label: 'Ano Letivo', icon: Calendar, roles: [ROLES.Admin] },
  { to: '/turmas', label: 'Turmas', icon: Users, roles: [ROLES.Admin, ROLES.Diretor, ROLES.Coordenador] },
  { to: '/disciplinas', label: 'Disciplinas', icon: BookOpen, roles: null },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, roles: [ROLES.Admin] },
  { to: '/alunos', label: 'Alunos', icon: GraduationCap, roles: [ROLES.Admin, ROLES.Diretor, ROLES.Coordenador, ROLES.Professor] },
  { to: '/vinculos', label: 'Vínculos', icon: GitMerge, roles: [ROLES.Admin, ROLES.Diretor, ROLES.Coordenador] },
  { section: 'Acadêmico' },
  { to: '/frequencia', label: 'Frequência', icon: ClipboardList, roles: [ROLES.Admin, ROLES.Professor, ROLES.Diretor, ROLES.Coordenador] },
  { to: '/notas', label: 'Notas', icon: Star, roles: [ROLES.Admin, ROLES.Professor, ROLES.Diretor, ROLES.Coordenador] },
  { to: '/maternal', label: 'Desenvolvimento Maternal', icon: Baby, roles: [ROLES.Admin, ROLES.Professor] },
  { section: 'Relatórios' },
  { to: '/diario', label: 'Diário', icon: FileText, roles: null },
];

export default function Layout() {
  const { user, signOut } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (item.section) return true;
    return item.roles === null || item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-slate-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-white font-bold text-lg leading-tight">Scholarys</h1>
          <p className="text-slate-400 text-xs mt-0.5">Sistema de Gestão Escolar</p>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleItems.map((item, i) => {
            if (item.section) {
              return (
                <p key={i} className="sidebar-section">{item.section}</p>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  'sidebar-link' + (isActive ? ' active' : '')
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.nome?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">{user.nome}</p>
              <p className="text-slate-400 text-xs">{ROLE_LABELS[user.role]}</p>
            </div>
            <button
              onClick={signOut}
              className="text-slate-400 hover:text-white transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
