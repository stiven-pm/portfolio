import { useState } from 'react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useFilters } from '../../context/FiltersContext';
import ProductDetailModal from '../../components/ProductDetailModal';
import BaseEditModal from '../../components/BaseEditModal';
import BaseList from '../../components/BaseList';
import ProductosCatalogLayout from '../../components/productos/ProductosCatalogLayout';
import { useProductosFiltersDrawer } from '../../hooks/useProductosFiltersDrawer';
import { useProductsService } from '../../hooks/useProductsService';
import { useProducts } from '../../context/ProductsContext';
import './Productos.css';

export default function DisenadorProductos() {
  const { productsByCategory } = useFilters();
  const { reload } = useProducts();
  const productsService = useProductsService();
  const { filtersOpen, open, close } = useProductosFiltersDrawer();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleProductClick = (product) => setSelectedProduct(product);

  const handleEdit = (product) => {
    setSelectedProduct(null);
    setEditingProduct(product);
  };

  const handleDelete = (product) => {
    modals.openConfirmModal({
      title: 'Eliminar producto',
      children: '¿Eliminar este producto y todas sus variantes? Esta acción no se puede deshacer.',
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await productsService.deleteBase(product.id);
          setSelectedProduct(null);
          setEditingProduct(null);
          reload();
          notifications.show({ title: 'Listo', message: 'Producto eliminado', color: 'green' });
        } catch (err) {
          notifications.show({
            title: 'Error',
            message: err?.message || 'Error al eliminar',
            color: 'red',
          });
        }
      },
    });
  };

  return (
    <>
      <ProductosCatalogLayout
        filtersOpen={filtersOpen}
        onOpenFilters={open}
        onCloseFilters={close}
      >
        {Object.entries(productsByCategory || {}).map(([cat, items]) => (
          <BaseList
            key={cat}
            title={cat}
            items={items}
            onProductClick={handleProductClick}
          />
        ))}
      </ProductosCatalogLayout>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isDesigner
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editingProduct && (
        <BaseEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={() => setEditingProduct(null)}
        />
      )}
    </>
  );
}
