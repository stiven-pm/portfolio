import { Select, TextInput, Textarea } from '@mantine/core';
import { collectValuesForVariableName } from '../../utils/variableCatalogOptions';

export function DescripcionEstructurada({
  variant,
  typeVal,
  compsArr,
  commentsVal,
  caractExpanded,
  onToggleCaract,
  listSummaryOnly = false,
}) {
  return (
    <div className="descripcion-estructurada">
      {variant.category && <div className="descripcion-category">{variant.category}</div>}
      {variant.subcategory && <div className="descripcion-subcategory">{variant.subcategory}</div>}
      {variant.line && <div className="descripcion-detail">Línea: {variant.line}</div>}
      {typeVal && <div className="descripcion-detail">Tipología: {typeVal}</div>}
      {compsArr.length > 0 &&
        (listSummaryOnly ? (
          <div className="descripcion-detail descripcion-mobile-summary-hint">
            Características ({compsArr.length}) — toca para ver el detalle
          </div>
        ) : (
          <div className="descripcion-caracteristicas">
            <button type="button" className="descripcion-caract-toggle" onClick={onToggleCaract}>
              {caractExpanded ? '▼' : '▶'} Características ({compsArr.length})
            </button>
            {caractExpanded && (
              <div className="descripcion-chips">
                {compsArr.map((c) => (
                  <span
                    key={c.name}
                    className={
                      c.codes ? 'descripcion-chip descripcion-chip-with-codes' : 'descripcion-chip'
                    }
                  >
                    <span className="descripcion-chip-label">
                      {c.name}: {c.val}
                    </span>
                    {c.codes && (
                      <div className="codigo-stack codigo-stack-fixed">
                        {c.codes.secondary ? (
                          <span className="codigo-sap">{c.codes.secondary}</span>
                        ) : (
                          <span className="codigo-sap codigo-placeholder" aria-hidden>
                            {' '}
                          </span>
                        )}
                        <span
                          className={c.codes.secondary ? 'codigo-ref' : 'codigo-ref codigo-ref-only'}
                        >
                          {c.codes.primary}
                        </span>
                      </div>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      <div
        className={`descripcion-comentarios${listSummaryOnly ? ' descripcion-comentarios--clamp' : ''}`}
      >
        <span className="descripcion-comentarios-label">Comentarios:</span>
        <span className="descripcion-comentarios-text">{commentsVal || 'Sin comentarios'}</span>
      </div>
    </div>
  );
}

/** Solicitudes cotizadas: metadatos + variables y comentarios editables. */
export function DescripcionInlineEditable({
  variant: v,
  typeVal,
  getEffectiveComponents,
  getEffectiveComments,
  onComponentChange,
  onCommentsChange,
  products = [],
}) {
  const comps = (v.components || []).filter((c) => c?.id);
  return (
    <div className="descripcion-inline-editable">
      <div className="descripcion-inline-meta">
        {v.category && <div className="descripcion-inline-title">{v.category}</div>}
        {v.subcategory && <div className="descripcion-inline-sub">{v.subcategory}</div>}
        <div className="descripcion-inline-details">
          {v.line && <span>Línea: {v.line}</span>}
          {typeVal != null && typeVal !== '' && <span>Tipología: {typeVal}</span>}
        </div>
      </div>
      {comps.length > 0 && (
        <div className="descripcion-inline-fields" role="group" aria-label="Variables">
          {comps.map((c) => {
            const cur = getEffectiveComponents(v)[c.id] ?? '';
            const curTrim = String(cur ?? '').trim();
            const opts = collectValuesForVariableName(products, c.name);
            const listMode = c.listOnly === true && c.editable !== false;
            const selectData = opts.map((opt) => ({ value: opt, label: opt }));
            const selectValue = opts.includes(curTrim) ? curTrim : null;
            return (
              <div key={c.id} className="descripcion-inline-field">
                <label htmlFor={`comp-${v.id}-${c.id}`}>{c.name || c.id}</label>
                {listMode ? (
                  <Select
                    id={`comp-${v.id}-${c.id}`}
                    size="xs"
                    classNames={{ input: 'descripcion-inline-mantine' }}
                    placeholder="—"
                    data={selectData}
                    value={selectValue}
                    onChange={(val) => {
                      // En Mantine, al hacer click en la opción ya seleccionada puede emitir null (deselect).
                      // Regla de negocio: en listOnly siempre debe quedar un valor.
                      if (val == null) return;
                      onComponentChange(v, c, val);
                    }}
                    searchable
                    clearable={false}
                    allowDeselect={false}
                    disabled={c.editable === false}
                  />
                ) : (
                  <TextInput
                    id={`comp-${v.id}-${c.id}`}
                    size="xs"
                    classNames={{ input: 'descripcion-inline-mantine' }}
                    value={cur}
                    placeholder={String(c.catalogOriginalValue ?? c.originalValue ?? c.value ?? '')}
                    onChange={(e) => onComponentChange(v, c, e.target.value)}
                    autoComplete="off"
                    disabled={c.editable === false}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="descripcion-inline-field descripcion-inline-field--full">
        <label htmlFor={`comments-${v.id}`}>Comentarios</label>
        <Textarea
          id={`comments-${v.id}`}
          size="xs"
          classNames={{ input: 'descripcion-inline-mantine' }}
          value={getEffectiveComments(v)}
          onChange={(e) => onCommentsChange(v, e.target.value)}
          placeholder="Sin comentarios"
          rows={2}
        />
      </div>
    </div>
  );
}
