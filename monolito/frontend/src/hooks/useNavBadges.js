import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../context/UserContext';
import { CartContext } from '../context/CartContext';
import {
  countCotizadorPendingVariants,
  countDesignerPendingVariants,
  countDevelopmentPendingVariants,
} from '../utils/countWorkflowNav';
import { useCatalogService } from './useCatalogService';
import { useThreadsService } from './useThreadsService';
import {
  THREAD_TYPE_DESIGN,
  THREAD_TYPE_DEVELOPMENT,
  THREAD_TYPE_QUOTE,
} from '../constants/threadTypes';

function assignedVariantIdsForRole(projects, role, userId) {
  const uid = String(userId || '');
  const s = new Set();
  for (const p of projects || []) {
    for (const v of p.variants || []) {
      const id = v.id != null ? String(v.id) : '';
      if (!id) continue;
      if (role === 'cotizador' && String(v.assignedQuoterId || '') === uid) s.add(id);
      if (role === 'disenador' && String(v.assignedDesignerId || '') === uid) s.add(id);
      if (role === 'desarrollo' && String(v.assignedDevelopmentUserId || '') === uid) s.add(id);
    }
  }
  return s;
}

function countOpenThreadsInLists(threadLists, role, allowedVariantIds) {
  const typeByRole = {
    cotizador: THREAD_TYPE_QUOTE,
    disenador: THREAD_TYPE_DESIGN,
    desarrollo: THREAD_TYPE_DEVELOPMENT,
  };
  const wantType = typeByRole[role];
  let n = 0;
  for (const items of threadLists) {
    for (const t of items || []) {
      if (t.closedAt) continue;
      const vid = t.variantId != null ? String(t.variantId) : '';
      if (allowedVariantIds != null && !allowedVariantIds.has(vid)) continue;
      if (role === 'comercial' || (wantType && t.type === wantType)) n += 1;
    }
  }
  return n;
}

async function openThreadsCountForProjects(threadsApi, projects, role, userId) {
  if (!projects?.length) return 0;
  const allowedVariantIds =
    role === 'comercial' || !userId ? null : assignedVariantIdsForRole(projects, role, userId);
  const lists = await Promise.all(
    projects.map((p) => threadsApi.getThreadsByProject(p.id).catch(() => []))
  );
  return countOpenThreadsInLists(lists, role, allowedVariantIds);
}

function workflowPendingProducts(role, projects, userId) {
  if (role === 'cotizador') return countCotizadorPendingVariants(projects, userId);
  if (role === 'disenador') return countDesignerPendingVariants(projects, userId);
  if (role === 'desarrollo') return countDevelopmentPendingVariants(projects, userId);
  return 0;
}

/** Conteos para badges en Sidebar (carrito, cola de trabajo, hilos abiertos). */
export function useNavBadges() {
  const { user, role } = useUser();
  const cartCtx = useContext(CartContext);
  const catalog = useCatalogService();
  const threadsApi = useThreadsService();

  const cartCount = cartCtx
    ? (cartCtx.userProject?.length || 0) + (cartCtx.customProducts?.length || 0)
    : 0;

  const { data: workflowSidebar = { workflowCount: 0, openThreadsCount: 0 } } = useQuery({
    queryKey: ['nav-sidebar-workflow', role, user?.id],
    enabled: !!user?.id && !!role && ['cotizador', 'disenador', 'desarrollo'].includes(role),
    staleTime: 30_000,
    queryFn: async () => {
      const uid = user.id;
      let projects = [];
      if (role === 'cotizador') projects = await catalog.getProjectsByAssignedQuoter(uid);
      else if (role === 'disenador') projects = await catalog.getProjectsByAssignedDesigner(uid);
      else if (role === 'desarrollo') projects = await catalog.getProjectsByAssignedDevelopment(uid);

      const list = projects || [];
      const workflowCount = workflowPendingProducts(role, list, uid);
      const openThreadsCount = await openThreadsCountForProjects(threadsApi, list, role, uid);
      return { workflowCount, openThreadsCount };
    },
  });

  const { data: assignmentSidebar = { hasItems: false } } = useQuery({
    queryKey: ['nav-sidebar-assignment', role, user?.id, user?.isLeader],
    enabled: !!user?.id && !!role && user?.isLeader === true && ['cotizador', 'disenador', 'desarrollo'].includes(role),
    staleTime: 30_000,
    queryFn: async () => {
      const list = await catalog.getProjectsForAssignment(role).catch(() => []);
      return { hasItems: (list || []).length > 0 };
    },
  });

  const { data: comercialSidebar = { openThreadsCount: 0 } } = useQuery({
    queryKey: ['nav-sidebar-comercial', user?.id],
    enabled: !!user?.id && role === 'comercial',
    staleTime: 30_000,
    queryFn: async () => {
      const projects = await catalog.getProjectsBySales(user.id);
      const openThreadsCount = await openThreadsCountForProjects(
        threadsApi,
        projects || [],
        'comercial',
        null
      );
      return { openThreadsCount };
    },
  });

  const openThreadsCount =
    role === 'comercial'
      ? comercialSidebar.openThreadsCount
      : ['cotizador', 'disenador', 'desarrollo'].includes(role)
        ? workflowSidebar.openThreadsCount
        : 0;

  const workflowCount = workflowSidebar.workflowCount;

  const workflowBadgeTitle =
    role === 'cotizador'
      ? 'Productos pendientes de cotizar'
      : role === 'disenador'
        ? 'Productos pendientes de diseño'
        : role === 'desarrollo'
          ? 'Productos pendientes de desarrollo'
          : 'Pendientes de flujo';

  return {
    cartCount,
    workflowCount,
    openThreadsCount,
    assignmentHasItems: assignmentSidebar.hasItems === true,
    workflowBadgeTitle,
    hilosBadgeTitle: 'Hilos abiertos',
  };
}
