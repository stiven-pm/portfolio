/** Conteos de badges / cola: solo variantes asignadas al usuario (UUID string). */

import { countPendingInProject } from './projectWorkflowProgress';

/** Cotizador: líneas mías sin cotizar (precio > 0) o proyecto en reabrir. */
export function countCotizadorPendingVariants(projects, userId) {
  let n = 0;
  for (const p of projects || []) {
    n += countPendingInProject('cotizador', p, userId);
  }
  return n;
}

/** Diseñador: P2/P3/P4 asignadas a mí, cotizadas y sin diseñar. */
export function countDesignerPendingVariants(projects, userId) {
  let n = 0;
  for (const p of projects || []) {
    n += countPendingInProject('disenador', p, userId);
  }
  return n;
}

/** Desarrollo: asignadas a mí, efectivas, diseñadas, con tiempo elaboración > 0 y sin desarrollar. */
export function countDevelopmentPendingVariants(projects, userId) {
  let n = 0;
  for (const p of projects || []) {
    n += countPendingInProject('desarrollo', p, userId);
  }
  return n;
}
