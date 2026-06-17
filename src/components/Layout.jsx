import { NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  BookOpen,
  UserCog,
  GraduationCap,
  GitMerge,
  ClipboardList,
  Star,
  Baby,
  NotebookPen,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import { getTurmasByProfessor } from '../api/turmas';

const gestao = [ROLES.Admin, ROLES.Diretor, ROLES.Coordenador];
const academico = [ROLES.Admin, ROLES.Diretor, ROLES.Coordenador, ROLES.Professor];

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: academico },
  { section: 'Gestão' },
  { to: '/anoletivo', label: 'Ano Letivo', icon: Calendar, roles: [ROLES.Admin] },
  { to: '/dias-letivos', label: 'Dias Letivos', icon: CalendarDays, roles: gestao },
  { to: '/turmas', label: 'Turmas', icon: Users, roles: gestao },
  { to: '/disciplinas', label: 'Disciplinas', icon: BookOpen, roles: gestao },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, roles: [ROLES.Admin] },
  { to: '/alunos', label: 'Alunos', icon: GraduationCap, roles: academico },
  { to: '/vinculos', label: 'Vínculos', icon: GitMerge, roles: gestao },
  { section: 'Acadêmico' },
  { to: '/frequencia', label: 'Frequência', icon: ClipboardList, roles: academico },
  { to: '/notas', label: 'Notas', icon: Star, roles: academico, professorSegmento: 'fundamental' },
  { to: '/maternal', label: 'Desenvolvimento Maternal', icon: Baby, roles: [ROLES.Admin, ROLES.Professor], professorSegmento: 'maternal' },
  { to: '/relato-aula', label: 'Relato de Aula', icon: NotebookPen, roles: academico },
  { section: 'Relatórios' },
  { to: '/diario', label: 'Diário', icon: FileText, roles: null },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [segmentos, setSegmentos] = useState({ hasMaternal: true, hasFundamental: true });

  useEffect(() => {
    if (user.role !== ROLES.Professor) return;
    getTurmasByProfessor(user.id)
      .then(({ data }) => {
        const turmas = data.data ?? data;
        setSegmentos({
          hasMaternal: turmas.some((t) => t.segmento === 0),
          hasFundamental: turmas.some((t) => t.segmento === 1),
        });
      })
      .catch(() => {});
  }, []);

  function isItemVisible(item) {
    if (item.roles !== null && !item.roles.includes(user.role)) return false;
    if (item.professorSegmento && user.role === ROLES.Professor) {
      if (item.professorSegmento === 'fundamental') return segmentos.hasFundamental;
      if (item.professorSegmento === 'maternal') return segmentos.hasMaternal;
    }
    return true;
  }

  const visibleItems = navItems.filter((item, i, arr) => {
    if (!item.section) return isItemVisible(item);
    // mostra a seção só se houver ao menos um link visível abaixo dela
    const rest = arr.slice(i + 1);
    const nextSectionIdx = rest.findIndex((x) => x.section);
    const block = nextSectionIdx === -1 ? rest : rest.slice(0, nextSectionIdx);
    return block.some(isItemVisible);
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} bg-slate-800 flex flex-col flex-shrink-0 transition-all duration-300 relative`}
      >
        {/* Botão de recolher */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className={`border-b border-slate-700 overflow-hidden ${collapsed ? 'p-3 flex justify-center' : 'p-5'}`}>
          {collapsed ? (
            <span className="text-white font-bold text-lg">S</span>
          ) : (
            <>
              <h1 className="text-white font-bold text-lg leading-tight">Scholarys</h1>
              <p className="text-slate-400 text-xs mt-0.5">Sistema de Gestão Escolar</p>
            </>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((item, i) => {
            if (item.section) {
              if (collapsed) return null;
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
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  collapsed
                    ? 'sidebar-link-icon' + (isActive ? ' active' : '')
                    : 'sidebar-link' + (isActive ? ' active' : '')
                }
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className={`border-t border-slate-700 ${collapsed ? 'p-3' : 'p-4'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {user.nome?.[0]?.toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="text-slate-400 hover:text-white transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
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
          )}
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
