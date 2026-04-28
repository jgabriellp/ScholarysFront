import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import {
  getDisciplinas,
  createDisciplina,
  updateDisciplina,
  deleteDisciplina,
} from "../api/disciplinas";

const defaultForm = { nome: "" };

export default function Disciplinas() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getDisciplinas();
      setItems(data.data);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    setForm(defaultForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({ nome: item.nome });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editItem) {
        await updateDisciplina(editItem.id, form);
      } else {
        await createDisciplina(form);
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
    if (!confirm("Confirmar exclusão da disciplina?")) return;
    try {
      await deleteDisciplina(id);
      load();
    } catch {
      alert("Erro ao excluir.");
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <BookOpen size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Disciplinas</h5>
        </div>
        <Button size="md" variant="primary" onClick={openCreate}>
          Nova Disciplina
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
              Nenhuma disciplina cadastrada.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Nome</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-medium">{item.nome}</td>
                    <td>
                      <Badge bg={item.ativo ? "success" : "secondary"}>
                        {item.ativo ? "Ativa" : "Inativa"}
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
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">
              {editItem ? "Editar" : "Nova"} Disciplina
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}
            <Form.Group>
              <Form.Label className="small fw-medium">Nome</Form.Label>
              <Form.Control
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ nome: e.target.value })}
                placeholder="Ex: Matemática"
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
              Salvar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
