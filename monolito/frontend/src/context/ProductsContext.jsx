import { createContext, useContext, useEffect, useState } from 'react';
import { useProductsService } from '../hooks/useProductsService';
import { getMediaUrls } from '../api/documentService';
import { normalizeVariantRows } from '../utils/variantFieldAlias';

const ProductsContext = createContext(null);

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};

export const ProductsProvider = ({ children }) => {
  const productsService = useProductsService();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const bases = await productsService.getProducts();
      if (!bases?.length) {
        setProducts([]);
        return;
      }
      const imageKeys = [
        ...new Set(
          bases.flatMap((b) =>
            (b.variants || []).map((v) => v.image).filter(Boolean)
          )
        ),
      ];
      let urlMap = {};
      if (imageKeys.length > 0) {
        try {
          const res = await getMediaUrls(imageKeys, 'image');
          urlMap = res?.data || {};
        } catch {}
      }

      const final = bases.map((b) => {
        const variants = (b.variants || []).map((v) => {
          const nv = normalizeVariantRows(v);
          return {
            ...nv,
            fullUrl: nv.image ? urlMap[nv.image] || null : null,
          };
        });
        const fullUrl =
          variants[0]?.fullUrl || variants.find((v) => v.fullUrl)?.fullUrl || null;
        return {
          ...b,
          variants,
          fullUrl,
        };
      });
      setProducts(final);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, reload: loadProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};
