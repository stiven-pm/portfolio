import { useState, useMemo, useEffect } from 'react';
import { Modal, Button, ActionIcon } from '@mantine/core';
import { getVariantDisplayCodes, formatCodes } from '../utils/variantComponentCodes';
import './PDFFormModal.css';

const EMPTY_PRODUCTS = [];

const DEFAULT_VALIDEZ = 'Validez de la Oferta: 30 días calendario.';
const DEFAULT_FORMA_PAGO = 'Forma de pago: 50% ANTICIPO Y 50% A CONVENIR. Pregunte por nuestra opción de venta por contrato de arrendamiento.';
const DEFAULT_CARACTERISTICAS_OFERTA = `Las imágenes presentadas son ilustrativas y pueden presentar diferencias con respecto al producto cotizado.
Elementos multíomos o accesorios que no estén especificados en la cotización no están incluidos.
Si su negociación incluye productos especiales, tenga presente que para una potencial continuidad de estos ítems, se evaluarán nuevamente las cantidades mínimas requeridas para la fabricación de los mismos.
Si su negociación incluye productos importados, el proveedor se reserva el derecho de ajustar los precios según la volatilidad del dólar y tiempos de entrega de acuerdo a la logística, una vez vencida la vigencia de esta cotización.`;
const DEFAULT_PLAZO_ENTREGA = '25-30 días hábiles, el tiempo de entrega empieza a contar una vez sea recibida la orden de compra, se verifiquen acabados y se apruebe cotización, junto con el comprobante de pago del anticipo reflejado en bancos';
const DEFAULT_TRANSPORTE = 'Incluido a ciudades principales (Bogotá, Medellín, Cali, Barranquilla)';
const DEFAULT_INSTALACION = 'Incluido a ciudades principales (Bogotá, Medellín, Cali, Barranquilla)';
const DEFAULT_CONDICIONES_ENTREGA = `Condiciones de entrega: Al recibir su pedido, debe revisar las cantidades y el estado del empaque. Registre en la remisión del transportador cualquier deterioro o faltante de mercancía. La falta de observaciones en dicha remisión, libera a los transportadores contratados de la responsabilidad ante cualquier daño. Por lo tanto, el proveedor no puede hacerse responsable por estos reclamos.
La no recepción del mobiliario en el lugar de entrega en el tiempo pactado, genera problemas logísticos de bodegaje y de administración del riesgo para el VENDEDOR. El COMPRADOR autoriza el cobro de los gastos correspondientes a bodegaje y seguro en los cuales incurra. Lo anterior, de conformidad con lo indicado en el artículo 1883 del código civil.
Si al momento de la entrega del producto en las plazas acordadas el cliente aplaza el despacho, se autoriza al proveedor a cobrar un bodegaje a partir del día 15 a razón de $ 20.000 (veinte mil pesos) m3 por mes o fracción`;

const DEFAULT_GARANTIA = `3 años en estructura por defectos de fabricación
2 años para sillería plástico, textiles y pintura (no incluye daños causados por el uso inadecuado)
1 año en mecanismos abatibles
6 meses en rodachinas y variables o accesorios`;

function buildDescripcion(p) {
  const parts = [];
  const variantCodes = getVariantDisplayCodes({
    sapRef: p.sapRef,
    sapCode: p.sapCode,
    type: p.type,
  });
  if (variantCodes) {
    parts.push(`Código: ${formatCodes(variantCodes.primary, variantCodes.secondary)}`);
  }
  if (p.category) parts.push(`Categoría: ${p.category}`);
  if (p.subcategory) parts.push(`Subcategoría: ${p.subcategory}`);
  if (p.line) parts.push(`Línea: ${p.line}`);
  if (p.type) parts.push(`Tipología: ${p.type}`);
  if (p.components?.length) {
    const carLines = p.components
      .filter((c) => c.value != null && c.value !== '')
      .map((c) => `${c.name || c.id}: ${c.value}`);
    parts.push(...carLines);
  }
  if (p.comments) parts.push(`Comentarios: ${p.comments}`);
  return parts.join('\n') || 'Producto';
}

export default function PDFFormModal({ visible, onClose, project, products = EMPTY_PRODUCTS, onGenerate }) {
  const [formData, setFormData] = useState({
    projectName: project?.name || '',
    cliente: project?.client || '',
    tel: '',
    ciudad: '',
    apreciado: 'Apreciado señor/a',
    regional: project?.region || '',
    fechaEntrega: '',
    comercialNombre: '',
    comercialTel: '',
    comercialEmail: '',
    comercialCargo: 'ASESOR COMERCIAL',
    productos: (products || []).map((p) => ({
      ...p,
      id: p.id,
      imagen: p.image ?? p.baseImage,
      descripcion: buildDescripcion(p),
      precioUnitario: p.price ?? p.precio ?? '',
      descuento: '',
      cantidad: p.quantity ?? p.cantidad ?? 1,
    })),
    validez: DEFAULT_VALIDEZ,
    formaPago: DEFAULT_FORMA_PAGO,
    caracteristicasOferta: DEFAULT_CARACTERISTICAS_OFERTA,
    plazoEntrega: DEFAULT_PLAZO_ENTREGA,
    transporte: DEFAULT_TRANSPORTE,
    instalacion: DEFAULT_INSTALACION,
    condicionesEntrega: DEFAULT_CONDICIONES_ENTREGA,
    garantia: DEFAULT_GARANTIA,
  });

  useEffect(() => {
    if (visible && project) {
      setFormData({
        projectName: project?.name || '',
        cliente: project?.client || '',
        tel: '',
        ciudad: '',
        apreciado: 'Apreciado señor/a',
        regional: project?.region || '',
        fechaEntrega: '',
        comercialNombre: '',
        comercialTel: '',
        comercialEmail: '',
        comercialCargo: 'ASESOR COMERCIAL',
        productos: (products || []).map((p) => ({
          ...p,
          id: p.id,
          imagen: p.image ?? p.baseImage,
          descripcion: buildDescripcion(p),
          precioUnitario: p.price ?? p.precio ?? '',
          descuento: '',
          cantidad: p.quantity ?? p.cantidad ?? 1,
        })),
        validez: DEFAULT_VALIDEZ,
        formaPago: DEFAULT_FORMA_PAGO,
        caracteristicasOferta: DEFAULT_CARACTERISTICAS_OFERTA,
        plazoEntrega: DEFAULT_PLAZO_ENTREGA,
        transporte: DEFAULT_TRANSPORTE,
        instalacion: DEFAULT_INSTALACION,
        condicionesEntrega: DEFAULT_CONDICIONES_ENTREGA,
        garantia: DEFAULT_GARANTIA,
      });
    }
  }, [visible, project?.id]);

  const totales = useMemo(() => {
    const subtotal = formData.productos.reduce((sum, p) => {
      const precio = parseFloat(p.precioUnitario) || 0;
      const desc = parseFloat(p.descuento) || 0;
      const cant = parseFloat(p.cantidad) || 1;
      const precioConDesc = precio - (precio * desc) / 100;
      return sum + precioConDesc * cant;
    }, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  }, [formData.productos]);

  const updateProducto = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const handleGenerate = () => {
    const productosConUrls = formData.productos.map((p) => {
      const key = p.imagen ? String(p.imagen).trim() : '';
      return { ...p, imagenUrl: key ? `/images/${key}` : '' };
    });
    onGenerate?.({ ...formData, productos: productosConUrls, totales });
  };

  return (
    <Modal
      opened={visible}
      onClose={onClose}
      closeOnClickOutside={false}
      fullScreen
      padding={0}
      withCloseButton={false}
      zIndex={1100}
      lockScroll
      classNames={{ content: 'pdf-modal-mantine-wrap' }}
    >
      <div
        className="pdf-modal pdf-modal-full"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="pdf-modal-header">
          <h2>Personalizar PDF de Cotización</h2>
          <ActionIcon variant="transparent" c="white" size="lg" className="pdf-modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </ActionIcon>
        </div>
        <div className="pdf-modal-body">
          <div className="pdf-section">
            <h3>Datos del Proyecto</h3>
            <div className="pdf-fields-grid">
              <label htmlFor="pdf-apreciado">Apreciado señor/a</label>
              <input
                id="pdf-apreciado"
                value={formData.apreciado}
                onChange={(e) => setFormData((p) => ({ ...p, apreciado: e.target.value }))}
                placeholder="Ej: Apreciado señor/a"
              />
              <label htmlFor="pdf-cliente">Cliente</label>
              <input
                id="pdf-cliente"
                value={formData.cliente}
                onChange={(e) => setFormData((p) => ({ ...p, cliente: e.target.value }))}
                placeholder="Nombre del cliente"
              />
              <label htmlFor="pdf-tel">Teléfono</label>
              <input
                id="pdf-tel"
                value={formData.tel}
                onChange={(e) => setFormData((p) => ({ ...p, tel: e.target.value }))}
                placeholder="Teléfono del cliente"
              />
              <label htmlFor="pdf-ciudad">Ciudad</label>
              <input
                id="pdf-ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData((p) => ({ ...p, ciudad: e.target.value }))}
                placeholder="Ciudad"
              />
              <label htmlFor="pdf-proyecto">Proyecto</label>
              <input
                id="pdf-proyecto"
                value={formData.projectName}
                onChange={(e) => setFormData((p) => ({ ...p, projectName: e.target.value }))}
                placeholder="Nombre del proyecto"
              />
              <label htmlFor="pdf-regional">Regional</label>
              <input
                id="pdf-regional"
                value={formData.regional}
                onChange={(e) => setFormData((p) => ({ ...p, regional: e.target.value }))}
                placeholder="Regional"
              />
              <label htmlFor="pdf-fecha-entrega">Fecha de Entrega</label>
              <input
                id="pdf-fecha-entrega"
                value={formData.fechaEntrega}
                onChange={(e) => setFormData((p) => ({ ...p, fechaEntrega: e.target.value }))}
                placeholder="Fecha de entrega"
              />
            </div>
          </div>

          <div className="pdf-section">
            <h3>Productos</h3>
            {formData.productos.map((p, i) => (
              <div key={p.id} className="pdf-product-row">
                <div className="pdf-product-image">
                  {p.imagen ? (
                    <span className="pdf-product-image-hint">Imagen en PDF</span>
                  ) : (
                    <span className="pdf-product-image-placeholder">Sin imagen</span>
                  )}
                </div>
                <div className="pdf-product-fields">
                  <label htmlFor={`pdf-desc-${p.id}`}>Descripción</label>
                  <textarea
                    id={`pdf-desc-${p.id}`}
                    value={p.descripcion}
                    onChange={(e) => updateProducto(i, 'descripcion', e.target.value)}
                    placeholder="Categoría, subcategoría, características..."
                    rows={4}
                  />
                  <div className="pdf-product-row-inline">
                    <div>
                      <label htmlFor={`pdf-precio-${p.id}`}>Precio unit.</label>
                      <input
                        id={`pdf-precio-${p.id}`}
                        type="text"
                        value={p.precioUnitario}
                        onChange={(e) => updateProducto(i, 'precioUnitario', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label htmlFor={`pdf-descuento-${p.id}`}>Descuento (%)</label>
                      <input
                        id={`pdf-descuento-${p.id}`}
                        type="text"
                        value={p.descuento}
                        onChange={(e) => updateProducto(i, 'descuento', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label htmlFor={`pdf-cantidad-${p.id}`}>Cantidad</label>
                      <input
                        id={`pdf-cantidad-${p.id}`}
                        type="number"
                        value={p.cantidad}
                        onChange={(e) => updateProducto(i, 'cantidad', e.target.value)}
                        min={1}
                      />
                    </div>
                    <div className="pdf-product-subtotal">
                      <label htmlFor={`pdf-subtotal-${p.id}`}>Subtotal</label>
                      <span id={`pdf-subtotal-${p.id}`}>
                        $
                        {(
                          (parseFloat(p.precioUnitario) || 0) *
                          (1 - (parseFloat(p.descuento) || 0) / 100) *
                          (parseFloat(p.cantidad) || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pdf-section pdf-totales">
            <div className="pdf-total-row">
              <span>Subtotal:</span>
              <span>${totales.subtotal.toFixed(2)}</span>
            </div>
            <div className="pdf-total-row">
              <span>IVA (19%):</span>
              <span>${totales.iva.toFixed(2)}</span>
            </div>
            <div className="pdf-total-row pdf-total-final">
              <span>TOTAL:</span>
              <span>${totales.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pdf-section">
            <h3>Condiciones Comerciales</h3>
            <label htmlFor="pdf-validez">Validez de la Oferta</label>
            <textarea
              id="pdf-validez"
              value={formData.validez}
              onChange={(e) => setFormData((p) => ({ ...p, validez: e.target.value }))}
              rows={2}
            />
            <label htmlFor="pdf-forma-pago">Forma de Pago</label>
            <textarea
              id="pdf-forma-pago"
              value={formData.formaPago}
              onChange={(e) => setFormData((p) => ({ ...p, formaPago: e.target.value }))}
              rows={3}
            />
            <label htmlFor="pdf-caracteristicas">Características de la Oferta</label>
            <textarea
              id="pdf-caracteristicas"
              value={formData.caracteristicasOferta}
              onChange={(e) => setFormData((p) => ({ ...p, caracteristicasOferta: e.target.value }))}
              rows={6}
            />
            <label htmlFor="pdf-plazo-entrega">Plazo de Entrega</label>
            <textarea
              id="pdf-plazo-entrega"
              value={formData.plazoEntrega}
              onChange={(e) => setFormData((p) => ({ ...p, plazoEntrega: e.target.value }))}
              rows={3}
            />
            <label htmlFor="pdf-transporte">Transporte</label>
            <textarea
              id="pdf-transporte"
              value={formData.transporte}
              onChange={(e) => setFormData((p) => ({ ...p, transporte: e.target.value }))}
              rows={2}
            />
            <label htmlFor="pdf-instalacion">Instalación</label>
            <textarea
              id="pdf-instalacion"
              value={formData.instalacion}
              onChange={(e) => setFormData((p) => ({ ...p, instalacion: e.target.value }))}
              rows={2}
            />
            <label htmlFor="pdf-condiciones-entrega">Condiciones de Entrega</label>
            <textarea
              id="pdf-condiciones-entrega"
              value={formData.condicionesEntrega}
              onChange={(e) => setFormData((p) => ({ ...p, condicionesEntrega: e.target.value }))}
              rows={6}
            />
            <label htmlFor="pdf-garantia">Garantía</label>
            <textarea
              id="pdf-garantia"
              value={formData.garantia}
              onChange={(e) => setFormData((p) => ({ ...p, garantia: e.target.value }))}
              rows={5}
            />
          </div>

          <div className="pdf-section">
            <h3>Datos del Comercial / Asesor</h3>
            <div className="pdf-fields-grid">
              <label htmlFor="pdf-comercial-nombre">Nombre</label>
              <input
                id="pdf-comercial-nombre"
                value={formData.comercialNombre}
                onChange={(e) => setFormData((p) => ({ ...p, comercialNombre: e.target.value }))}
                placeholder="Nombre del comercial"
              />
              <label htmlFor="pdf-comercial-tel">Teléfono</label>
              <input
                id="pdf-comercial-tel"
                value={formData.comercialTel}
                onChange={(e) => setFormData((p) => ({ ...p, comercialTel: e.target.value }))}
                placeholder="Teléfono"
              />
              <label htmlFor="pdf-comercial-email">Email</label>
              <input
                id="pdf-comercial-email"
                type="email"
                value={formData.comercialEmail}
                onChange={(e) => setFormData((p) => ({ ...p, comercialEmail: e.target.value }))}
                placeholder="Email"
              />
              <label htmlFor="pdf-comercial-cargo">Cargo</label>
              <input
                id="pdf-comercial-cargo"
                value={formData.comercialCargo}
                onChange={(e) => setFormData((p) => ({ ...p, comercialCargo: e.target.value }))}
                placeholder="Cargo"
              />
            </div>
          </div>

          <Button type="button" color="brand" size="md" className="pdf-generate-btn" onClick={handleGenerate}>
            Generar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
