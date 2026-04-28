import { Card } from 'react-bootstrap';
import { FileText } from 'lucide-react';

export default function Diario() {
  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <FileText size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Diário</h5>
      </div>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 text-muted small">Em construção...</Card.Body>
      </Card>
    </div>
  );
}
