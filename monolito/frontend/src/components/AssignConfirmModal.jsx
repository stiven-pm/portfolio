import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export default function AssignConfirmModal({ visible, assigneeName, count, onConfirm, onCancel }) {
  const countText =
    count != null
      ? `Tiene ${count} producto${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}`
      : '';

  return (
    <Modal
      opened={visible}
      onClose={onCancel}
      closeOnClickOutside={false}
      title="Confirmar asignación"
      centered
      size="sm"
    >
      <Stack gap="sm">
        <Text size="sm">
          ¿Asignar a <strong>{assigneeName || '—'}</strong>?
        </Text>
        {countText ? (
          <Text size="sm" c="dimmed">
            {countText}
          </Text>
        ) : null}
        <Text size="xs" c="orange">
          Una vez asignado no se podrá cambiar.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onCancel}>
            Cancelar
          </Button>
          <Button color="brand" onClick={onConfirm}>
            Confirmar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
