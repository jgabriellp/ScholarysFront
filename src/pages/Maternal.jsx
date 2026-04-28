import { Card } from 'react-bootstrap';
import { Baby } from 'lucide-react';

export default function Maternal() {
  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Baby size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Desenvolvimento Maternal</h5>
      </div>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 text-muted small">Em construção...</Card.Body>
      </Card>
    </div>
  );
}
