CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(512) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES product_categories (id) ON DELETE RESTRICT,
    name VARCHAR(512) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_subcategories_category_name
    ON product_subcategories (category_id, upper(trim(both from name)));

CREATE TABLE IF NOT EXISTS product_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID NOT NULL REFERENCES product_subcategories (id) ON DELETE RESTRICT,
    name VARCHAR(512) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_lines_subcat_name
    ON product_lines (subcategory_id, upper(trim(both from name)));

CREATE TABLE IF NOT EXISTS product_variable_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(512) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_vardef_name
    ON product_variable_definitions (upper(trim(both from name)));

CREATE TABLE IF NOT EXISTS bases (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    image VARCHAR(255),
    model VARCHAR(255),
    creator_name VARCHAR(255),
    creator_id UUID,
    created_at TIMESTAMP,
    editor_name VARCHAR(255),
    editor_id UUID,
    edited_at TIMESTAMP,
    category_id UUID NOT NULL REFERENCES product_categories (id),
    subcategory_id UUID NOT NULL REFERENCES product_subcategories (id),
    line_id UUID NOT NULL REFERENCES product_lines (id)
);

CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY,
    base_id UUID NOT NULL REFERENCES bases (id),
    sap_ref VARCHAR(255),
    sap_code VARCHAR(255),
    status VARCHAR(255),
    image VARCHAR(255),
    model VARCHAR(255),
    variant_scope VARCHAR(32) NOT NULL DEFAULT 'LINE'
);

CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY,
    sap_ref VARCHAR(255),
    sap_code VARCHAR(255),
    value VARCHAR(255),
    original_value VARCHAR(255),
    variant_id UUID NOT NULL REFERENCES variants (id),
    variable_definition_id UUID NOT NULL REFERENCES product_variable_definitions (id),
    editable BOOLEAN NOT NULL DEFAULT true,
    list_only BOOLEAN NOT NULL DEFAULT false
);
