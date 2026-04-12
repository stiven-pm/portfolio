import { useState } from 'react';
import { Alert, Stack, Text, FileInput, Button } from '@mantine/core';
import { uploadFile } from '../../api/documentService';

export default function MarkDesignedModalBody({ onSubmit }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  return (
    <Stack gap="md">
      <Alert color="brand" variant="light" title="Marcar como diseñado">
        ¿Confirmás marcar esta variante como <strong>diseñada</strong>? Podés adjuntar el PDF de planos (opcional); se guarda de forma segura.
      </Alert>
      <Text size="sm" c="dimmed">
        Sin PDF también podés confirmar; el plano es recomendable para trazabilidad.
      </Text>
      <FileInput
        label="PDF de planos"
        accept="application/pdf"
        value={file}
        onChange={setFile}
        clearable
      />
      <Button
        color="brand"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            let key = null;
            if (file) {
              const r = await uploadFile(file, 'plan');
              key = r.key;
            }
            await onSubmit(key);
          } finally {
            setBusy(false);
          }
        }}
      >
        Confirmar y marcar diseñado
      </Button>
    </Stack>
  );
}
