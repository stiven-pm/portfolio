/** Clave estable por fila de proyecto (evita colisiones cuando id = product_variant_id repetido). */
export function variantRowKey(v) {
  if (v?.variantQuoteId != null) return String(v.variantQuoteId);
  return String(v?.id ?? '');
}

export function isRowQuoted(v) {
  return v?.price != null && v.price > 0;
}

export function projectFullyQuoted(project) {
  if (!project || project.reopen) return false;
  const lines = project.variants || [];
  if (lines.length === 0) return false;
  return lines.every(isRowQuoted);
}

export function typologyRequiresDesign(type) {
  const t = String(type || '').trim().toLowerCase();
  return t === 'p2' || t === 'p3' || t === 'p4';
}

/** Solo líneas con tiempo de elaboración > 0 cuentan para “debe pasar por desarrollo”. */
export function lineNeedsDevelopmentStage(v) {
  const t = v?.elaborationTime;
  return t != null && Number(t) > 0;
}

export function projectFullyDesigned(project) {
  const lines = project?.variants || [];
  if (lines.length === 0) return false;
  return lines.every(
    (v) => !typologyRequiresDesign(v.type) || !v.quotedAt || v.designedAt
  );
}

export function projectFullyDeveloped(project) {
  const lines = project?.variants || [];
  if (lines.length === 0) return false;
  const scope = lines.filter((v) => v.effective && v.designedAt && lineNeedsDevelopmentStage(v));
  if (scope.length === 0) return true;
  return scope.every((v) => v.developedAt);
}

function sameId(a, b) {
  return String(a || '') === String(b || '');
}

/**
 * Pendientes en un proyecto para el rol (solo líneas asignadas al usuario cuando userId está definido).
 */
export function countPendingInProject(role, project, userId) {
  const lines = project?.variants || [];
  const uid = userId != null ? String(userId) : null;
  let n = 0;
  if (role === 'cotizador') {
    const reopen = !!project?.reopen;
    for (const v of lines) {
      if (uid && !sameId(v.assignedQuoterId, uid)) continue;
      if (!isRowQuoted(v) || reopen) n += 1;
    }
    return n;
  }
  if (role === 'disenador') {
    for (const v of lines) {
      if (uid && !sameId(v.assignedDesignerId, uid)) continue;
      if (!typologyRequiresDesign(v.type)) continue;
      if (v.quotedAt && !v.designedAt) n += 1;
    }
    return n;
  }
  if (role === 'desarrollo') {
    for (const v of lines) {
      if (uid && !sameId(v.assignedDevelopmentUserId, uid)) continue;
      if (!v.effective || !v.designedAt || !lineNeedsDevelopmentStage(v)) continue;
      if (!v.developedAt) n += 1;
    }
    return n;
  }
  return 0;
}

/** Pendientes de asignación (líder): falta cotizador/diseñador/desarrollo según rol. */
export function countAssignmentPendingInProject(role, project) {
  const lines = project?.variants || [];
  let n = 0;
  if (role === 'cotizador') {
    for (const v of lines) {
      if (!v.assignedQuoterId) n += 1;
    }
    return n;
  }
  if (role === 'disenador') {
    for (const v of lines) {
      if (!typologyRequiresDesign(v.type)) continue;
      if (!v.quotedAt) continue;
      if (!v.assignedDesignerId) n += 1;
    }
    return n;
  }
  if (role === 'desarrollo') {
    for (const v of lines) {
      if (!v.effective || !v.designedAt || !lineNeedsDevelopmentStage(v)) continue;
      if (!v.assignedDevelopmentUserId) n += 1;
    }
    return n;
  }
  return 0;
}

/** Progreso de asignación en vista líder: asignados / total de líneas en alcance. */
export function projectAssignmentProgressLabel(role, project) {
  const lines = project?.variants || [];
  if (!lines.length) return null;
  if (role === 'cotizador') {
    const total = lines.length;
    const done = lines.filter((v) => v.assignedQuoterId).length;
    return `${done}/${total}`;
  }
  if (role === 'disenador') {
    const scope = lines.filter((v) => typologyRequiresDesign(v.type) && v.quotedAt);
    if (scope.length === 0) return null;
    const done = scope.filter((v) => v.assignedDesignerId).length;
    return `${done}/${scope.length}`;
  }
  if (role === 'desarrollo') {
    const scope = lines.filter((v) => v.effective && v.designedAt && lineNeedsDevelopmentStage(v));
    if (scope.length === 0) return null;
    const done = scope.filter((v) => v.assignedDevelopmentUserId).length;
    return `${done}/${scope.length}`;
  }
  return null;
}

/** Conteos para badge en sidebar: hecho / total del proyecto (no solo “mis” filas). */
export function projectProgressLabel(role, project) {
  const lines = project?.variants || [];
  if (!lines.length) return null;
  if (role === 'cotizador') {
    const total = lines.length;
    const done = lines.filter(isRowQuoted).length;
    return `${done}/${total}`;
  }
  if (role === 'disenador') {
    const scope = lines.filter((v) => typologyRequiresDesign(v.type) && v.quotedAt);
    if (scope.length === 0) return null;
    const done = scope.filter((v) => v.designedAt).length;
    return `${done}/${scope.length}`;
  }
  if (role === 'desarrollo') {
    const scope = lines.filter((v) => v.effective && v.designedAt && lineNeedsDevelopmentStage(v));
    if (scope.length === 0) return null;
    const done = scope.filter((v) => v.developedAt).length;
    return `${done}/${scope.length}`;
  }
  return null;
}
