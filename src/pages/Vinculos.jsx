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
import { getTurmas } from "../api/turmas";
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
  const [vinculos, setVinculos] = useState([]);
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [turmas, setTurmas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSelects();
  }, []);

  useEffect(() => {
    if (turmaSelecionada) loadVinculos(turmaSelecionada);
    else setVinculos([]);
  }, [turmaSelecionada]);

  async function loadSelects() {
    setLoadingSelects(true);
    try {
      const [turmasRes, disciplinasRes, usuariosRes, anosRes] =
        await Promise.all([
          getTurmas(),
          getDisciplinas(),
          getAllUsuarios(),
          getAnoLetivos(),
        ]);
      setTurmas(turmasRes.data.data);
      setDisciplinas(disciplinasRes.data.data);
      setProfessores(
        usuariosRes.data.data.filter((u) => u.role === ROLES.Professor),
      );
      setAnosLetivos(anosRes.data.data);
    } finally {
      setLoadingSelects(false);
    }
  }

  async function loadVinculos(turmaId) {
    setLoadingVinculos(true);
    try {
      const { data } = await getVinculosByTurma(turmaId);
      setVinculos(data);
    } catch {
      setVinculos([]);
    } finally {
      setLoadingVinculos(false);
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setForm({
      turmaId: turmaSelecionada || turmas[0]?.id || "",
      disciplinaId: disciplinas[0]?.id || "",
      professorId: professores[0]?.id || "",
      anoLetivoId: anosLetivos[0]?.id || "",
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
      if (turmaSelecionada) loadVinculos(turmaSelecionada);
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
      if (turmaSelecionada) loadVinculos(turmaSelecionada);
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
          size="md"
          variant="primary"
          onClick={openCreate}
          disabled={
            turmas.length === 0 ||
            disciplinas.length === 0 ||
            professores.length === 0
          }
        >
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
          <Row className="align-items-center g-2">
            <Col xs="auto">
              <small className="fw-medium text-slate-700">
                Filtrar por turma:
              </small>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select
                size="sm"
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {!turmaSelecionada ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Selecione uma turma para ver os vínculos.
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
                  <th>Ano Letivo</th>
                  <th style={{ width: 80 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vinculos.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-medium">{item.disciplinaNome}</td>
                    <td>{item.professorNome}</td>
                    <td>{item.anoLetivo}</td>
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
