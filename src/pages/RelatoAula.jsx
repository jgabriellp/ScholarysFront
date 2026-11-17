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
import { getVinculosByTurma } from "../api/vinculos";
import { carregarAnosLetivos } from "../api/anoLetivo";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../utils/constants";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function fmtData(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

function fmtDiaSemana(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
  });
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Primeiro e último dia do mês (0-11) no formato "yyyy-MM-dd"
function limitesMes(ano, mes) {
  const mm = String(mes + 1).padStart(2, "0");
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  return {
    inicio: `${ano}-${mm}-01`,
    fim: `${ano}-${mm}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

function toList(data) {
  return Array.isArray(data) ? data : (data.data ?? []);
}

export default function RelatoAula() {
  const { user } = useAuth();
  const canEdit = user.role === ROLES.Admin || user.role === ROLES.Professor;
  const isProfessor = user.role === ROLES.Professor;

  const [anosLetivos, setAnosLetivos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [diasLetivos, setDiasLetivos] = useState([]);
  const [relatos, setRelatos] = useState([]);

  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Professor logado vê os próprios relatos; Admin/Diretor/Coordenador escolhem o professor
  const professorEfetivo = isProfessor
    ? String(user.id)
    : professorSelecionado;

  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingProfessores, setLoadingProfessores] = useState(false);
  const [loadingConteudo, setLoadingConteudo] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalDia, setModalDia] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showExport, setShowExport] = useState(false);
  const [exportMes, setExportMes] = useState("ano");
  const [exportInicio, setExportInicio] = useState("");
  const [exportFim, setExportFim] = useState("");

  // Mount: anos letivos
  useEffect(() => {
    carregarAnosLetivos()
      .then(({ anos, anoCorrenteId }) => {
        setAnosLetivos(anos);
        setAnoSelecionado(anoCorrenteId);
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
      .then(({ data }) => setTurmas(toList(data)))
      .catch(() => setTurmas([]))
      .finally(() => setLoadingTurmas(false));
  }, [anoSelecionado]);

  // Turma → professores vinculados (só para quem escolhe o professor)
  useEffect(() => {
    setVinculos([]);
    setProfessorSelecionado("");
    setMostrarTodos(false);
    if (isProfessor || !turmaSelecionada) return;

    setLoadingProfessores(true);
    getVinculosByTurma(turmaSelecionada)
      .then(({ data }) => setVinculos(toList(data)))
      .catch(() => setVinculos([]))
      .finally(() => setLoadingProfessores(false));
  }, [turmaSelecionada]);

  // Turma + professor → dias letivos + relatos
  useEffect(() => {
    setDiasLetivos([]);
    setRelatos([]);
    if (!turmaSelecionada || !anoSelecionado || !professorEfetivo) return;

    const turma = turmas.find((t) => String(t.id) === turmaSelecionada);
    let cancelado = false;

    setLoadingConteudo(true);
    Promise.all([
      getDiasLetivosByAno(
        anoSelecionado,
        turma?.segmento,
        mostrarTodos
          ? {}
          : { turmaId: turmaSelecionada, professorId: professorEfetivo },
      ),
      getRelatosByTurmaAno(turmaSelecionada, anoSelecionado),
    ])
      .then(([diasRes, relatosRes]) => {
        if (cancelado) return;
        const dias = toList(diasRes.data);
        const relatosData = toList(relatosRes.data);

        // Relatos já lançados pelo professor fora dos dias de aula continuam visíveis
        const ids = new Set(dias.map((d) => d.id));
        relatosData
          .filter(
            (r) =>
              String(r.professorId) === professorEfetivo &&
              !ids.has(r.diaLetivoId),
          )
          .forEach((r) => {
            ids.add(r.diaLetivoId);
            dias.push({ id: r.diaLetivoId, data: r.data });
          });
        dias.sort((a, b) =>
          a.data.substring(0, 10).localeCompare(b.data.substring(0, 10)),
        );

        setDiasLetivos(dias);
        setRelatos(relatosData);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setLoadingConteudo(false);
      });

    return () => {
      cancelado = true;
    };
  }, [turmaSelecionada, anoSelecionado, professorEfetivo, mostrarTodos]);

  // Professores distintos da turma, com as disciplinas de cada um
  const professoresTurma = Object.values(
    vinculos.reduce((acc, v) => {
      const p = (acc[v.professorId] ??= {
        id: v.professorId,
        nome: v.professorNome,
        disciplinas: [],
      });
      if (!p.disciplinas.includes(v.disciplinaNome))
        p.disciplinas.push(v.disciplinaNome);
      return acc;
    }, {}),
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  const relatosProfessor = relatos.filter(
    (r) => String(r.professorId) === professorEfetivo,
  );
  const relatoMap = new Map(relatosProfessor.map((r) => [r.diaLetivoId, r]));

  const totalRegistrados = diasLetivos.filter((d) => relatoMap.has(d.id)).length;
  const totalPendentes = diasLetivos.length - totalRegistrados;

  const nomeProfessor = isProfessor
    ? user.nome
    : professoresTurma.find((p) => String(p.id) === professorSelecionado)?.nome;

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
        professorId: Number(professorEfetivo),
        descricao: descricao.trim(),
      });
      const { data } = await getRelatosByTurmaAno(
        turmaSelecionada,
        anoSelecionado,
      );
      setRelatos(toList(data));
      setShowModal(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Erro ao salvar o relato.");
    } finally {
      setSaving(false);
    }
  }

  // ── Exportar PDF ──────────────────────────────────────────

  const anoLetivo = anosLetivos.find((a) => String(a.id) === anoSelecionado);
  const anoCalendario =
    anoLetivo?.ano ?? Number(diasLetivos[0]?.data.substring(0, 4));

  function limitesAno() {
    return {
      inicio: diasLetivos[0]?.data.substring(0, 10) ?? "",
      fim: diasLetivos[diasLetivos.length - 1]?.data.substring(0, 10) ?? "",
    };
  }

  // Descobre se o intervalo corresponde ao ano inteiro ou a um mês inteiro
  function detectarMes(inicio, fim) {
    const ano = limitesAno();
    if (inicio === ano.inicio && fim === ano.fim) return "ano";
    for (let m = 0; m < 12; m++) {
      const lim = limitesMes(anoCalendario, m);
      if (inicio === lim.inicio && fim === lim.fim) return String(m);
    }
    return "personalizado";
  }

  function openExport() {
    const { inicio, fim } = limitesAno();
    setExportMes("ano");
    setExportInicio(inicio);
    setExportFim(fim);
    setShowExport(true);
  }

  function handleExportMes(valor) {
    setExportMes(valor);
    if (valor === "personalizado") return;
    const { inicio, fim } =
      valor === "ano" ? limitesAno() : limitesMes(anoCalendario, Number(valor));
    setExportInicio(inicio);
    setExportFim(fim);
  }

  function handleExportData(campo, valor) {
    const inicio = campo === "inicio" ? valor : exportInicio;
    const fim = campo === "fim" ? valor : exportFim;
    setExportInicio(inicio);
    setExportFim(fim);
    setExportMes(detectarMes(inicio, fim));
  }

  const diasNoPeriodo = diasLetivos.filter((dia) => {
    const dateStr = dia.data.substring(0, 10);
    return dateStr >= exportInicio && dateStr <= exportFim;
  }).length;

  let exportErro = "";
  if (!exportInicio || !exportFim) {
    exportErro = "Informe a data inicial e a data final.";
  } else if (exportFim < exportInicio) {
    exportErro = "A data final não pode ser anterior à data inicial.";
  } else if (diasNoPeriodo === 0) {
    exportErro = "Nenhum dia letivo no período selecionado.";
  }

  function exportarPDF(dataInicial, dataFinal, periodoLabel) {
    const turma = turmas.find((t) => String(t.id) === turmaSelecionada);

    // Nº da aula é a posição no ano, calculada antes de filtrar o período
    const diasPeriodo = diasLetivos
      .map((dia, i) => ({
        dia,
        numero: i + 1,
        dateStr: dia.data.substring(0, 10),
      }))
      .filter(({ dateStr }) => dateStr >= dataInicial && dateStr <= dataFinal);

    const porMes = new Map();
    diasPeriodo.forEach((item) => {
      const chave = item.dateStr.substring(0, 7);
      if (!porMes.has(chave)) porMes.set(chave, []);
      porMes.get(chave).push(item);
    });

    const secoes = [...porMes.entries()]
      .map(([chave, itens]) => {
        const [ano, mes] = chave.split("-");
        const rows = itens
          .map(({ dia, numero, dateStr }) => {
            const descricao = relatoMap.get(dia.id)?.descricao ?? "";
            return `<tr>
          <td>${fmtData(dateStr)}</td>
          <td style="text-align:center">${numero}</td>
          <td>${escapeHtml(descricao).replace(/\n/g, "<br>")}</td>
          <td></td>
        </tr>`;
          })
          .join("");
        return `<section class="mes">
    <h3>${MESES[Number(mes) - 1]}/${ano}</h3>
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
  </section>`;
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
    h3 { margin: 0 0 8px; font-size: 13px; }
    p.subtitulo { margin: 0 0 14px; font-size: 10px; color: #555; }
    section.mes + section.mes { break-before: page; }
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
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
  <p class="subtitulo">
    Turma: <strong>${escapeHtml(turma?.nome)}</strong> &nbsp;|&nbsp;
    Ano Letivo: <strong>${escapeHtml(anoLetivo?.ano)}</strong> &nbsp;|&nbsp;
    Professor: <strong>${escapeHtml(nomeProfessor)}</strong> &nbsp;|&nbsp;
    Período: <strong>${escapeHtml(periodoLabel)}</strong>
  </p>
  ${secoes}
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.print();
  }

  function handleExport(e) {
    e.preventDefault();
    if (exportErro) return;
    const periodoLabel =
      exportMes === "ano"
        ? "Ano letivo completo"
        : `${fmtData(exportInicio)} a ${fmtData(exportFim)}`;
    exportarPDF(exportInicio, exportFim, periodoLabel);
    setShowExport(false);
  }

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
            <Col xs={12} md={isProfessor ? 4 : 3}>
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
            <Col xs={12} md={isProfessor ? 4 : 3}>
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
                    onChange={(e) => {
                      setTurmaSelecionada(e.target.value);
                      setProfessorSelecionado("");
                    }}
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
            {!isProfessor && (
              <Col xs={12} md={3}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Professor</Form.Label>
                  {loadingProfessores ? (
                    <div className="d-flex align-items-center gap-2 pt-1">
                      <Spinner size="sm" variant="secondary" />
                      <small className="text-muted">Carregando...</small>
                    </div>
                  ) : (
                    <Form.Select
                      value={professorSelecionado}
                      onChange={(e) => {
                        setProfessorSelecionado(e.target.value);
                        setMostrarTodos(false);
                      }}
                      disabled={professoresTurma.length === 0}
                    >
                      <option value="">Selecione o professor</option>
                      {professoresTurma.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} — {p.disciplinas.join(", ")}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            )}
            {professorEfetivo && (
              <Col xs={12} md={isProfessor ? 4 : 3}>
                <Form.Check
                  type="switch"
                  id="mostrar-todos-dias"
                  className="small mb-2"
                  label="Mostrar todos os dias"
                  checked={mostrarTodos}
                  onChange={(e) => setMostrarTodos(e.target.checked)}
                  disabled={!turmaSelecionada}
                />
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {!turmaSelecionada ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            Selecione o ano letivo e a turma para ver os dias letivos.
          </Card.Body>
        </Card>
      ) : !professorEfetivo ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            {!loadingProfessores && professoresTurma.length === 0
              ? "Nenhum professor vinculado a esta turma."
              : "Selecione o professor para ver os relatos."}
          </Card.Body>
        </Card>
      ) : loadingConteudo ? (
        <div className="text-center p-5">
          <Spinner variant="primary" />
        </div>
      ) : diasLetivos.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5 text-muted small">
            {!mostrarTodos ? (
              <>
                Nenhum dia de aula encontrado para{" "}
                {isProfessor ? "você" : "este professor"} nesta turma. Para
                reposições, marque <strong>Mostrar todos os dias</strong>.
              </>
            ) : (
              <>
                Nenhum dia letivo cadastrado para este ano. Configure em{" "}
                <strong>Dias Letivos</strong>.
              </>
            )}
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
                className="d-flex align-items-center"
                variant="outline-secondary"
                onClick={openExport}
                disabled={mostrarTodos}
              >
                <Printer size={14} className="me-1" />
                Exportar PDF
              </Button>
            </div>
            {mostrarTodos && (
              <div className="small text-muted mt-2 text-end">
                Desligue <strong>Mostrar todos os dias</strong> para exportar
                só os dias de aula.
              </div>
            )}
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

      <Modal show={showExport} onHide={() => setShowExport(false)} centered>
        <Form onSubmit={handleExport}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Exportar PDF</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {exportErro && (
              <Alert variant="danger" className="py-2 small">
                {exportErro}
              </Alert>
            )}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Período</Form.Label>
                  <Form.Select
                    value={exportMes}
                    onChange={(e) => handleExportMes(e.target.value)}
                  >
                    <option value="ano">Ano inteiro</option>
                    {MESES.map((nome, i) => (
                      <option key={i} value={i}>
                        {nome}
                      </option>
                    ))}
                    <option value="personalizado">Personalizado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Data inicial
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={exportInicio}
                    onChange={(e) => handleExportData("inicio", e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Data final</Form.Label>
                  <Form.Control
                    type="date"
                    value={exportFim}
                    onChange={(e) => handleExportData("fim", e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            {!exportErro && (
              <Form.Text className="text-muted">
                {diasNoPeriodo} dia(s) letivo(s) no período.
              </Form.Text>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowExport(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!!exportErro}
            >
              <Printer size={14} className="me-1" />
              Exportar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
