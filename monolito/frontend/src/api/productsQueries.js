export const QUERY_PRODUCTS = `
  query Products {
    products {
      id
      name
      categoryId
      subcategoryId
      lineId
      category
      subcategory
      line
      variants {
        id
        sapRef
        sapCode
        image
        model
        variantScope
        variables {
          id
          sapRef
          sapCode
          variableDefinitionId
          name
          value
          originalValue
          catalogOriginalValue
          editable
          listOnly
        }
      }
    }
  }
`;

export const QUERY_PRODUCT_CATEGORIES = `
  query ProductCategories {
    productCategories {
      id
      name
    }
  }
`;

export const QUERY_PRODUCT_SUBCATEGORIES = `
  query ProductSubcategories($categoryId: ID!) {
    productSubcategories(categoryId: $categoryId) {
      id
      categoryId
      name
    }
  }
`;

export const QUERY_PRODUCT_LINES = `
  query ProductLines($subcategoryId: ID!) {
    productLines(subcategoryId: $subcategoryId) {
      id
      subcategoryId
      name
    }
  }
`;

export const QUERY_VARIABLE_DEFINITIONS = `
  query VariableDefinitions {
    variableDefinitions {
      id
      name
    }
  }
`;

export const MUTATION_CREATE_BASE = `
  mutation CreateBase($input: CreateBaseInput!) {
    createBase(input: $input) {
      id
      name
    }
  }
`;

export const MUTATION_UPDATE_BASE = `
  mutation UpdateBase($input: UpdateBaseInput!) {
    updateBase(input: $input) {
      id
      name
    }
  }
`;

export const MUTATION_DELETE_BASE = `
  mutation DeleteBase($baseId: ID!) {
    deleteBase(baseId: $baseId)
  }
`;

export const MUTATION_CREATE_VARIANT = `
  mutation CreateVariant($input: CreateVariantInput!) {
    createVariant(input: $input) {
      id
      sapRef
      sapCode
      image
      model
      variantScope
      variables {
        id
        sapRef
        sapCode
        variableDefinitionId
        name
        value
        originalValue
        catalogOriginalValue
      }
    }
  }
`;

export const MUTATION_UPDATE_VARIANT = `
  mutation UpdateVariant($input: UpdateVariantInput!) {
    updateVariant(input: $input) {
      id
      sapRef
      sapCode
      image
      model
      variantScope
      variables {
        id
        sapRef
        sapCode
        variableDefinitionId
        name
        value
        originalValue
        catalogOriginalValue
      }
    }
  }
`;

export const MUTATION_DELETE_VARIANT = `
  mutation DeleteVariant($variantId: ID!) {
    deleteVariant(variantId: $variantId)
  }
`;

export const MUTATION_UPDATE_CATEGORY = `
  mutation UpdateCategory($id: ID!, $name: String!) {
    updateCategory(id: $id, name: $name) {
      id
      name
    }
  }
`;

export const MUTATION_UPDATE_SUBCATEGORY = `
  mutation UpdateSubcategory($id: ID!, $name: String!) {
    updateSubcategory(id: $id, name: $name) {
      id
      categoryId
      name
    }
  }
`;

export const MUTATION_UPDATE_PRODUCT_LINE = `
  mutation UpdateProductLine($id: ID!, $name: String!) {
    updateProductLine(id: $id, name: $name) {
      id
      subcategoryId
      name
    }
  }
`;

export const MUTATION_UPDATE_VARIABLE_DEFINITION = `
  mutation UpdateVariableDefinition($id: ID!, $name: String!) {
    updateVariableDefinition(id: $id, name: $name) {
      id
      name
    }
  }
`;

export const MUTATION_ENSURE_PRODUCT_CATEGORY = `
  mutation EnsureProductCategory($name: String!) {
    ensureProductCategory(name: $name) {
      id
      name
    }
  }
`;

export const MUTATION_ENSURE_PRODUCT_SUBCATEGORY = `
  mutation EnsureProductSubcategory($categoryId: ID!, $name: String!) {
    ensureProductSubcategory(categoryId: $categoryId, name: $name) {
      id
      categoryId
      name
    }
  }
`;

export const MUTATION_ENSURE_PRODUCT_LINE = `
  mutation EnsureProductLine($subcategoryId: ID!, $name: String!) {
    ensureProductLine(subcategoryId: $subcategoryId, name: $name) {
      id
      subcategoryId
      name
    }
  }
`;
