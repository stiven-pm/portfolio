import { Card, Text, Stack } from '@mantine/core';
import ImageWithModal from './ImageWithModal';
import './BaseCard.css';

export default function BaseCard({ product, onClick }) {
  const coverUrl =
    product?.variants?.[0]?.fullUrl || product?.fullUrl || null;

  return (
    <Card
      component="button"
      type="button"
      withBorder
      padding="sm"
      radius="md"
      shadow="sm"
      className="base-card"
      onClick={onClick}
    >
      <Stack gap="xs" align="stretch">
        <div
          className="base-card-image"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          {coverUrl ? (
            <ImageWithModal src={coverUrl} alt={product.name}>
              <img src={coverUrl} alt={product.name} />
            </ImageWithModal>
          ) : (
            <div className="base-card-placeholder">Sin imagen</div>
          )}
        </div>
        <div className="base-card-info">
          <Text size="sm" fw={700} lineClamp={2}>
            {product.name}
          </Text>
          {product.line && (
            <Text size="xs" c="dimmed">
              {product.line}
            </Text>
          )}
        </div>
      </Stack>
    </Card>
  );
}
