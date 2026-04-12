import { toUpperFormValue } from './formText';

export const emptyVariable = () => ({
  variableId: null,
  variableDefinitionId: null,
  variableName: '',
  variableValue: '',
  locked: false,
  /** Solo valores existentes en catálogo (lista) */
  listOnly: false,
});

/** Convierte variables del formulario al input GraphQL (nombres legacy component* en API). */
export function variablesToGraphqlComponents(variables) {
  return (variables || [])
    .filter(
      (x) =>
        x?.variableName?.trim() ||
        x?.variableValue?.trim() ||
        x?.variableId ||
        x?.variableDefinitionId
    )
    .map((v) => ({
      componentId: v.variableId || null,
      variableDefinitionId: v.variableDefinitionId || null,
      componentName: v.variableName?.trim() || null,
      componentSapRef: null,
      componentSapCode: null,
      componentValue: v.variableValue != null ? toUpperFormValue(String(v.variableValue)) : null,
      componentEditable: v.locked !== true,
      componentListOnly: v.listOnly === true,
    }));
}

export function graphqlComponentsToVariables(components) {
  return (components || []).map((c) => ({
    variableId: c.id ?? c.variableId ?? c.componentId ?? null,
    variableDefinitionId: c.variableDefinitionId ?? null,
    variableName: c.variableName ?? c.name ?? c.componentName ?? '',
    variableValue: c.variableValue ?? c.value ?? c.componentValue ?? '',
    locked: c.locked ?? c.editable === false,
    listOnly: c.listOnly ?? c.componentListOnly === true,
  }));
}
