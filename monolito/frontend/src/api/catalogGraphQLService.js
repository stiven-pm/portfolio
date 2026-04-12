import { catalogGraphQL } from './graphqlClient';
import {
  QUERY_PROJECTS,
  QUERY_PROJECTS_BY_SALES,
  QUERY_PROJECTS_BY_QUOTER,
  QUERY_PROJECTS_EFFECTIVE,
  QUERY_PROJECTS_FOR_ASSIGNMENT,
  QUERY_PROJECTS_BY_ASSIGNED_QUOTER,
  QUERY_PROJECTS_BY_ASSIGNED_DESIGNER,
  QUERY_PROJECTS_BY_ASSIGNED_DEVELOPMENT,
  MUTATION_CREATE_PROJECT,
  MUTATION_UPDATE_PROJECT,
  MUTATION_REOPEN_PROJECT,
  MUTATION_UPDATE_VARIANT_AND_REOPEN,
  MUTATION_MAKE_PROJECT_EFFECTIVE,
  MUTATION_QUITAR_PROJECT_EFFECTIVE,
  MUTATION_MAKE_VARIANT_QUOTE_EFFECTIVE,
  MUTATION_ASSIGN_VARIANT_TO_USER,
  MUTATION_TOGGLE_P3_P5,
  MUTATION_MARK_VARIANT_AS_DESIGNED,
  MUTATION_MARK_VARIANT_AS_DEVELOPED,
  MUTATION_QUOTE_VARIANT,
  MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY,
  MUTATION_REMOVE_VARIANT_FROM_PROJECT,
  MUTATION_DELETE_PROJECT,
} from './catalogQueries';
import { normalizeProjectsList } from '../utils/variantFieldAlias';

export const createCatalogService = (getToken) => ({
  getProjects: () =>
    catalogGraphQL(QUERY_PROJECTS, {}, getToken).then((d) => normalizeProjectsList(d?.projects ?? [])),

  getProjectsBySales: (salesId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_SALES, { salesId }, getToken).then((d) =>
      normalizeProjectsList(d?.projectsBySales ?? [])
    ),

  getProjectsByQuoter: (quoterId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_QUOTER, { quoterId }, getToken).then((d) =>
      normalizeProjectsList(d?.projectsByQuoter ?? [])
    ),

  getProjectsByAssignedQuoter: (quoterId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_ASSIGNED_QUOTER, { quoterId }, getToken).then((d) =>
      normalizeProjectsList(d?.projectsByAssignedQuoter ?? [])
    ),

  getProjectsByAssignedDesigner: (designerId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_ASSIGNED_DESIGNER, { designerId }, getToken).then((d) =>
      normalizeProjectsList(d?.projectsByAssignedDesigner ?? [])
    ),

  getProjectsByAssignedDevelopment: (userId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_ASSIGNED_DEVELOPMENT, { userId }, getToken).then((d) =>
      normalizeProjectsList(d?.projectsByAssignedDevelopment ?? [])
    ),

  getProjectsForAssignment: (role) =>
    catalogGraphQL(QUERY_PROJECTS_FOR_ASSIGNMENT, { role: role || null }, getToken).then((d) =>
      normalizeProjectsList(d?.projectsForAssignment ?? [])
    ),

  getProjectsEffective: () =>
    catalogGraphQL(QUERY_PROJECTS_EFFECTIVE, {}, getToken).then((d) =>
      normalizeProjectsList(d?.projectsEffective ?? [])
    ),

  createProject: (input) =>
    catalogGraphQL(MUTATION_CREATE_PROJECT, { input }, getToken).then((d) => d?.createProject),

  updateProject: (input) =>
    catalogGraphQL(MUTATION_UPDATE_PROJECT, { input }, getToken).then(
      (d) => d?.updateProject
    ),

  reOpenProject: (projectId) =>
    catalogGraphQL(MUTATION_REOPEN_PROJECT, { projectId }, getToken).then(
      (d) => d?.reOpenProject
    ),

  updateVariantAndReopen: (input) =>
    catalogGraphQL(MUTATION_UPDATE_VARIANT_AND_REOPEN, { input }, getToken).then(
      (d) => d?.updateVariantAndReopen
    ),

  makeProjectEffective: (projectId) =>
    catalogGraphQL(MUTATION_MAKE_PROJECT_EFFECTIVE, { projectId }, getToken).then(
      (d) => d?.makeProjectEffective
    ),

  quitarProjectEffective: (projectId) =>
    catalogGraphQL(MUTATION_QUITAR_PROJECT_EFFECTIVE, { projectId }, getToken).then(
      (d) => d?.quitarProjectEffective
    ),

  assignVariantToUser: (projectId, variantQuoteId, assigneeId, roleType) =>
    catalogGraphQL(MUTATION_ASSIGN_VARIANT_TO_USER, { projectId, variantQuoteId, assigneeId, roleType }, getToken).then(
      (d) => d?.assignVariantToUser
    ),

  makeVariantQuoteEffective: (projectId, variantId, effective, variantQuoteId = null) =>
    catalogGraphQL(MUTATION_MAKE_VARIANT_QUOTE_EFFECTIVE, {
      projectId,
      variantId,
      variantQuoteId,
      effective,
    }, getToken).then((d) => d?.makeVariantQuoteEffective),

  toggleP3P5: (projectId, variantId, variantQuoteId = null) =>
    catalogGraphQL(MUTATION_TOGGLE_P3_P5, { projectId, variantId, variantQuoteId }, getToken).then(
      (d) => d?.toggleP3P5
    ),

  markVariantAsDesigned: (projectId, variantId, designerId, planPdfKey = null, variantQuoteId = null) =>
    catalogGraphQL(MUTATION_MARK_VARIANT_AS_DESIGNED, {
      projectId,
      variantId,
      variantQuoteId,
      designerId,
      planPdfKey,
    }, getToken).then((d) => d?.markVariantAsDesigned),

  markVariantAsDeveloped: (projectId, variantId, developmentUserId, variantQuoteId = null) =>
    catalogGraphQL(MUTATION_MARK_VARIANT_AS_DEVELOPED, {
      projectId,
      variantId,
      variantQuoteId,
      developmentUserId,
    }, getToken).then((d) => d?.markVariantAsDeveloped),

  quoteVariant: (input) =>
    catalogGraphQL(MUTATION_QUOTE_VARIANT, { input }, getToken),

  updateVariantQuoteQuantity: (input) =>
    catalogGraphQL(MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY, { input }, getToken),

  removeVariantFromProject: (projectId, variantId, variantQuoteId = null) =>
    catalogGraphQL(MUTATION_REMOVE_VARIANT_FROM_PROJECT, { projectId, variantId, variantQuoteId }, getToken),

  deleteProject: (projectId) =>
    catalogGraphQL(MUTATION_DELETE_PROJECT, { projectId }, getToken).then((d) => d?.deleteProject),
});
