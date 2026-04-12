import { Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ProductsProvider } from '../context/ProductsContext';
import { FiltersProvider } from '../context/FiltersContext';
import { CartProvider } from '../context/CartContext';
import { ProjectProvider } from '../context/ProjectContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './DashboardLayout.css';

/** label = texto bajo icono; icon = clave en SIDEBAR_ICONS */
const RUTAS = {
  comercial: [
    { label: 'Productos', icon: 'PRODUCTOS', path: '/comercial' },
    { label: 'Crear P3', icon: 'CREAR_P3', path: '/comercial/p3' },
    { label: 'Crear proyecto', icon: 'PROYECTO', path: '/comercial/proyecto' },
    { label: 'Solicitudes', icon: 'SOLICITUDES', path: '/comercial/solicitudes' },
    { label: 'Hilos', icon: 'HILOS', path: '/comercial/hilos' },
  ],
  cotizador: [
    { label: 'Proyectos', icon: 'PROYECTOS', path: '/cotizador' },
    { label: 'Hilos', icon: 'HILOS', path: '/cotizador/hilos' },
  ],
  disenador: [
    { label: 'Productos', icon: 'PRODUCTOS', path: '/disenador' },
    { label: 'Crear producto', icon: 'CREAR_PRODUCTO', path: '/disenador/crear' },
    { label: 'Taxonomía', icon: 'TAXONOMIA', path: '/disenador/taxonomia' },
    { label: 'Efectivos', icon: 'EFECTIVOS', path: '/disenador/proyectos' },
    { label: 'Hilos', icon: 'HILOS', path: '/disenador/hilos' },
  ],
  admin: [
    { label: 'Proyectos', icon: 'PROYECTOS', path: '/admin' },
    { label: 'Usuarios', icon: 'USUARIOS', path: '/admin/usuarios' },
  ],
  desarrollo: [
    { label: 'Efectivos', icon: 'EFECTIVOS', path: '/desarrollo' },
    { label: 'Hilos', icon: 'HILOS', path: '/desarrollo/hilos' },
  ],
};

const getRutaAsignacion = (role) => ({
  label: 'Asignar',
  icon: 'ASIGNACION',
  path: `/${role}/asignacion`,
});

function LayoutContent({ role }) {
  const { user } = useUser();
  const baseRoutes = RUTAS[role] || [];
  const isLeader = user?.isLeader === true;
  const showAsignacion = isLeader && ['cotizador', 'disenador', 'desarrollo'].includes(role);
  const routes = showAsignacion ? [...baseRoutes, getRutaAsignacion(role)] : baseRoutes;

  return (
    <div className="dashboard-layout">
      <main>
        <Outlet />
      </main>
      <Sidebar routes={routes} />
    </div>
  );
}

export default function DashboardLayout({ role }) {
  const content = <LayoutContent role={role} />;

  const withProviders =
    role === 'comercial' || role === 'disenador' ? (
      <ProductsProvider>
        <FiltersProvider>
          <CartProvider>
            <ProjectProvider>{content}</ProjectProvider>
          </CartProvider>
        </FiltersProvider>
      </ProductsProvider>
    ) : (
      <ProductsProvider>{content}</ProductsProvider>
    );

  return (
    <>
      <Navbar />
      {withProviders}
    </>
  );
}
