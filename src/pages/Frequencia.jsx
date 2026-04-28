import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { ClipboardList } from 'lucide-react';
import { getFrequenciaByTurmaData, lancaFrequencia } from '../api/frequencia';
import { getTurmas } from '../api/turmas';
import { getAnoLetivos } from '../api/anoLetivo';
import { getAlunosByTurma } from '../api/alunos';

export default function Frequencia() {
  const today = new Date().toISOString().split('T')[0];

  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState('');
  const [data, setData] = useState(today);
  const [alunos, setAlunos] = useState([]);
  const [presencas, setPresencas] = useState({});
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getTurmas(), getAnoLetivos()])
      .then(([turmasRes, anosRes]) => {
        setTurmas(turmasRes.data.data);
        setAnosLetivos(anosRes.data.data);
        if (anosRes.data.data.length > 0) {
          setAnoLetivoSelecionado(String(anosRes.data.data[0].id));
        }
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  useEffect(() => {
    if (!turmaSelecionada) {
      setAlunos([]);
      setPresencas({});
      return;
    }

    let cancelled = false;
    setLoadingAlunos(true);
    setSuccess('');

    async function load() {
      try {
        const { data: alunosData } = await getAlunosByTurma(turmaSelecionada);
        if (cancelled) return;

        setAlunos(alunosData);
        const defaults = Object.fromEntries(alunosData.map((a) => [a.id, true]));

        try {
          const { data: freq } = await getFrequenciaByTurmaData(turmaSelecionada, data);
          if (cancelled) return;
          freq.alunos.forEach((a) => { defaults[a.alunoId] = a.presente; });
        } catch { /* sem registro para esta data — mantém todos presentes */ }

        setPresencas(defaults);
      } finally {
        if (!cancelled) setLoadingAlunos(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [turmaSelecionada, data]);

  function togglePresenca(alunoId) {
    setPresencas((prev) => ({ ...prev, [alunoId]: !prev[alunoId] }));
  }

  function marcarTodos(presente) {
    setPresencas(Object.fromEntries(alunos.map((a) => [a.id, presente])));
  }

  async function handleSave() {
    if (!turmaSelecionada || !anoLetivoSelecionado || !data || alunos.length === 0) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await lancaFrequencia({
        turmaId: Number(turmaSelecionada),
        anoLetivoId: Number(anoLetivoSelecionado),
        data,
        alunos: alunos.map((a) => ({ alunoId: a.id, presente: presencas[a.id] ?? true })),
      });
      setSuccess('Frequência registrada com sucesso!');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar frequência.');
    } finally {
      setSaving(false);
    }
  }

  const totalPresentes = Object.values(presencas).filter(Boolean).length;
  const totalFaltas = alunos.length - totalPresentes;

  if (loadingSelects) {
    return <div className="text-center p-5"><Spinner variant="primary" /></div>;
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <ClipboardList size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Frequência</h5>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Turma</Form.Label>
                <Form.Select
                  value={turmaSelecionada}
                  onChange={(e) => setTurmaSelecionada(e.target.value)}
                >
                  <option value="">Selecione a turma</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">Ano Letivo</Form.Label>
                <Form.Select
                  value={anoLetivoSelecionado}
                  onChange={(e) => setAnoLetivoSelecionado(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {anosLetivos.map((a) => (
                    <option key={a.id} value={a.id}>{a.ano}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">Data</Form.Label>
                <Form.Control
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!turmaSelecionada ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Selecione uma turma para registrar a frequência.
          </Card.Body>
        </Card>
      ) : loadingAlunos ? (
        <div className="text-center p-5"><Spinner variant="primary" /></div>
      ) : alunos.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Nenhum aluno cadastrado nesta turma.
          </Card.Body>
        </Card>
      ) : (
        <>
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

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom py-3 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-3 small">
                  <span className="text-muted">
                    Total: <strong className="text-dark">{alunos.length}</strong>
                  </span>
                  <span className="text-success">
                    Presentes: <strong>{totalPresentes}</strong>
                  </span>
                  <span className="text-danger">
                    Faltas: <strong>{totalFaltas}</strong>
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Button size="sm" variant="outline-secondary" onClick={() => marcarTodos(true)}>
                    Todos presentes
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => marcarTodos(false)}>
                    Todos faltaram
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || !anoLetivoSelecionado}
                  >
                    {saving && <Spinner size="sm" className="me-1" />}
                    Salvar
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4" style={{ width: 60 }}>Nº</th>
                    <th>Nome</th>
                    <th style={{ width: 180 }}>Presença</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => {
                    const presente = presencas[aluno.id] ?? true;
                    return (
                      <tr key={aluno.id} className={!presente ? 'table-danger' : ''}>
                        <td className="ps-4 text-muted">{aluno.numeroChamada}</td>
                        <td className="fw-medium">{aluno.nome}</td>
                        <td>
                          <Form.Check
                            type="switch"
                            id={`switch-${aluno.id}`}
                            checked={presente}
                            onChange={() => togglePresenca(aluno.id)}
                            label={
                              presente
                                ? <span className="text-success small fw-medium">Presente</span>
                                : <span className="text-danger small fw-medium">Falta</span>
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
