import { Stack, TextInput, Text } from '@mantine/core';
import AutocompleteInput from '../../components/AutocompleteInput';

export default function CrearFormFields({
  form,
  handleChange,
  categoryInput,
  subcategoryInput,
  lineInput,
  onCategoryInputChange,
  onSubcategoryInputChange,
  onLineInputChange,
  onCategoryBlurCommit,
  onSubcategoryBlurCommit,
  onLineBlurCommit,
  categoryLabels,
  subcategoryLabels,
  lineLabels,
}) {
  return (
    <Stack gap="sm" className="crear-form-fields">
      <TextInput
        label="Nombre"
        id="crear-name"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        autoComplete="off"
      />
      <div>
        <Text component="label" htmlFor="crear-category" size="sm" fw={500} mb={4} display="block">
          Categoría
        </Text>
        <AutocompleteInput
          id="crear-category"
          name="category"
          value={categoryInput}
          onChange={onCategoryInputChange}
          options={categoryLabels}
          placeholder="Escribí o elegí una categoría"
          required
          onBlurCommit={onCategoryBlurCommit}
        />
      </div>
      <div>
        <Text component="label" htmlFor="crear-subcategory" size="sm" fw={500} mb={4} display="block">
          Subcategoría
        </Text>
        <AutocompleteInput
          id="crear-subcategory"
          name="subcategory"
          value={subcategoryInput}
          onChange={onSubcategoryInputChange}
          options={subcategoryLabels}
          placeholder="Escribí o elegí una subcategoría"
          required
          onBlurCommit={onSubcategoryBlurCommit}
        />
      </div>
      <div>
        <Text component="label" htmlFor="crear-line" size="sm" fw={500} mb={4} display="block">
          Línea
        </Text>
        <AutocompleteInput
          id="crear-line"
          name="line"
          value={lineInput}
          onChange={onLineInputChange}
          options={lineLabels}
          placeholder="Escribí o elegí una línea"
          required
          onBlurCommit={onLineBlurCommit}
        />
      </div>
    </Stack>
  );
}
