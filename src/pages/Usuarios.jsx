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
import { UserCog, Plus, Pencil, Trash2 } from "lucide-react";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../api/usuarios";
import { ROLES, ROLE_LABELS } from "../utils/constants";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const defaultForm = {
  nome: "",
  email: "",
  password: "",
  role: ROLES.Professor,
};

const ROLE_COLORS = {
  0: "danger",
  1: "primary",
  2: "info",
  3: "success",
  4: "secondary",
};

export default function Usuarios() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getUsuarios(page, pageSize);
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
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      nome: item.nome,
      email: item.email,
      password: "",
      role: item.role,
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
        email: form.email,
        password: form.password,
        role: Number(form.role),
      };
      if (editItem) {
        await updateUsuario(editItem.id, payload);
      } else {
        await createUsuario(payload);
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
    if (!confirm("Desativar este usuário?")) return;
    try {
      await deleteUsuario(id);
      load();
    } catch {
      alert("Erro ao desativar.");
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <UserCog size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Usuários</h5>
        </div>
        <Button size="md" variant="primary" onClick={openCreate}>
          Novo Usuário
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner variant="primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Nenhum usuário cadastrado.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-medium">{item.nome}</td>
                    <td className="text-muted small">{item.email}</td>
                    <td>
                      <Badge bg={ROLE_COLORS[item.role]}>
                        {ROLE_LABELS[item.role]}
                      </Badge>
                    </td>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              {editItem ? "Editar" : "Novo"} Usuário
            </Modal.Title>
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
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@escola.com"
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">
                    Senha{" "}
                    {editItem && (
                      <span className="text-muted fw-normal">
                        (obrigatório para salvar)
                      </span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Perfil</Form.Label>
                  <Form.Select
                    value={form.role}
                    onChange={(e) => set("role", Number(e.target.value))}
                    required
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
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
