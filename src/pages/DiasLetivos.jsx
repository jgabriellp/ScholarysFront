import { useState, useEffect } from 'react';
import { Card, Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { CalendarDays } from 'lucide-react';
import { getDiasLetivosByAno, createDiasLetivosLote, deleteDiaLetivo } from '../api/diasLetivos';
import { getAnoLetivos } from '../api/anoLetivo';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function pad(n) { return String(n).padStart(2, '0'); }

function MonthCalendar({ year, month, savedMap, pendingAdd, pendingRemove, onToggle, canEdit }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-bottom py-2 px-3 text-center">
        <small className="fw-semibold text-slate-700">{MESES[month]}</small>
      </Card.Header>
      <Card.Body className="p-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DIAS_SEMANA.map((d, i) => (
            <div
              key={d}
              className="text-center"
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: '2px 0',
                color: i === 0 || i === 6 ? '#adb5bd' : '#6c757d',
              }}
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const saved = savedMap.get(dateStr);
            const isAdd = pendingAdd.has(dateStr);
            const isRemove = saved && pendingRemove.has(saved.id);
            const isWeekend = (i % 7 === 0 || i % 7 === 6);

            let bg = isWeekend ? '#f1f3f5' : '#f8f9fa';
            let color = isWeekend ? '#adb5bd' : '#212529';

            if (saved && !isRemove) { bg = '#0d6efd'; color = 'white'; }
            else if (isAdd) { bg = '#6ea8fe'; color = 'white'; }
            else if (isRemove) { bg = '#f1aeb5'; color = '#842029'; }

            return (
              <button
                key={dateStr}
                onClick={() => canEdit && onToggle(dateStr, saved ?? null)}
                style={{
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 0',
                  fontSize: 11,
                  lineHeight: 1.2,
                  background: bg,
                  color,
                  cursor: canEdit ? 'pointer' : 'default',
                  textAlign: 'center',
                  fontWeight: (saved && !isRemove) || isAdd ? 600 : 400,
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}

export default function DiasLetivos() {
  const { user } = useAuth();
  const canEdit = user.role === ROLES.Admin;
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [anoAtual, setAnoAtual] = useState(null);
  const [savedDays, setSavedDays] = useState([]);
  const [pendingAdd, setPendingAdd] = useState(new Set());
  const [pendingRemove, setPendingRemove] = useState(new Set());

  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingDias, setLoadingDias] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getAnoLetivos()
      .then(({ data }) => {
        setAnosLetivos(data.data);
        if (data.data.length > 0) setAnoSelecionado(String(data.data[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  useEffect(() => {
    setSavedDays([]);
    setPendingAdd(new Set());
    setPendingRemove(new Set());
    setSuccess('');
    setError('');
    if (!anoSelecionado) return;

    const ano = anosLetivos.find((a) => String(a.id) === anoSelecionado);
    setAnoAtual(ano ?? null);

    setLoadingDias(true);
    getDiasLetivosByAno(anoSelecionado)
      .then(({ data }) => setSavedDays(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => setSavedDays([]))
      .finally(() => setLoadingDias(false));
  }, [anoSelecionado]);

  // dateStr → { id, data }
  const savedMap = new Map(
    savedDays.map((d) => [d.data.substring(0, 10), d])
  );

  function toggle(dateStr, saved) {
    if (saved) {
      setPendingRemove((prev) => {
        const next = new Set(prev);
        if (next.has(saved.id)) next.delete(saved.id); else next.add(saved.id);
        return next;
      });
    } else {
      setPendingAdd((prev) => {
        const next = new Set(prev);
        if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
        return next;
      });
    }
  }

  async function handleSave() {
    if (pendingAdd.size === 0 && pendingRemove.size === 0) return;
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const ops = [];
      if (pendingAdd.size > 0) {
        ops.push(
          createDiasLetivosLote({
            anoLetivoId: Number(anoSelecionado),
            datas: [...pendingAdd],
          })
        );
      }
      for (const id of pendingRemove) ops.push(deleteDiaLetivo(id));
      await Promise.all(ops);

      const { data } = await getDiasLetivosByAno(anoSelecionado);
      setSavedDays(Array.isArray(data) ? data : (data.data ?? []));
      setPendingAdd(new Set());
      setPendingRemove(new Set());
      setSuccess('Calendário salvo com sucesso!');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar o calendário.');
    } finally {
      setSaving(false);
    }
  }

  const year = Number(anoAtual?.ano ?? new Date().getFullYear());
  const hasChanges = pendingAdd.size > 0 || pendingRemove.size > 0;
  const totalSalvos = savedDays.length + pendingAdd.size - pendingRemove.size;

  if (loadingSelects) return <div className="text-center p-5"><Spinner variant="primary" /></div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <CalendarDays size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Dias Letivos</h5>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={handleSave} disabled={!hasChanges || saving}>
            {saving && <Spinner size="sm" className="me-1" />}
            Salvar Calendário
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <div className="d-flex flex-wrap align-items-center gap-4">
            <Form.Group style={{ minWidth: 160 }}>
              <Form.Label className="small fw-medium mb-1">Ano Letivo</Form.Label>
              <Form.Select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(e.target.value)}
                style={{ maxWidth: 160 }}
              >
                {anosLetivos.map((a) => (
                  <option key={a.id} value={a.id}>{a.ano}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-3 small align-items-center" style={{ marginTop: 22 }}>
              <span className="text-muted">
                Total: <strong className="text-dark">{totalSalvos}</strong> dia(s) letivo(s)
              </span>
              <span className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#0d6efd', display: 'inline-block' }} />
                <span className="text-muted">Letivo</span>
              </span>
              <span className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#6ea8fe', display: 'inline-block' }} />
                <span className="text-muted">A adicionar</span>
              </span>
              <span className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f1aeb5', display: 'inline-block' }} />
                <span className="text-muted">A remover</span>
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {success && (
        <Alert variant="success" className="py-2 small mb-3" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="py-2 small mb-3" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loadingDias ? (
        <div className="text-center p-5"><Spinner variant="primary" /></div>
      ) : (
        <Row className="g-3">
          {Array.from({ length: 12 }, (_, m) => (
            <Col key={m} xs={12} sm={6} md={4} lg={3}>
              <MonthCalendar
                year={year}
                month={m}
                savedMap={savedMap}
                pendingAdd={pendingAdd}
                pendingRemove={pendingRemove}
                onToggle={toggle}
                canEdit={canEdit}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
