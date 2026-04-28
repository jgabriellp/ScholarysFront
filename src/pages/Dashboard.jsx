import { Card, Row, Col } from 'react-bootstrap';
import { Users, GraduationCap, BookOpen, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const cards = [
  { label: 'Turmas', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Alunos', icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Disciplinas', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Frequências', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-4">
        <h5 className="fw-bold text-slate-800 mb-0">Olá, {user.nome}!</h5>
        <p className="text-muted small mb-0">
          Perfil: {ROLE_LABELS[user.role]} — Bem-vindo ao Scholarys.
        </p>
      </div>

      <Row className="g-3">
        {cards.map(({ label, icon: Icon, color, bg }) => (
          <Col key={label} xs={12} sm={6} xl={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center gap-3 p-4">
                <div className={`rounded-3 p-3 ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <p className="text-muted small mb-0">{label}</p>
                  <p className="fw-semibold text-dark mb-0">—</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
