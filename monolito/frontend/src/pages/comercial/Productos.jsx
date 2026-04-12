import { useState } from 'react';
import { useFilters } from '../../context/FiltersContext';
import { useCart } from '../../context/CartContext';
import ProductDetailModal from '../../components/ProductDetailModal';
import BaseList from '../../components/BaseList';
import ProductosCatalogLayout from '../../components/productos/ProductosCatalogLayout';
import { useProductosFiltersDrawer } from '../../hooks/useProductosFiltersDrawer';
import './Productos.css';

export default function ComercialProductos() {
  const { productsByCategory } = useFilters();
  const { addProductToProject } = useCart();
  const { filtersOpen, open, close } = useProductosFiltersDrawer();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductClick = (product) => setSelectedProduct(product);

  const handleAddToCart = (product) => {
    addProductToProject(product);
    setSelectedProduct(null);
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
          onAddToCart={handleAddToCart}
          isDesigner={false}
        />
      )}
    </>
  );
}
