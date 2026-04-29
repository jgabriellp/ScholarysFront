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
} from "react-bootstrap";
import { GitMerge, Plus, Trash2 } from "lucide-react";
import {
  getVinculosByTurma,
  createVinculo,
  deleteVinculo,
} from "../api/vinculos";
import { getTurmasByAnoLetivo } from "../api/turmas";
import { getDisciplinas } from "../api/disciplinas";
import { getAllUsuarios } from "../api/usuarios";
import { getAnoLetivos } from "../api/anoLetivo";
import { ROLES } from "../utils/constants";

const defaultForm = {
  turmaId: "",
  disciplinaId: "",
  professorId: "",
  anoLetivoId: "",
};

export default function Vinculos() {
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);

  const [anoLetivoFiltro, setAnoLetivoFiltro] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");

  const [vinculos, setVinculos] = useState([]);

  const [loadingSelects, setLoadingSelects] = useState(true);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingVinculos, setLoadingVinculos] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Mount: anos letivos, disciplinas e professores (independentes de filtro)
  useEffect(() => {
    Promise.all([getAnoLetivos(), getDisciplinas(), getAllUsuarios()])
      .then(([anosRes, discRes, usuariosRes]) => {
        const anos = anosRes.data.data;
        setAnosLetivos(anos);
        setDisciplinas(discRes.data.data);
        setProfessores(
          usuariosRes.data.data.filter((u) => u.role === ROLES.Professor),
        );
        if (anos.length > 0) setAnoLetivoFiltro(String(anos[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  // Ano letivo → turmas
  useEffect(() => {
    setTurmas([]);
    setTurmaSelecionada("");
    setVinculos([]);
    if (!anoLetivoFiltro) return;

    setLoadingTurmas(true);
    getTurmasByAnoLetivo(anoLetivoFiltro)
      .then(({ data }) =>
        setTurmas(Array.isArray(data) ? data : (data.data ?? [])),
      )
      .catch(() => setTurmas([]))
      .finally(() => setLoadingTurmas(false));
  }, [anoLetivoFiltro]);

  // Turma → vínculos
  useEffect(() => {
    setVinculos([]);
    if (!turmaSelecionada) return;

    setLoadingVinculos(true);
    getVinculosByTurma(turmaSelecionada)
      .then(({ data }) =>
        setVinculos(Array.isArray(data) ? data : (data.data ?? [])),
      )
      .catch(() => setVinculos([]))
      .finally(() => setLoadingVinculos(false));
  }, [turmaSelecionada]);

  async function reload() {
    if (!turmaSelecionada) return;
    setLoadingVinculos(true);
    try {
      const { data } = await getVinculosByTurma(turmaSelecionada);
      setVinculos(Array.isArray(data) ? data : (data.data ?? []));
    } finally {
      setLoadingVinculos(false);
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setForm({
      turmaId: turmaSelecionada,
      disciplinaId: disciplinas[0]?.id ?? "",
      professorId: professores[0]?.id ?? "",
      anoLetivoId: anoLetivoFiltro,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createVinculo({
        turmaId: Number(form.turmaId),
        disciplinaId: Number(form.disciplinaId),
        professorId: Number(form.professorId),
        anoLetivoId: Number(form.anoLetivoId),
      });
      setShowModal(false);
      reload();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erro ao salvar. Verifique se o vínculo já existe.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Confirmar remoção do vínculo?")) return;
    try {
      await deleteVinculo(id);
      reload();
    } catch {
      alert("Erro ao remover.");
    }
  }

  if (loadingSelects) {
    return (
      <div className="text-center p-5">
        <Spinner variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <GitMerge size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">
            Vínculos (Turma / Disciplina / Professor)
          </h5>
        </div>
        <Button
          variant="primary"
          className="d-flex align-items-center justify-content-between"
          onClick={openCreate}
          disabled={
            !turmaSelecionada ||
            disciplinas.length === 0 ||
            professores.length === 0
          }
        >
          <Plus size={14} className="me-1" />
          Novo Vínculo
        </Button>
      </div>

      {professores.length === 0 && (
        <Alert variant="warning" className="small py-2 mb-3">
          Nenhum usuário com perfil <strong>Professor</strong> encontrado.
          Cadastre em <strong>Usuários</strong> primeiro.
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium">Ano Letivo</Form.Label>
                <Form.Select
                  value={anoLetivoFiltro}
                  onChange={(e) => setAnoLetivoFiltro(e.target.value)}
                >
                  <option value="">Selecione</option>
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
                    disabled={!anoLetivoFiltro || turmas.length === 0}
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

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {!turmaSelecionada ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Selecione o ano letivo e a turma para ver os vínculos.
            </p>
          ) : loadingVinculos ? (
            <div className="text-center p-5">
              <Spinner variant="primary" />
            </div>
          ) : vinculos.length === 0 ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Nenhum vínculo cadastrado para esta turma.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Disciplina</th>
                  <th>Professor</th>
                  <th style={{ width: 80 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vinculos.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-medium">{item.disciplinaNome}</td>
                    <td>{item.professorNome}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Novo Vínculo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}
            <Row className="g-3">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Turma</Form.Label>
                  <Form.Select
                    value={form.turmaId}
                    onChange={(e) => set("turmaId", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Disciplina
                  </Form.Label>
                  <Form.Select
                    value={form.disciplinaId}
                    onChange={(e) => set("disciplinaId", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Professor</Form.Label>
                  <Form.Select
                    value={form.professorId}
                    onChange={(e) => set("professorId", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {professores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Ano Letivo
                  </Form.Label>
                  <Form.Select
                    value={form.anoLetivoId}
                    onChange={(e) => set("anoLetivoId", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {anosLetivos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.ano}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
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
              Salvar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
