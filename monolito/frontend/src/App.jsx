import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useUser } from './context/UserContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';

const ComercialProductos = lazy(() => import('./pages/comercial/Productos'));
const ComercialProyecto = lazy(() => import('./pages/comercial/Proyecto'));
const ComercialP3 = lazy(() => import('./pages/comercial/P3'));
const ComercialSolicitudes = lazy(() => import('./pages/comercial/Solicitudes'));
const Hilos = lazy(() => import('./pages/shared/Hilos'));
const CotizadorProyectos = lazy(() => import('./pages/cotizador/Proyectos'));
const DisenadorProductos = lazy(() => import('./pages/disenador/Productos'));
const DisenadorCrear = lazy(() => import('./pages/disenador/Crear'));
const DisenadorProyectos = lazy(() => import('./pages/disenador/Proyectos'));
const DisenadorTaxonomia = lazy(() => import('./pages/disenador/Taxonomia'));
const DesarrolloProyectos = lazy(() => import('./pages/desarrollo/Proyectos'));
const AsignacionProyectos = lazy(() => import('./pages/asignacion/Proyectos'));
const AdminProyectos = lazy(() => import('./pages/admin/Proyectos'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));

function PageSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <Center mih={280}>
          <Loader color="brand" type="dots" />
        </Center>
      }
    >
      {children}
    </Suspense>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useUser();

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Loader color="brand" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user, role } = useUser();
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={`/${role}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/comercial"
        element={
          <ProtectedRoute allowedRoles={['comercial']}>
            <DashboardLayout role="comercial" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PageSuspense>
              <ComercialProductos />
            </PageSuspense>
          }
        />
        <Route
          path="proyecto"
          element={
            <PageSuspense>
              <ComercialProyecto />
            </PageSuspense>
          }
        />
        <Route
          path="p3"
          element={
            <PageSuspense>
              <ComercialP3 />
            </PageSuspense>
          }
        />
        <Route
          path="solicitudes"
          element={
            <PageSuspense>
              <ComercialSolicitudes />
            </PageSuspense>
          }
        />
        <Route
          path="hilos"
          element={
            <PageSuspense>
              <Hilos />
            </PageSuspense>
          }
        />
      </Route>

      <Route
        path="/cotizador"
        element={
          <ProtectedRoute allowedRoles={['cotizador']}>
            <DashboardLayout role="cotizador" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PageSuspense>
              <CotizadorProyectos />
            </PageSuspense>
          }
        />
        <Route
          path="hilos"
          element={
            <PageSuspense>
              <Hilos />
            </PageSuspense>
          }
        />
        <Route
          path="asignacion"
          element={
            <PageSuspense>
              <AsignacionProyectos />
            </PageSuspense>
          }
        />
      </Route>

      <Route
        path="/disenador"
        element={
          <ProtectedRoute allowedRoles={['disenador']}>
            <DashboardLayout role="disenador" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PageSuspense>
              <DisenadorProductos />
            </PageSuspense>
          }
        />
        <Route
          path="crear"
          element={
            <PageSuspense>
              <DisenadorCrear />
            </PageSuspense>
          }
        />
        <Route
          path="taxonomia"
          element={
            <PageSuspense>
              <DisenadorTaxonomia />
            </PageSuspense>
          }
        />
        <Route
          path="proyectos"
          element={
            <PageSuspense>
              <DisenadorProyectos />
            </PageSuspense>
          }
        />
        <Route
          path="hilos"
          element={
            <PageSuspense>
              <Hilos />
            </PageSuspense>
          }
        />
        <Route
          path="asignacion"
          element={
            <PageSuspense>
              <AsignacionProyectos />
            </PageSuspense>
          }
        />
      </Route>

      <Route
        path="/desarrollo"
        element={
          <ProtectedRoute allowedRoles={['desarrollo']}>
            <DashboardLayout role="desarrollo" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PageSuspense>
              <DesarrolloProyectos />
            </PageSuspense>
          }
        />
        <Route
          path="hilos"
          element={
            <PageSuspense>
              <Hilos />
            </PageSuspense>
          }
        />
        <Route
          path="asignacion"
          element={
            <PageSuspense>
              <AsignacionProyectos />
            </PageSuspense>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <PageSuspense>
              <AdminProyectos />
            </PageSuspense>
          }
        />
        <Route
          path="usuarios"
          element={
            <PageSuspense>
              <AdminUsuarios />
            </PageSuspense>
          }
        />
      </Route>

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
