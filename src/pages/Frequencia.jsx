import { Card } from 'react-bootstrap';
import { ClipboardList } from 'lucide-react';

export default function Frequencia() {
  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <ClipboardList size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Frequência</h5>
      </div>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 text-muted small">Em construção...</Card.Body>
      </Card>
    </div>
  );
}
