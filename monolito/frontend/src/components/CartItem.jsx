import { Select } from '@mantine/core';
import { useProducts } from '../context/ProductsContext';
import { calculateTipologia } from '../utils/calculateTipologia';
import { itemMatchesSelectedVariantCatalog } from '../utils/reconcileCartItemFromCaracteristicas';
import { getVariantDisplayCodes } from '../utils/variantComponentCodes';
import { collectListOptionsForVariableName } from '../utils/variableCatalogOptions';
import ImageWithModal from './ImageWithModal';
import './CartItem.css';

export default function CartItem({
  item,
  expanded,
  onToggle,
  onIncrease,
  onDecrease,
  onChangeCaracteristica,
  onRemove,
  onChangeComment,
}) {
  const { products } = useProducts();
  const isP3 = item?.p3 || item?.tipologia === 'P3';
  const isP5 = String(item?.type || item?.tipologia || '').toLowerCase() === 'p5';
  const componentOriginals = item?._componentOriginals || {};
  const original = item?._originalCaracteristicas || {};
  const updated = item?.caracteristicas || {};

  const originalByName = Object.keys(original).length
    ? original
    : Object.fromEntries(Object.entries(componentOriginals).map(([id, o]) => [o?.name || id, o?.value ?? '']));
  const updatedByName = Object.fromEntries(
    Object.entries(updated).map(([id, v]) => [componentOriginals[id]?.name || id, v ?? ''])
  );
  const computedTipologia = calculateTipologia(originalByName, updatedByName);
  const matchesCatalog = itemMatchesSelectedVariantCatalog(item, updated);
  const rawType = String(item?.type || item?.tipologia || '').toLowerCase();
  // P4 antes que tipología heredada del listado: si no hay diff vs original y coincide catálogo, no mostrar P1/P2 obsoleto.
  const tipologia = isP3
    ? 'P3'
    : isP5
      ? 'P5'
      : matchesCatalog
        ? 'P4'
        : computedTipologia
          ? computedTipologia.toUpperCase()
          : rawType && /^p[1-5]$/.test(rawType)
            ? rawType.toUpperCase()
            : '—';

  const displayName = item?.name || item?.subcategoria || item?.categoria || 'Producto';

  const selectedVariant = item?._selectedVariantId && item?.variants?.length
    ? item.variants.find((v) => String(v.id) === String(item._selectedVariantId))
    : item?.variants?.[0];
  const sapRef = item?.sapRef ?? selectedVariant?.sapRef;
  const sapCode = item?.sapCode ?? selectedVariant?.sapCode;
  const itemType = item?.type ?? selectedVariant?.type;

  const compIds = [...new Set([...Object.keys(componentOriginals), ...Object.keys(updated)])].filter(Boolean);
  const allComps = compIds
    .map((id) => ({ id, name: componentOriginals[id]?.name || id, ...componentOriginals[id] }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const variantCodes = getVariantDisplayCodes({
    sapRef,
    sapCode,
    type: tipologia || itemType,
  });

  return (
    <div className={`cart-item ${expanded ? 'cart-item-expanded' : ''}`}>
      <button
        type="button"
        className="cart-item-header"
        onClick={() => onToggle?.()}
      >
        <div className="cart-item-meta">
          <div
            className="cart-item-image"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
          >
            {item?.fullUrl ? (
              <ImageWithModal src={item.fullUrl} alt={displayName}>
                <img src={item.fullUrl} alt={displayName} />
              </ImageWithModal>
            ) : (
              <div className="cart-item-placeholder">📦</div>
            )}
          </div>
          <div className="cart-item-info">
            <span className="cart-item-name">{displayName}</span>
            {variantCodes && (
              <div className="cart-item-code codigo-stack codigo-stack-fixed">
                {variantCodes.secondary ? (
                  <span className="codigo-sap">{variantCodes.secondary}</span>
                ) : (
                  <span className="codigo-sap codigo-placeholder" aria-hidden> </span>
                )}
                <span className={variantCodes.secondary ? 'codigo-ref' : 'codigo-ref codigo-ref-only'}>{variantCodes.primary}</span>
              </div>
            )}
          </div>
        </div>

        <div className="cart-item-actions">
          <span className="cart-item-tipologia">{/^p[1-5]$/i.test(tipologia) ? tipologia.toUpperCase() : tipologia}</span>
          <div className="cart-item-qty">
            <button type="button" className="cart-item-qty-btn" onClick={(e) => { e.stopPropagation(); onDecrease?.(); }}>
              −
            </button>
            <span className="cart-item-qty-value">{item?.quantity || 1}</span>
            <button type="button" className="cart-item-qty-btn" onClick={(e) => { e.stopPropagation(); onIncrease?.(); }}>
              +
            </button>
          </div>
          <button
            type="button"
            className="cart-item-delete"
            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
            title="Eliminar"
          >
            ✕
          </button>
          <span className="cart-item-expand">{expanded ? '▴' : '▾'}</span>
        </div>
      </button>

      {expanded && allComps.length > 0 && (
        <div className="cart-item-body">
          <div className="cart-item-caracteristicas">
            <span className="cart-item-label">Características</span>
            <div className="cart-item-fields">
              {allComps.map((comp) => {
                const currentValue = (item.caracteristicas || {})[comp.id] ?? '';
                const locked = comp.editable === false;
                const listMode = comp.listOnly === true && !locked;
                const baseOpts = listMode ? collectListOptionsForVariableName(item, products, comp.name) : [];
                const curTrim = String(currentValue ?? '').trim();
                const selectRows = listMode ? baseOpts.map((o) => ({ value: o, label: o })) : [];
                const selectValue = listMode && baseOpts.includes(curTrim) ? curTrim : null;
                return (
                  <div key={comp.id} className="cart-item-field">
                    <label>{comp.name}</label>
                    {listMode ? (
                      <div
                        className="cart-item-field-control"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {selectRows.length > 0 ? (
                          <Select
                            size="xs"
                            w="100%"
                            placeholder="Elegir…"
                            data={selectRows}
                            value={selectValue}
                            onChange={(val) => onChangeCaracteristica?.(comp.id, val ?? '')}
                            searchable
                            clearable={false}
                            disabled={locked}
                            classNames={{ input: 'cart-item-select-input' }}
                          />
                        ) : (
                          <input
                            type="text"
                            readOnly
                            disabled
                            value=""
                            placeholder="Sin valores en catálogo"
                            title="No hay valores listados para esta variable"
                          />
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={String(currentValue ?? '')}
                        onChange={(e) => onChangeCaracteristica?.(comp.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={comp.name}
                        readOnly={locked}
                        disabled={locked}
                        title={locked ? 'Variable no editable para comercial' : undefined}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="cart-item-comment">
        <textarea
          placeholder="Agregar comentario..."
          value={item?.comentarios ?? ''}
          onChange={(e) => onChangeComment?.(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          rows={2}
        />
      </div>
    </div>
  );
}
