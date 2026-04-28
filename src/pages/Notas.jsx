import { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Star } from 'lucide-react';
import { getNotasByTurmaDisciplinaAno, lancaNota } from '../api/notas';
import { getTurmas } from '../api/turmas';
import { getDisciplinas } from '../api/disciplinas';
import { getAnoLetivos } from '../api/anoLetivo';
import { getAlunosByTurma } from '../api/alunos';

const UNIDADES = [
  { value: 1, label: 'Unidade 1 — 1º Semestre' },
  { value: 2, label: 'Unidade 2 — 1º Semestre' },
  { value: 3, label: 'Unidade 3 — 1º Semestre' },
  { value: 4, label: 'Unidade 4 — 2º Semestre' },
  { value: 5, label: 'Unidade 5 — 2º Semestre' },
  { value: 6, label: 'Unidade 6 — 2º Semestre' },
  { value: 7, label: 'Recuperação Final' },
];

export default function Notas() {
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState('');
  const [unidade, setUnidade] = useState('1');
  const [alunos, setAlunos] = useState([]);
  const [notasInput, setNotasInput] = useState({});
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getTurmas(), getDisciplinas(), getAnoLetivos()])
      .then(([t, d, a]) => {
        setTurmas(t.data.data);
        setDisciplinas(d.data.data);
        setAnosLetivos(a.data.data);
        if (d.data.data.length > 0) setDisciplinaSelecionada(String(d.data.data[0].id));
        if (a.data.data.length > 0) setAnoLetivoSelecionado(String(a.data.data[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  useEffect(() => {
    if (!turmaSelecionada || !disciplinaSelecionada || !anoLetivoSelecionado) return;

    let cancelled = false;
    setLoading(true);
    setSuccess('');

    async function load() {
      try {
        const [alunosRes, notasRes] = await Promise.all([
          getAlunosByTurma(turmaSelecionada),
          getNotasByTurmaDisciplinaAno(turmaSelecionada, disciplinaSelecionada, anoLetivoSelecionado),
        ]);

        if (cancelled) return;

        const alunosData = alunosRes.data;
        setAlunos(alunosData);

        const notasDaUnidade = notasRes.data.filter((n) => n.unidade === Number(unidade));
        const notasMap = Object.fromEntries(notasDaUnidade.map((n) => [n.alunoId, String(n.valor)]));

        const inputs = {};
        alunosData.forEach((a) => { inputs[a.id] = notasMap[a.id] ?? ''; });
        setNotasInput(inputs);
      } catch {
        if (!cancelled) { setAlunos([]); setNotasInput({}); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [turmaSelecionada, disciplinaSelecionada, anoLetivoSelecionado, unidade]);

  function setNota(alunoId, valor) {
    setNotasInput((prev) => ({ ...prev, [alunoId]: valor }));
  }

  async function handleSave() {
    const alunosComNota = alunos.filter(
      (a) => notasInput[a.id] !== '' && notasInput[a.id] !== undefined
    );

    if (alunosComNota.length === 0) {
      setError('Nenhuma nota preenchida.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await Promise.all(
        alunosComNota.map((a) =>
          lancaNota({
            alunoId: a.id,
            disciplinaId: Number(disciplinaSelecionada),
            turmaId: Number(turmaSelecionada),
            anoLetivoId: Number(anoLetivoSelecionado),
            unidade: Number(unidade),
            valor: Number(notasInput[a.id]),
          })
        )
      );
      setSuccess(`${alunosComNota.length} nota(s) salva(s) com sucesso!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar notas.');
    } finally {
      setSaving(false);
    }
  }

  const prontoParaLancar = turmaSelecionada && disciplinaSelecionada && anoLetivoSelecionado;

  if (loadingSelects) {
    return <div className="text-center p-5"><Spinner variant="primary" /></div>;
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Star size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Notas</h5>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={3}>
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
                <Form.Label className="small fw-medium">Disciplina</Form.Label>
                <Form.Select
                  value={disciplinaSelecionada}
                  onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
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
                <Form.Label className="small fw-medium">Unidade</Form.Label>
                <Form.Select value={unidade} onChange={(e) => setUnidade(e.target.value)}>
                  {UNIDADES.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!prontoParaLancar ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Selecione turma, disciplina e ano letivo para lançar as notas.
          </Card.Body>
        </Card>
      ) : loading ? (
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
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4">
              <small className="text-muted">
                {alunos.length} aluno(s) — insira 0 a 10 por aluno
              </small>
              <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
                {saving && <Spinner size="sm" className="me-1" />}
                Salvar Notas
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4" style={{ width: 60 }}>Nº</th>
                    <th>Nome</th>
                    <th style={{ width: 160 }}>Nota (0 – 10)</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => {
                    const val = notasInput[aluno.id] ?? '';
                    const numVal = Number(val);
                    const reprovado = val !== '' && numVal < 6;
                    return (
                      <tr key={aluno.id}>
                        <td className="ps-4 text-muted">{aluno.numeroChamada}</td>
                        <td className="fw-medium">{aluno.nome}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            size="sm"
                            style={{ width: 100 }}
                            value={val}
                            onChange={(e) => setNota(aluno.id, e.target.value)}
                            className={reprovado ? 'border-danger text-danger' : ''}
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
