import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login(email, password);
      signIn(data);
      navigate('/');
    } catch {
      setError('Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card style={{ width: '100%', maxWidth: 400 }} className="border-0 shadow-sm">
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 bg-primary"
              style={{ width: 56, height: 56 }}
            >
              <GraduationCap size={26} color="white" />
            </div>
            <h5 className="fw-bold text-dark mb-0">Scholarys</h5>
            <p className="text-muted small mb-0">Sistema de Gestão Escolar</p>
          </div>

          {error && (
            <Alert variant="danger" className="py-2 small">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium">Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-medium">Senha</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading && <Spinner size="sm" className="me-2" />}
              Entrar
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
