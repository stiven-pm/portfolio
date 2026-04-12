/** Invalida conteos del rail (useNavBadges) tras asignar, cotizar, hilos, etc. */
export function invalidateNavSidebarBadges(queryClient) {
  if (!queryClient) return;
  queryClient.invalidateQueries({ queryKey: ['nav-sidebar-workflow'] });
  queryClient.invalidateQueries({ queryKey: ['nav-sidebar-assignment'] });
  queryClient.invalidateQueries({ queryKey: ['nav-sidebar-comercial'] });
}
