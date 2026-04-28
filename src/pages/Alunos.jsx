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
import { GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";
import {
  getAlunos,
  createAluno,
  updateAluno,
  deleteAluno,
} from "../api/alunos";
import { getTurmas } from "../api/turmas";
import { getAllUsuarios } from "../api/usuarios";
import { getAnoLetivos } from "../api/anoLetivo";
import { ROLES } from "../utils/constants";

const defaultForm = {
  nome: "",
  numeroChamada: "",
  dataNascimento: "",
  turmaId: "",
  anoLetivoId: "",
  userId: "",
};

export default function Alunos() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState([]);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [usuariosAluno, setUsuariosAluno] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;

  useEffect(() => {
    loadSelects();
  }, []);

  useEffect(() => {
    load();
  }, [page]);

  async function loadSelects() {
    try {
      const [turmasRes, anosRes, usuariosRes] = await Promise.all([
        getTurmas(),
        getAnoLetivos(),
        getAllUsuarios(),
      ]);
      setTurmas(turmasRes.data.data);
      setAnosLetivos(anosRes.data.data);
      setUsuariosAluno(
        usuariosRes.data.data.filter((u) => u.role === ROLES.Aluno),
      );
    } catch {
      /* silencioso */
    }
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await getAlunos(page, pageSize);
      setItems(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setEditItem(null);
    setForm({
      ...defaultForm,
      turmaId: turmas[0]?.id ?? "",
      anoLetivoId: anosLetivos[0]?.id ?? "",
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      nome: item.nome,
      numeroChamada: item.numeroChamada,
      dataNascimento: item.dataNascimento,
      turmaId: item.turmaId,
      anoLetivoId: item.anoLetivoId,
      userId: item.userId,
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nome: form.nome,
        numeroChamada: Number(form.numeroChamada),
        dataNascimento: form.dataNascimento,
        turmaId: Number(form.turmaId),
        anoLetivoId: Number(form.anoLetivoId),
        userId: Number(form.userId),
      };
      if (editItem) {
        await updateAluno(editItem.id, payload);
      } else {
        await createAluno(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Confirmar exclusão do aluno?")) return;
    try {
      await deleteAluno(id);
      load();
    } catch {
      alert("Erro ao excluir.");
    }
  }

  const hasDependencies = turmas.length > 0 && anosLetivos.length > 0;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <GraduationCap size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Alunos</h5>
        </div>
        <Button
          size="md"
          variant="primary"
          onClick={openCreate}
          disabled={!hasDependencies}
        >
          Novo Aluno
        </Button>
      </div>

      {!hasDependencies && !loading && (
        <Alert variant="warning" className="small py-2 mb-3">
          Cadastre <strong>Ano Letivo</strong> e <strong>Turmas</strong> antes
          de criar alunos.
        </Alert>
      )}

      {hasDependencies && usuariosAluno.length === 0 && !loading && (
        <Alert variant="info" className="small py-2 mb-3">
          Nenhum usuário com perfil <strong>Aluno</strong> encontrado. Crie um
          usuário com perfil Aluno em <strong>Usuários</strong> primeiro.
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Nenhum aluno cadastrado.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4" style={{ width: 60 }}>
                    Nº
                  </th>
                  <th>Nome</th>
                  <th>Turma</th>
                  <th>Ano Letivo</th>
                  <th>Nascimento</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 text-muted">{item.numeroChamada}</td>
                    <td className="fw-medium">{item.nome}</td>
                    <td className="small">{item.turmaNome}</td>
                    <td className="small">{item.anoLetivo}</td>
                    <td className="small text-muted">{item.dataNascimento}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        {total > pageSize && (
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-4 bg-white border-top">
            <small className="text-muted">{total} registros</small>
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Próximo
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              {editItem ? "Editar" : "Novo"} Aluno
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}
            <Row className="g-3">
              <Col xs={12} md={8}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Nome</Form.Label>
                  <Form.Control
                    value={form.nome}
                    onChange={(e) => set("nome", e.target.value)}
                    placeholder="Nome completo"
                    required
                    autoFocus
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Nº Chamada
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={form.numeroChamada}
                    onChange={(e) => set("numeroChamada", e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Data de Nascimento
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) => set("dataNascimento", e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
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
              <Col xs={12} md={4}>
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
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Usuário do sistema (perfil Aluno)
                  </Form.Label>
                  <Form.Select
                    value={form.userId}
                    onChange={(e) => set("userId", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {usuariosAluno.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} — {u.email}
                      </option>
                    ))}
                  </Form.Select>
                  {usuariosAluno.length === 0 && (
                    <Form.Text className="text-danger">
                      Nenhum usuário com perfil Aluno disponível.
                    </Form.Text>
                  )}
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
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving || usuariosAluno.length === 0}
            >
              {saving && <Spinner size="sm" className="me-1" />}
              Salvar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
