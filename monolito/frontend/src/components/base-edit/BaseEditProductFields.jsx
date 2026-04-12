import { Stack, TextInput, Select } from '@mantine/core';

export default function BaseEditProductFields({
  form,
  handleChange,
  categoryOptions,
  subcategoryOptions,
  lineOptions,
  onTaxonomyChange,
}) {
  return (
    <Stack gap="sm" className="base-edit-form">
      <TextInput
        label="Nombre"
        id="base-edit-name"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <Select
        label="Categoría"
        placeholder="Seleccionar"
        data={categoryOptions}
        value={form.categoryId || null}
        onChange={(v) => onTaxonomyChange('categoryId', v)}
        searchable
        clearable
      />
      <Select
        label="Subcategoría"
        placeholder="Seleccionar"
        data={subcategoryOptions}
        value={form.subcategoryId || null}
        onChange={(v) => onTaxonomyChange('subcategoryId', v)}
        searchable
        clearable
      />
      <Select
        label="Línea"
        placeholder="Seleccionar"
        data={lineOptions}
        value={form.lineId || null}
        onChange={(v) => onTaxonomyChange('lineId', v)}
        searchable
        clearable
      />
    </Stack>
  );
}
