import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Paper, PasswordInput, Stack, Text, TextInput, Title, Accordion } from '@mantine/core';
import { useUser } from '../context/UserContext';
import './Login.css';

const DEMO_ACCOUNTS = [
  { email: 'admin@app.local', role: 'Admin' },
  { email: 'quoter@app.local', role: 'Cotizador' },
  { email: 'designer@app.local', role: 'Diseñador' },
  { email: 'development@app.local', role: 'Desarrollo' },
  { email: 'sales@app.local', role: 'Comercial' },
];

function roleToPath(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'QUOTER') return '/cotizador';
  if (role === 'SALES') return '/comercial';
  if (role === 'DEVELOPMENT') return '/desarrollo';
  return '/disenador';
}

export default function Login() {
  const { signIn, user, isLoading } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user && !isLoading) {
    navigate(roleToPath(user.role), { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = await signIn({ email, password });
      navigate(roleToPath(u?.role), { replace: true });
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión');
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('1234');
    setError('');
  };

  return (
    <div className="login-page">
      <Paper className="login-card" shadow="md" radius="md" withBorder>
        <Stack gap="lg">
          <div>
            <Title order={1} className="login-title" ta="center">
              APPLICATION
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Gestiona tus productos/proyectos
            </Text>
          </div>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error ? (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              ) : null}
              <TextInput
                label="Email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth loading={isLoading}>
                Entrar
              </Button>
            </Stack>
          </form>
          <Accordion variant="contained" radius="md">
            <Accordion.Item value="demo">
              <Accordion.Control>
                <Text size="xs" c="dimmed">Cuentas de demostración</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap={6}>
                  {DEMO_ACCOUNTS.map((a) => (
                    <Button
                      key={a.email}
                      variant="subtle"
                      size="compact-xs"
                      justify="space-between"
                      fullWidth
                      onClick={() => fillDemo(a.email)}
                    >
                      <Text size="xs" span>{a.email}</Text>
                      <Text size="xs" c="dimmed" span>{a.role}</Text>
                    </Button>
                  ))}
                  <Text size="xs" c="dimmed" ta="center" mt={4}>
                    Contraseña: 1234
                  </Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Paper>
    </div>
  );
}
