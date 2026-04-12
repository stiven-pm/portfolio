CREATE TABLE IF NOT EXISTS bases (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    image VARCHAR(255),
    model VARCHAR(255),
    category VARCHAR(255),
    subcategory VARCHAR(255),
    line VARCHAR(255),
    creator_name VARCHAR(255),
    creator_id UUID,
    created_at TIMESTAMP,
    editor_name VARCHAR(255),
    editor_id UUID,
    edited_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS variants (
    id UUID PRIMARY KEY,
    base_id UUID REFERENCES bases (id),
    sap_ref VARCHAR(255),
    sap_code VARCHAR(255),
    status VARCHAR(255),
    source_variant_id UUID,
    product_variant_id UUID
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    consecutive VARCHAR(255),
    name VARCHAR(255),
    version INTEGER,
    city VARCHAR(255),
    client VARCHAR(255),
    client_phone VARCHAR(255),
    region VARCHAR(255),
    sales_name VARCHAR(255),
    sales_email VARCHAR(255),
    sales_phone VARCHAR(255),
    sales_signature VARCHAR(255),
    sales_job_title VARCHAR(255),
    sales_id UUID,
    quoter_name VARCHAR(255),
    quoter_email VARCHAR(255),
    quoter_id UUID,
    state INTEGER,
    created_at TIMESTAMP,
    requested_at TIMESTAMPTZ,
    project_designed_at TIMESTAMPTZ,
    modified_at TIMESTAMP,
    quoted BOOLEAN NOT NULL DEFAULT false,
    reopen BOOLEAN NOT NULL DEFAULT false,
    effective BOOLEAN NOT NULL DEFAULT false,
    total_cost INTEGER,
    estimated_time INTEGER
);

CREATE TABLE IF NOT EXISTS typology_standards (
    id UUID PRIMARY KEY,
    tipologia VARCHAR(255) NOT NULL UNIQUE,
    days_cotiz INTEGER NOT NULL,
    days_diseno INTEGER NOT NULL,
    days_desarrollo INTEGER,
    hours_per_week INTEGER
);

CREATE TABLE IF NOT EXISTS processed_events (
    event_id UUID PRIMARY KEY,
    processed_at VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS daily_project_sequences (
    day DATE PRIMARY KEY,
    last_value INTEGER
);

CREATE TABLE IF NOT EXISTS variant_quote (
    id UUID PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES variants (id),
    base_id UUID,
    project_id UUID REFERENCES projects (id),
    quoter_id UUID,
    type VARCHAR(255),
    critical_material VARCHAR(255),
    comments VARCHAR(255),
    image VARCHAR(255),
    elaboration_time INTEGER,
    quantity INTEGER,
    price INTEGER,
    effective BOOLEAN NOT NULL DEFAULT false,
    quoted_at TIMESTAMPTZ,
    designed_at TIMESTAMPTZ,
    developed_at TIMESTAMPTZ,
    designer_id UUID,
    development_user_id UUID,
    assigned_quoter_id UUID,
    assigned_designer_id UUID,
    assigned_development_user_id UUID,
    plan_pdf_key VARCHAR(512),
    CONSTRAINT uk_variant_quote_project_variant UNIQUE (project_id, variant_id)
);

CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY,
    sap_ref VARCHAR(255),
    sap_code VARCHAR(255),
    value VARCHAR(255),
    original_value VARCHAR(255),
    variant_id UUID REFERENCES variants (id)
);

CREATE TABLE IF NOT EXISTS variant_quote_component_overrides (
    id UUID PRIMARY KEY,
    variant_quote_id UUID NOT NULL REFERENCES variant_quote (id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES components (id) ON DELETE CASCADE,
    value VARCHAR(255),
    original_value VARCHAR(255),
    CONSTRAINT uk_vq_component UNIQUE (variant_quote_id, component_id)
);

CREATE INDEX IF NOT EXISTS ix_vq_component_overrides_vq ON variant_quote_component_overrides (variant_quote_id);
CREATE INDEX IF NOT EXISTS ix_vq_component_overrides_component ON variant_quote_component_overrides (component_id);

CREATE TABLE IF NOT EXISTS project_variants (
    project_id UUID NOT NULL REFERENCES projects (id),
    variant_id UUID NOT NULL REFERENCES variants (id),
    PRIMARY KEY (project_id, variant_id)
);
