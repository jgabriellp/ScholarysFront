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
import { Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import {
  getAnoLetivos,
  createAnoLetivo,
  updateAnoLetivo,
  deleteAnoLetivo,
} from "../api/anoLetivo";

const defaultForm = { ano: "" };

export default function AnoLetivo() {
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
      const { data } = await getAnoLetivos();
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
    setForm({ ano: item.ano });
    setError("");
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ano: Number(form.ano) };
      if (editItem) {
        await updateAnoLetivo(editItem.id, payload);
      } else {
        await createAnoLetivo(payload);
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
    if (!confirm("Confirmar exclusão do ano letivo?")) return;
    try {
      await deleteAnoLetivo(id);
      load();
    } catch {
      alert("Erro ao excluir.");
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Calendar size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Ano Letivo</h5>
        </div>
        <Button size="md" variant="primary" onClick={openCreate}>
          Novo Ano Letivo
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
              Nenhum ano letivo cadastrado.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Ano</th>
                  <th>Status</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-medium">{item.ano}</td>
                    <td>
                      <Badge bg={item.ativo ? "success" : "secondary"}>
                        {item.ativo ? "Ativo" : "Inativo"}
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
              {editItem ? "Editar" : "Novo"} Ano Letivo
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}
            <Form.Group>
              <Form.Label className="small fw-medium">Ano</Form.Label>
              <Form.Control
                type="number"
                min="2000"
                max="2099"
                value={form.ano}
                onChange={(e) => setForm({ ano: e.target.value })}
                placeholder="Ex: 2026"
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
