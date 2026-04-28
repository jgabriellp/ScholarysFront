import { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FileText } from 'lucide-react';
import { getDiarioMaternal, getDiarioFundamental } from '../api/diario';
import { getTurmas } from '../api/turmas';
import { getAnoLetivos } from '../api/anoLetivo';
import { getAlunosByTurma } from '../api/alunos';
import { SEGMENTOS, SEGMENTO_LABELS } from '../utils/constants';

function fmt(valor) {
  if (valor == null) return '—';
  return Number(valor).toFixed(1);
}

function NotaCell({ valor }) {
  if (valor == null) return <span className="text-muted small">—</span>;
  const aprovado = valor >= 6;
  return (
    <span className={`fw-medium small ${aprovado ? 'text-success' : 'text-danger'}`}>
      {fmt(valor)}
    </span>
  );
}

function FreqBadge({ freq }) {
  const bg = freq >= 75 ? 'success' : freq >= 50 ? 'warning' : 'danger';
  return <Badge bg={bg}>{fmt(freq)}%</Badge>;
}

function FrequenciaSection({ frequencia }) {
  if (!frequencia) return null;
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Header className="bg-white border-bottom py-2 px-4 d-flex justify-content-between align-items-center">
        <small className="fw-semibold text-slate-700">Frequência</small>
        <div className="d-flex align-items-center gap-3">
          <FreqBadge freq={frequencia.frequencia} />
          <small className="text-muted">{frequencia.totalFaltas} falta(s)</small>
        </div>
      </Card.Header>
      <Card.Body className="p-3">
        {frequencia.meses.length === 0 ? (
          <p className="text-muted small mb-0">Nenhuma frequência registrada.</p>
        ) : (
          <Row className="g-2">
            {frequencia.meses.map((mes) => {
              const diasFalta = Object.entries(mes.dias)
                .filter(([, presente]) => presente === false)
                .map(([dia]) => dia)
                .sort((a, b) => Number(a) - Number(b));

              return (
                <Col key={mes.mes} xs={12} sm={6} md={4}>
                  <div className="border rounded p-2">
                    <p className="fw-medium small mb-1">{mes.mesNome}</p>
                    <p className="text-muted small mb-0">
                      {mes.totalFaltas === 0
                        ? 'Sem faltas'
                        : `${mes.totalFaltas} falta(s) — dias: ${diasFalta.join(', ')}`}
                    </p>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}

function NotasFundamental({ notas, resultado }) {
  if (!notas || notas.length === 0) return null;
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Header className="bg-white border-bottom py-2 px-4 d-flex justify-content-between align-items-center">
        <small className="fw-semibold text-slate-700">Notas</small>
        {resultado && (
          <Badge bg={resultado === 'Aprovado' ? 'success' : 'danger'}>{resultado}</Badge>
        )}
      </Card.Header>
      <Card.Body className="p-0">
        <Table responsive className="mb-0 small">
          <thead className="table-light">
            <tr>
              <th className="ps-4">Disciplina</th>
              <th>U1</th><th>U2</th><th>U3</th>
              <th className="text-primary">M1°</th>
              <th>U4</th><th>U5</th><th>U6</th>
              <th className="text-primary">M2°</th>
              <th className="text-primary">M.Anual</th>
              <th>Rec</th>
              <th className="text-primary">M.Final</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((n) => (
              <tr key={n.disciplinaId}>
                <td className="ps-4 fw-medium">{n.disciplinaNome}</td>
                <td><NotaCell valor={n.unidade1} /></td>
                <td><NotaCell valor={n.unidade2} /></td>
                <td><NotaCell valor={n.unidade3} /></td>
                <td><NotaCell valor={n.media1Semestre} /></td>
                <td><NotaCell valor={n.unidade4} /></td>
                <td><NotaCell valor={n.unidade5} /></td>
                <td><NotaCell valor={n.unidade6} /></td>
                <td><NotaCell valor={n.media2Semestre} /></td>
                <td><NotaCell valor={n.mediaAnual} /></td>
                <td><NotaCell valor={n.notaRecuperacao} /></td>
                <td><NotaCell valor={n.mediaFinal} /></td>
                <td>
                  {n.resultado
                    ? <Badge bg={n.resultado === 'Aprovado' ? 'success' : 'danger'} className="small">{n.resultado}</Badge>
                    : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

function DesenvolvimentosMaternal({ desenvolvimentos }) {
  if (!desenvolvimentos || desenvolvimentos.length === 0) return null;
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Header className="bg-white border-bottom py-2 px-4">
        <small className="fw-semibold text-slate-700">Desenvolvimento por Bimestre</small>
      </Card.Header>
      <Card.Body className="p-3">
        <Row className="g-3">
          {[1, 2, 3, 4].map((b) => {
            const dev = desenvolvimentos.find((d) => d.bimestre === b);
            return (
              <Col key={b} xs={12} md={6}>
                <div className="border rounded p-3">
                  <p className="fw-medium small mb-1">{b}º Bimestre</p>
                  <p className="text-muted small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                    {dev ? dev.descricao : <em>Não registrado</em>}
                  </p>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card.Body>
    </Card>
  );
}

export default function Diario() {
  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState('');
  const [diario, setDiario] = useState(null);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingDiario, setLoadingDiario] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([getTurmas(), getAnoLetivos()])
      .then(([t, a]) => {
        setTurmas(t.data.data);
        setAnosLetivos(a.data.data);
        if (a.data.data.length > 0) setAnoLetivoSelecionado(String(a.data.data[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  useEffect(() => {
    setAlunos([]);
    setAlunoSelecionado('');
    setDiario(null);
    if (!turmaSelecionada) return;

    setLoadingAlunos(true);
    getAlunosByTurma(turmaSelecionada)
      .then(({ data }) => setAlunos(data))
      .catch(() => setAlunos([]))
      .finally(() => setLoadingAlunos(false));
  }, [turmaSelecionada]);

  useEffect(() => {
    setDiario(null);
    setErro('');
    if (!alunoSelecionado || !anoLetivoSelecionado) return;

    const turma = turmas.find((t) => String(t.id) === String(turmaSelecionada));
    if (!turma) return;

    const loadFn = turma.segmento === SEGMENTOS.Maternal ? getDiarioMaternal : getDiarioFundamental;

    setLoadingDiario(true);
    loadFn(alunoSelecionado, anoLetivoSelecionado)
      .then(({ data }) => setDiario(data))
      .catch(() => setErro('Não foi possível carregar o diário.'))
      .finally(() => setLoadingDiario(false));
  }, [alunoSelecionado, anoLetivoSelecionado]);

  const turmaAtual = turmas.find((t) => String(t.id) === String(turmaSelecionada));
  const segmento = turmaAtual?.segmento;

  if (loadingSelects) {
    return <div className="text-center p-5"><Spinner variant="primary" /></div>;
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <FileText size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Diário</h5>
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
                    <option key={t.id} value={t.id}>
                      {t.nome} — {SEGMENTO_LABELS[t.segmento]}
                    </option>
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
            Selecione turma e aluno para visualizar o diário.
          </Card.Body>
        </Card>
      ) : loadingDiario ? (
        <div className="text-center p-5"><Spinner variant="primary" /></div>
      ) : erro ? (
        <Alert variant="danger" className="py-2 small">{erro}</Alert>
      ) : diario ? (
        <>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="py-3 px-4">
              <Row className="g-2">
                <Col xs={12} md={6}>
                  <p className="fw-bold fs-6 mb-1">{diario.alunoNome}</p>
                  <p className="text-muted small mb-0">
                    Nº {diario.numeroChamada} · {diario.turmaNome} · {diario.anoLetivo}
                  </p>
                </Col>
                <Col xs={12} md={6} className="d-flex align-items-center justify-content-md-end gap-2">
                  <Badge bg={segmento === SEGMENTOS.Maternal ? 'warning' : 'primary'}>
                    {SEGMENTO_LABELS[segmento]}
                  </Badge>
                  {diario.resultado && (
                    <Badge bg={diario.resultado === 'Aprovado' ? 'success' : 'danger'}>
                      {diario.resultado}
                    </Badge>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <FrequenciaSection frequencia={diario.frequencia} />

          {segmento === SEGMENTOS.Fundamental && (
            <NotasFundamental notas={diario.notas} resultado={diario.resultado} />
          )}

          {segmento === SEGMENTOS.Maternal && (
            <DesenvolvimentosMaternal desenvolvimentos={diario.desenvolvimentos} />
          )}
        </>
      ) : null}
    </div>
  );
}
