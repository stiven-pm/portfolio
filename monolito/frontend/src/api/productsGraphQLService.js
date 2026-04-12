import { productsGraphQL } from './graphqlClient';
import {
  QUERY_PRODUCTS,
  QUERY_PRODUCT_CATEGORIES,
  QUERY_PRODUCT_SUBCATEGORIES,
  QUERY_PRODUCT_LINES,
  QUERY_VARIABLE_DEFINITIONS,
  MUTATION_CREATE_BASE,
  MUTATION_UPDATE_BASE,
  MUTATION_DELETE_BASE,
  MUTATION_CREATE_VARIANT,
  MUTATION_UPDATE_VARIANT,
  MUTATION_DELETE_VARIANT,
  MUTATION_UPDATE_CATEGORY,
  MUTATION_UPDATE_SUBCATEGORY,
  MUTATION_UPDATE_PRODUCT_LINE,
  MUTATION_UPDATE_VARIABLE_DEFINITION,
  MUTATION_ENSURE_PRODUCT_CATEGORY,
  MUTATION_ENSURE_PRODUCT_SUBCATEGORY,
  MUTATION_ENSURE_PRODUCT_LINE,
} from './productsQueries';

export const createProductsService = (getToken) => ({
  getProducts: () =>
    productsGraphQL(QUERY_PRODUCTS, {}, getToken).then((d) => d?.products ?? []),

  getProductCategories: () =>
    productsGraphQL(QUERY_PRODUCT_CATEGORIES, {}, getToken).then((d) => d?.productCategories ?? []),

  getProductSubcategories: (categoryId) =>
    productsGraphQL(QUERY_PRODUCT_SUBCATEGORIES, { categoryId }, getToken).then(
      (d) => d?.productSubcategories ?? []
    ),

  getProductLines: (subcategoryId) =>
    productsGraphQL(QUERY_PRODUCT_LINES, { subcategoryId }, getToken).then((d) => d?.productLines ?? []),

  getVariableDefinitions: () =>
    productsGraphQL(QUERY_VARIABLE_DEFINITIONS, {}, getToken).then((d) => d?.variableDefinitions ?? []),

  createBase: (input) =>
    productsGraphQL(MUTATION_CREATE_BASE, { input }, getToken).then(
      (d) => d?.createBase
    ),

  updateBase: (input) =>
    productsGraphQL(MUTATION_UPDATE_BASE, { input }, getToken).then(
      (d) => d?.updateBase
    ),

  deleteBase: (baseId) =>
    productsGraphQL(MUTATION_DELETE_BASE, { baseId }, getToken),

  addVariantToBase: (input) =>
    productsGraphQL(MUTATION_CREATE_VARIANT, { input }, getToken).then(
      (d) => d?.createVariant
    ),

  updateVariant: (input) =>
    productsGraphQL(MUTATION_UPDATE_VARIANT, { input }, getToken).then(
      (d) => d?.updateVariant
    ),

  deleteVariant: (variantId) =>
    productsGraphQL(MUTATION_DELETE_VARIANT, { variantId }, getToken),

  updateCategory: (id, name) =>
    productsGraphQL(MUTATION_UPDATE_CATEGORY, { id, name }, getToken).then((d) => d?.updateCategory),

  updateSubcategory: (id, name) =>
    productsGraphQL(MUTATION_UPDATE_SUBCATEGORY, { id, name }, getToken).then((d) => d?.updateSubcategory),

  updateProductLine: (id, name) =>
    productsGraphQL(MUTATION_UPDATE_PRODUCT_LINE, { id, name }, getToken).then((d) => d?.updateProductLine),

  updateVariableDefinition: (id, name) =>
    productsGraphQL(MUTATION_UPDATE_VARIABLE_DEFINITION, { id, name }, getToken).then(
      (d) => d?.updateVariableDefinition
    ),

  ensureProductCategory: (name) =>
    productsGraphQL(MUTATION_ENSURE_PRODUCT_CATEGORY, { name }, getToken).then((d) => d?.ensureProductCategory),

  ensureProductSubcategory: (categoryId, name) =>
    productsGraphQL(MUTATION_ENSURE_PRODUCT_SUBCATEGORY, { categoryId, name }, getToken).then(
      (d) => d?.ensureProductSubcategory
    ),

  ensureProductLine: (subcategoryId, name) =>
    productsGraphQL(MUTATION_ENSURE_PRODUCT_LINE, { subcategoryId, name }, getToken).then(
      (d) => d?.ensureProductLine
    ),
});
