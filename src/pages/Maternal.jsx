import { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Baby } from 'lucide-react';
import { getDesenvolvimentoByAlunoAno, lancaDesenvolvimento } from '../api/desenvolvimentoMaternal';
import { getTurmas } from '../api/turmas';
import { getAnoLetivos } from '../api/anoLetivo';
import { getAlunosByTurma } from '../api/alunos';
import { SEGMENTOS } from '../utils/constants';

const BIMESTRES = [1, 2, 3, 4];
const defaultBimestres = { 1: '', 2: '', 3: '', 4: '' };

export default function Maternal() {
  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [bimestres, setBimestres] = useState(defaultBimestres);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingDesenvolvimento, setLoadingDesenvolvimento] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getTurmas(), getAnoLetivos()])
      .then(([t, a]) => {
        const maternais = t.data.data.filter((turma) => turma.segmento === SEGMENTOS.Maternal);
        setTurmas(maternais);
        setAnosLetivos(a.data.data);
        if (a.data.data.length > 0) setAnoLetivoSelecionado(String(a.data.data[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  useEffect(() => {
    setAlunos([]);
    setAlunoSelecionado('');
    if (!turmaSelecionada) return;

    setLoadingAlunos(true);
    getAlunosByTurma(turmaSelecionada)
      .then(({ data }) => setAlunos(data))
      .catch(() => setAlunos([]))
      .finally(() => setLoadingAlunos(false));
  }, [turmaSelecionada]);

  useEffect(() => {
    setBimestres(defaultBimestres);
    if (!alunoSelecionado || !anoLetivoSelecionado) return;

    setLoadingDesenvolvimento(true);
    getDesenvolvimentoByAlunoAno(alunoSelecionado, anoLetivoSelecionado)
      .then(({ data }) => {
        const map = { ...defaultBimestres };
        data.forEach((d) => { map[d.bimestre] = d.descricao; });
        setBimestres(map);
      })
      .catch(() => setBimestres(defaultBimestres))
      .finally(() => setLoadingDesenvolvimento(false));
  }, [alunoSelecionado, anoLetivoSelecionado]);

  function setBimestre(num, valor) {
    setBimestres((prev) => ({ ...prev, [num]: valor }));
  }

  async function handleSave() {
    if (!alunoSelecionado || !turmaSelecionada || !anoLetivoSelecionado) return;

    const bimestresComConteudo = BIMESTRES.filter((b) => bimestres[b].trim());
    if (bimestresComConteudo.length === 0) {
      setError('Preencha ao menos um bimestre.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await Promise.all(
        bimestresComConteudo.map((b) =>
          lancaDesenvolvimento({
            alunoId: Number(alunoSelecionado),
            turmaId: Number(turmaSelecionada),
            anoLetivoId: Number(anoLetivoSelecionado),
            bimestre: b,
            descricao: bimestres[b],
          })
        )
      );
      setSuccess('Desenvolvimento salvo com sucesso!');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingSelects) {
    return <div className="text-center p-5"><Spinner variant="primary" /></div>;
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Baby size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Desenvolvimento Maternal</h5>
      </div>

      {turmas.length === 0 && (
        <Alert variant="warning" className="small py-2 mb-3">
          Nenhuma turma do segmento <strong>Maternal</strong> cadastrada.
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Turma Maternal</Form.Label>
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
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Aluno</Form.Label>
                {loadingAlunos ? (
                  <div className="d-flex align-items-center gap-2 pt-1">
                    <Spinner size="sm" variant="secondary" />
                    <small className="text-muted">Carregando...</small>
                  </div>
                ) : (
                  <Form.Select
                    value={alunoSelecionado}
                    onChange={(e) => setAlunoSelecionado(e.target.value)}
                    disabled={!turmaSelecionada}
                  >
                    <option value="">Selecione o aluno</option>
                    {alunos.map((a) => (
                      <option key={a.id} value={a.id}>{a.numeroChamada}. {a.nome}</option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!alunoSelecionado ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Selecione uma turma e um aluno para registrar o desenvolvimento.
          </Card.Body>
        </Card>
      ) : loadingDesenvolvimento ? (
        <div className="text-center p-5"><Spinner variant="primary" /></div>
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

          <Row className="g-3 mb-3">
            {BIMESTRES.map((b) => (
              <Col key={b} xs={12} md={6}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-bottom py-2 px-4">
                    <small className="fw-semibold text-slate-700">{b}º Bimestre</small>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={bimestres[b]}
                      onChange={(e) => setBimestre(b, e.target.value)}
                      placeholder="Descreva o desenvolvimento do aluno neste bimestre..."
                      style={{ resize: 'vertical' }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="d-flex justify-content-end">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" className="me-2" />}
              Salvar Desenvolvimento
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
