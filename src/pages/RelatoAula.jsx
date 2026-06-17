import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { NotebookPen, Printer } from "lucide-react";
import { getRelatosByTurmaAno, saveRelato } from "../api/relatoAula";
import { getDiasLetivosByAno } from "../api/diasLetivos";
import { getTurmasByAnoLetivo, getTurmasByProfessor } from "../api/turmas";
import { getAnosLetivosAccessivel } from "../api/anoLetivo";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../utils/constants";

function fmtData(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

function fmtDiaSemana(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
  });
}

export default function RelatoAula() {
  const { user } = useAuth();
  const canEdit = user.role === ROLES.Admin || user.role === ROLES.Professor;

  const [anosLetivos, setAnosLetivos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [diasLetivos, setDiasLetivos] = useState([]);
  const [relatos, setRelatos] = useState([]);

  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");

  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingConteudo, setLoadingConteudo] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalDia, setModalDia] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Mount: anos letivos
  useEffect(() => {
    getAnosLetivosAccessivel()
      .then((anos) => {
        setAnosLetivos(anos);
        if (anos.length > 0) setAnoSelecionado(String(anos[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  // Ano letivo → turmas
  useEffect(() => {
    setTurmas([]);
    setTurmaSelecionada("");
    setDiasLetivos([]);
    setRelatos([]);
    if (!anoSelecionado) return;

    setLoadingTurmas(true);
    const fetch =
      user.role === ROLES.Professor
        ? getTurmasByProfessor(user.id, anoSelecionado)
        : getTurmasByAnoLetivo(anoSelecionado);
    fetch
      .then(({ data }) =>
        setTurmas(Array.isArray(data) ? data : (data.data ?? [])),
      )
      .catch(() => setTurmas([]))
      .finally(() => setLoadingTurmas(false));
  }, [anoSelecionado]);

  // Turma → dias letivos + relatos
  useEffect(() => {
    setDiasLetivos([]);
    setRelatos([]);
    if (!turmaSelecionada || !anoSelecionado) return;

    setLoadingConteudo(true);
    Promise.all([
      getDiasLetivosByAno(anoSelecionado),
      getRelatosByTurmaAno(turmaSelecionada, anoSelecionado),
    ])
      .then(([diasRes, relatosRes]) => {
        setDiasLetivos(
          Array.isArray(diasRes.data)
            ? diasRes.data
            : (diasRes.data.data ?? []),
        );
        setRelatos(
          Array.isArray(relatosRes.data)
            ? relatosRes.data
            : (relatosRes.data.data ?? []),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingConteudo(false));
  }, [turmaSelecionada, anoSelecionado]);

  const relatoMap = new Map(relatos.map((r) => [r.diaLetivoId, r]));

  function openModal(dia) {
    setModalDia(dia);
    const existing = relatoMap.get(dia.id);
    setDescricao(existing?.descricao ?? "");
    setSaveError("");
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveRelato({
        diaLetivoId: modalDia.id,
        turmaId: Number(turmaSelecionada),
        professorId: user.id,
        descricao: descricao.trim(),
      });
      const { data } = await getRelatosByTurmaAno(
        turmaSelecionada,
        anoSelecionado,
      );
      setRelatos(Array.isArray(data) ? data : (data.data ?? []));
      setShowModal(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Erro ao salvar o relato.");
    } finally {
      setSaving(false);
    }
  }

  function exportarPDF() {
    const turma = turmas.find((t) => String(t.id) === turmaSelecionada);
    const ano = anosLetivos.find((a) => String(a.id) === anoSelecionado);

    const rows = diasLetivos
      .map((dia, i) => {
        const dateStr = dia.data.substring(0, 10);
        const relato = relatoMap.get(dia.id);
        const descricao = relato?.descricao ?? "";
        return `<tr>
          <td>${fmtData(dateStr)}</td>
          <td style="text-align:center">${i + 1}</td>
          <td>${descricao.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</td>
          <td></td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relato de Aula</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; color: #212529; }
    h2 { margin: 0 0 4px; font-size: 15px; }
    p.subtitulo { margin: 0 0 14px; font-size: 10px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #0d6efd; color: #fff; padding: 6px 8px; font-size: 10px; text-align: left; border: 1px solid #0a58ca; }
    td { border: 1px solid #dee2e6; padding: 5px 8px; vertical-align: top; font-size: 10px; }
    tr:nth-child(even) td { background: #f8f9fa; }
    th:nth-child(1), td:nth-child(1) { width: 62px; white-space: nowrap; }
    th:nth-child(2), td:nth-child(2) { width: 46px; text-align: center; }
    th:nth-child(4), td:nth-child(4) { width: 72px; }
  </style>
</head>
<body>
  <h2>Relato de Aula</h2>
  <p class="subtitulo">Turma: <strong>${turma?.nome ?? ""}</strong> &nbsp;|&nbsp; Ano Letivo: <strong>${ano?.ano ?? ""}</strong></p>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Nº da Aula</th>
        <th>Resumo de Atividade</th>
        <th>Rúbrica</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
  }

  const totalRegistrados = relatos.length;
  const totalPendentes = diasLetivos.length - totalRegistrados;

  if (loadingSelects)
    return (
      <div className="text-center p-5">
        <Spinner variant="primary" />
      </div>
    );

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <NotebookPen size={20} className="text-slate-600" />
        <h5 className="fw-bold text-slate-800 mb-0">Relato de Aula</h5>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Ano Letivo</Form.Label>
                <Form.Select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(e.target.value)}
                >
                  {anosLetivos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ano}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Turma</Form.Label>
                {loadingTurmas ? (
                  <div className="d-flex align-items-center gap-2 pt-1">
                    <Spinner size="sm" variant="secondary" />
                    <small className="text-muted">Carregando...</small>
                  </div>
                ) : (
                  <Form.Select
                    value={turmaSelecionada}
                    onChange={(e) => setTurmaSelecionada(e.target.value)}
                    disabled={turmas.length === 0}
                  >
                    <option value="">Selecione a turma</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!turmaSelecionada ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Selecione o ano letivo e a turma para ver os dias letivos.
          </Card.Body>
        </Card>
      ) : loadingConteudo ? (
        <div className="text-center p-5">
          <Spinner variant="primary" />
        </div>
      ) : diasLetivos.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Nenhum dia letivo cadastrado para este ano. Configure em{" "}
            <strong>Dias Letivos</strong>.
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom py-3 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-4 small">
                <span className="text-muted">
                  Total:{" "}
                  <strong className="text-dark">{diasLetivos.length}</strong>
                </span>
                <span className="text-success">
                  Registrados: <strong>{totalRegistrados}</strong>
                </span>
                <span className="text-warning">
                  Pendentes: <strong>{totalPendentes}</strong>
                </span>
              </div>
              <Button
                size="sm"
                size="md"
                className="d-flex align-items-center justify-content-between mb-4"
                variant="outline-secondary"
                onClick={exportarPDF}
              >
                <Printer size={14} className="me-1" />
                Exportar PDF
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Data</th>
                  <th>Dia da semana</th>
                  <th>Status</th>
                  <th>Relato</th>
                  {canEdit && <th style={{ width: 120 }}>Ação</th>}
                </tr>
              </thead>
              <tbody>
                {diasLetivos.map((dia) => {
                  const dateStr = dia.data.substring(0, 10);
                  const relato = relatoMap.get(dia.id);
                  return (
                    <tr key={dia.id}>
                      <td className="ps-4 fw-medium">{fmtData(dateStr)}</td>
                      <td
                        className="text-muted small"
                        style={{ textTransform: "capitalize" }}
                      >
                        {fmtDiaSemana(dateStr)}
                      </td>
                      <td>
                        {relato ? (
                          <Badge bg="success">Registrado</Badge>
                        ) : (
                          <Badge bg="secondary">Pendente</Badge>
                        )}
                      </td>
                      <td
                        className="text-muted small"
                        style={{
                          maxWidth: 340,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {relato?.descricao ?? "—"}
                      </td>
                      {canEdit && (
                        <td>
                          <Button
                            size="sm"
                            variant={
                              relato ? "outline-secondary" : "outline-primary"
                            }
                            onClick={() => openModal(dia)}
                          >
                            {relato ? "Editar" : "Registrar"}
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              Relato de Aula —{" "}
              {modalDia && fmtData(modalDia.data.substring(0, 10))}
              {modalDia && (
                <span
                  className="text-muted fw-normal ms-2 small"
                  style={{ textTransform: "capitalize" }}
                >
                  ({fmtDiaSemana(modalDia.data.substring(0, 10))})
                </span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {saveError && (
              <Alert variant="danger" className="py-2 small">
                {saveError}
              </Alert>
            )}
            <Form.Group>
              <Form.Label className="small fw-medium">
                Descrição das atividades
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={7}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva os conteúdos e atividades trabalhados nesta aula..."
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving && <Spinner size="sm" className="me-1" />}
              Salvar Relato
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
