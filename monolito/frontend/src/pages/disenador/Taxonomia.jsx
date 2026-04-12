import { useCallback, useEffect, useMemo, useState } from 'react';
import { Paper, Stack, Title, Text, SegmentedControl, Select, TextInput, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useProductsService } from '../../hooks/useProductsService';
import { useProducts } from '../../context/ProductsContext';
import { graphqlErrorUserMessage } from '../../utils/graphqlErrorUserMessage';

const TIPO = {
  CATEGORIA: 'categoria',
  SUBCATEGORIA: 'subcategoria',
  LINEA: 'linea',
  VARIABLE: 'variable',
};

function toSelectData(rows, labelKey = 'name') {
  return (rows || []).map((r) => ({ value: String(r.id), label: String(r[labelKey] ?? r.id) }));
}

export default function DisenadorTaxonomia() {
  const productsService = useProductsService();
  const { reload: reloadProducts } = useProducts();

  const [tipo, setTipo] = useState(TIPO.CATEGORIA);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [lines, setLines] = useState([]);
  const [varDefs, setVarDefs] = useState([]);

  const [categoryId, setCategoryId] = useState(null);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [lineId, setLineId] = useState(null);
  const [varDefId, setVarDefId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshCategories = useCallback(async () => {
    const rows = await productsService.getProductCategories();
    setCategories(rows || []);
  }, [productsService]);

  const refreshVarDefs = useCallback(async () => {
    const rows = await productsService.getVariableDefinitions();
    setVarDefs(rows || []);
  }, [productsService]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([refreshCategories(), refreshVarDefs()]);
      } catch (e) {
        if (!cancelled) {
          const { short } = graphqlErrorUserMessage(e);
          notifications.show({ title: 'Error', message: short, color: 'red' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productsService, refreshCategories, refreshVarDefs]);

  useEffect(() => {
    if (tipo !== TIPO.SUBCATEGORIA && tipo !== TIPO.LINEA) {
      setSubcategories([]);
      return;
    }
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId(null);
      setLines([]);
      setLineId(null);
      return;
    }
    let cancelled = false;
    productsService.getProductSubcategories(categoryId).then((rows) => {
      if (!cancelled) setSubcategories(rows || []);
    });
    return () => {
      cancelled = true;
    };
  }, [productsService, tipo, categoryId]);

  useEffect(() => {
    if (tipo !== TIPO.LINEA) {
      setLines([]);
      return;
    }
    if (!subcategoryId) {
      setLines([]);
      setLineId(null);
      return;
    }
    let cancelled = false;
    productsService.getProductLines(subcategoryId).then((rows) => {
      if (!cancelled) setLines(rows || []);
    });
    return () => {
      cancelled = true;
    };
  }, [productsService, tipo, subcategoryId]);

  const categoryData = useMemo(() => toSelectData(categories), [categories]);
  const subData = useMemo(() => toSelectData(subcategories), [subcategories]);
  const lineData = useMemo(() => toSelectData(lines), [lines]);
  const varData = useMemo(() => toSelectData(varDefs), [varDefs]);

  const onCategoryPick = (v) => {
    setCategoryId(v);
    setSubcategoryId(null);
    setLineId(null);
    setEditName('');
    if (v && tipo === TIPO.CATEGORIA) {
      const row = categories.find((x) => String(x.id) === v);
      if (row) setEditName(row.name || '');
    }
  };

  const onSubPick = (v) => {
    setSubcategoryId(v);
    setLineId(null);
    setEditName('');
    if (v && tipo === TIPO.SUBCATEGORIA) {
      const row = subcategories.find((x) => String(x.id) === v);
      if (row) setEditName(row.name || '');
    }
  };

  const onLinePick = (v) => {
    setLineId(v);
    setEditName('');
    if (v && tipo === TIPO.LINEA) {
      const row = lines.find((x) => String(x.id) === v);
      if (row) setEditName(row.name || '');
    }
  };

  const onVarPick = (v) => {
    setVarDefId(v);
    setEditName('');
    if (v) {
      const row = varDefs.find((x) => String(x.id) === v);
      if (row) setEditName(row.name || '');
    }
  };

  const handleTipoChange = (t) => {
    setTipo(t);
    setCategoryId(null);
    setSubcategoryId(null);
    setLineId(null);
    setVarDefId(null);
    setEditName('');
    setSubcategories([]);
    setLines([]);
  };

  const handleSave = async () => {
    const name = editName.trim();
    if (!name) {
      notifications.show({ title: 'Falta nombre', message: 'Escribí un nombre.', color: 'yellow' });
      return;
    }
    setBusy(true);
    try {
      if (tipo === TIPO.CATEGORIA) {
        if (!categoryId) throw new Error('Seleccioná una categoría.');
        await productsService.updateCategory(categoryId, name);
        await refreshCategories();
      } else if (tipo === TIPO.SUBCATEGORIA) {
        if (!subcategoryId) throw new Error('Seleccioná una subcategoría.');
        await productsService.updateSubcategory(subcategoryId, name);
        if (categoryId) {
          const rows = await productsService.getProductSubcategories(categoryId);
          setSubcategories(rows || []);
        }
      } else if (tipo === TIPO.LINEA) {
        if (!lineId) throw new Error('Seleccioná una línea.');
        await productsService.updateProductLine(lineId, name);
        if (subcategoryId) {
          const rows = await productsService.getProductLines(subcategoryId);
          setLines(rows || []);
        }
      } else if (tipo === TIPO.VARIABLE) {
        if (!varDefId) throw new Error('Seleccioná una variable.');
        await productsService.updateVariableDefinition(varDefId, name);
        await refreshVarDefs();
      }
      await reloadProducts();
      notifications.show({ title: 'Guardado', message: 'Los cambios se aplicaron en todo el catálogo.', color: 'green' });
    } catch (e) {
      const { short } = graphqlErrorUserMessage(e);
      notifications.show({ title: 'Error', message: short, color: 'red' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper p="md" maw={640} mx="auto" withBorder shadow="xs">
      <Stack gap="lg">
        <div>
          <Title order={3}>Taxonomía y variables</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Renombrar actualiza la fila maestra: todos los productos que la referencian muestran el nuevo nombre.
          </Text>
        </div>

        <SegmentedControl
          value={tipo}
          onChange={handleTipoChange}
          data={[
            { label: 'Categoría', value: TIPO.CATEGORIA },
            { label: 'Subcategoría', value: TIPO.SUBCATEGORIA },
            { label: 'Línea', value: TIPO.LINEA },
            { label: 'Variable', value: TIPO.VARIABLE },
          ]}
        />

        {tipo === TIPO.CATEGORIA && (
          <Select
            label="Categoría"
            placeholder="Elegir"
            data={categoryData}
            value={categoryId}
            onChange={onCategoryPick}
            searchable
            clearable
          />
        )}

        {tipo === TIPO.SUBCATEGORIA && (
          <Stack gap="sm">
            <Select
              label="Categoría"
              placeholder="Elegir"
              data={categoryData}
              value={categoryId}
              onChange={onCategoryPick}
              searchable
              clearable
            />
            <Select
              label="Subcategoría"
              placeholder="Elegir"
              data={subData}
              value={subcategoryId}
              onChange={onSubPick}
              searchable
              clearable
              disabled={!categoryId}
            />
          </Stack>
        )}

        {tipo === TIPO.LINEA && (
          <Stack gap="sm">
            <Select
              label="Categoría"
              placeholder="Elegir"
              data={categoryData}
              value={categoryId}
              onChange={onCategoryPick}
              searchable
              clearable
            />
            <Select
              label="Subcategoría"
              placeholder="Elegir"
              data={subData}
              value={subcategoryId}
              onChange={onSubPick}
              searchable
              clearable
              disabled={!categoryId}
            />
            <Select
              label="Línea"
              placeholder="Elegir"
              data={lineData}
              value={lineId}
              onChange={onLinePick}
              searchable
              clearable
              disabled={!subcategoryId}
            />
          </Stack>
        )}

        {tipo === TIPO.VARIABLE && (
          <Select
            label="Definición de variable"
            placeholder="Elegir"
            data={varData}
            value={varDefId}
            onChange={onVarPick}
            searchable
            clearable
          />
        )}

        <TextInput
          label="Nombre"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          disabled={
            (tipo === TIPO.CATEGORIA && !categoryId) ||
            (tipo === TIPO.SUBCATEGORIA && !subcategoryId) ||
            (tipo === TIPO.LINEA && !lineId) ||
            (tipo === TIPO.VARIABLE && !varDefId)
          }
        />

        <Group justify="flex-end">
          <Button color="brand" loading={busy} onClick={handleSave}>
            Guardar nombre
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
