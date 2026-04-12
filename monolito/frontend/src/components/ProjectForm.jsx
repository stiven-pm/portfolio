import { useState } from 'react';
import { Button, Stack, Text, TextInput, Title } from '@mantine/core';
import ColombiaRegionesMap from './ColombiaRegionesMap';
import AutocompleteInput from './AutocompleteInput';
import './ProjectForm.css';

export default function ProjectForm({
  onSubmit,
  submitting = false,
  submitMessage = '',
  cartEmpty = false,
  asesor = '',
  clientOptions = [],
  name: nameProp,
  setName: setNameProp,
  client: clientProp,
  setClient: setClientProp,
  region: regionProp,
  setRegion: setRegionProp,
  draftHydrated = true,
}) {
  const [nameI, setNameI] = useState('');
  const [clientI, setClientI] = useState('');
  const [regionI, setRegionI] = useState('');

  const name = nameProp !== undefined ? nameProp : nameI;
  const setName = setNameProp ?? setNameI;
  const client = clientProp !== undefined ? clientProp : clientI;
  const setClient = setClientProp ?? setClientI;
  const region = regionProp !== undefined ? regionProp : regionI;
  const setRegion = setRegionProp ?? setRegionI;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, client, region });
  };

  if (!draftHydrated) return null;

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <Stack gap="md">
        <Title order={3}>Datos del proyecto</Title>
        <TextInput
          label={
            <span className="project-form-label-row">
              Nombre del proyecto{' '}
              <span className="project-form-required" aria-hidden>
                *
              </span>
            </span>
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del proyecto"
        />
        <label>
          Cliente
          <AutocompleteInput
            value={client}
            onChange={(e) => setClient(e.target.value)}
            options={clientOptions}
            placeholder="Cliente"
            name="client"
          />
        </label>
        <TextInput
          label="Asesor"
          value={asesor}
          readOnly
          tabIndex={-1}
          placeholder="—"
          styles={{ input: { cursor: 'default' } }}
        />
        <label className="project-form-label-row project-form-label-row--block">
          <span>
            Región <span className="project-form-required">*</span>
          </span>
          <div className="project-form-map">
            <ColombiaRegionesMap value={region} onChange={setRegion} singleSelect />
          </div>
          {!region && <span className="project-form-hint">Seleccione una región en el mapa</span>}
        </label>

        {submitMessage && (
          <Text size="sm" className="project-form-message" c={submitMessage.includes('correctamente') ? 'green' : 'red'}>
            {submitMessage}
          </Text>
        )}

        <Button type="submit" className="project-form-btn" color="brand" loading={submitting} disabled={cartEmpty || !region}>
          {submitting ? 'Enviando...' : 'Crear proyecto'}
        </Button>
      </Stack>
    </form>
  );
}
