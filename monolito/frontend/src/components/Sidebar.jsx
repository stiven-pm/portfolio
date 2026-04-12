import { NavLink } from 'react-router-dom';
import { Badge } from '@mantine/core';
import { useUser } from '../context/UserContext';
import { SIDEBAR_ICONS } from '../constants/icons';
import { useNavBadges } from '../hooks/useNavBadges';
import './Sidebar.css';

const EMPTY_ROUTES = [];

function sidebarBadgeForPath(path, role, badges) {
  const {
    cartCount,
    workflowCount,
    openThreadsCount,
    assignmentHasItems,
    workflowBadgeTitle,
    hilosBadgeTitle,
  } = badges;
  if (role === 'comercial') {
    if (path === '/comercial/hilos' && openThreadsCount > 0) {
      return { dot: true, title: hilosBadgeTitle };
    }
    if (path === '/comercial/proyecto' && cartCount > 0) {
      return { count: cartCount, title: 'Productos en carrito' };
    }
    return null;
  }
  if (role === 'cotizador') {
    if (path === '/cotizador/hilos' && openThreadsCount > 0) {
      return { dot: true, title: hilosBadgeTitle };
    }
    if (path === '/cotizador/asignacion' && assignmentHasItems) {
      return { dot: true, title: 'Asignación pendiente' };
    }
    if (path === '/cotizador' && workflowCount > 0) {
      return { dot: true, title: workflowBadgeTitle };
    }
    return null;
  }
  if (role === 'disenador') {
    if (path === '/disenador/hilos' && openThreadsCount > 0) {
      return { dot: true, title: hilosBadgeTitle };
    }
    if (path === '/disenador/asignacion' && assignmentHasItems) {
      return { dot: true, title: 'Asignación pendiente' };
    }
    if (path === '/disenador/proyectos' && workflowCount > 0) {
      return { dot: true, title: workflowBadgeTitle };
    }
    return null;
  }
  if (role === 'desarrollo') {
    if (path === '/desarrollo/hilos' && openThreadsCount > 0) {
      return { dot: true, title: hilosBadgeTitle };
    }
    if (path === '/desarrollo/asignacion' && assignmentHasItems) {
      return { dot: true, title: 'Asignación pendiente' };
    }
    if (path === '/desarrollo' && workflowCount > 0) {
      return { dot: true, title: workflowBadgeTitle };
    }
    return null;
  }
  return null;
}

export default function Sidebar({ routes = EMPTY_ROUTES }) {
  const { user, signOut, role } = useUser();
  const navBadges = useNavBadges();

  const iconSrc = (key) => SIDEBAR_ICONS[key] || SIDEBAR_ICONS.PRODUCTOS;

  return (
    <aside className="sidebar sidebar-rail">
      <div className="sidebar-user-block">
        <img src={SIDEBAR_ICONS.toggle} alt="" className="sidebar-user-icon" width={22} height={22} />
        <span className="sidebar-user-name">{user?.name || user?.email || 'Usuario'}</span>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {routes.map((item) => {
          const badge = sidebarBadgeForPath(item.path, role, navBadges);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
            >
              <span className="sidebar-item-icon-wrap">
                <img src={iconSrc(item.icon)} alt="" className="sidebar-item-icon" width={26} height={26} />
                {badge ? (
                  <Badge
                    size="xs"
                    variant="filled"
                    color="red"
                    circle
                    className="sidebar-item-badge"
                    title={badge.title}
                    aria-label={badge.dot ? badge.title : `${badge.count} ${badge.title}`}
                  >
                    {badge.dot ? '' : badge.count > 99 ? '99+' : badge.count}
                  </Badge>
                ) : null}
              </span>
              <span className="sidebar-item-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-item sidebar-logout" onClick={() => signOut()}>
          <img src={SIDEBAR_ICONS.logout} alt="" className="sidebar-item-icon" width={26} height={26} />
          <span className="sidebar-item-label">Salir</span>
        </button>
      </div>
    </aside>
  );
}
