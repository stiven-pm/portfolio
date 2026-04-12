import { useLocation } from 'react-router-dom';
import { Text } from '@mantine/core';
import logo from '../assets/logo.png';
import './Navbar.css';

const PAGE_TITLES = {
  '/comercial': 'Productos',
  '/comercial/proyecto': 'Proyecto',
  '/comercial/p3': 'Crear',
  '/comercial/solicitudes': 'Solicitudes',
  '/comercial/hilos': 'Hilos',
  '/cotizador': 'Proyectos',
  '/cotizador/hilos': 'Hilos',
  '/disenador': 'Productos',
  '/disenador/crear': 'Crear',
  '/disenador/proyectos': 'Efectivos',
  '/disenador/hilos': 'Hilos',
  '/desarrollo': 'Efectivos',
  '/desarrollo/hilos': 'Hilos',
  '/desarrollo/asignacion': 'Asignar',
  '/cotizador/asignacion': 'Asignar',
  '/disenador/asignacion': 'Asignar',
  '/admin': 'Proyectos',
  '/admin/usuarios': 'Usuarios',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Inicio" className="navbar-logo" />
      </div>

      <div className="navbar-center">
        {pageTitle ? (
          <Text component="div" className="navbar-title navbar-title-inner">
            {pageTitle}
          </Text>
        ) : null}
      </div>

      <div className="navbar-rail-spacer" aria-hidden="true" />
    </nav>
  );
}
