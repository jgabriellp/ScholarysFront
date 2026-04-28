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
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import {
  getTurmas,
  createTurma,
  updateTurma,
  deleteTurma,
} from "../api/turmas";
import { getAnoLetivos } from "../api/anoLetivo";
import { SEGMENTO_LABELS } from "../utils/constants";

const SEGMENTO_OPTIONS = [
  { value: 0, label: "Maternal" },
  { value: 1, label: "Fundamental" },
];

const SEGMENTO_COLORS = { 0: "warning", 1: "primary" };

const defaultForm = { nome: "", segmento: 0, anoLetivoId: "" };

export default function Turmas() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;

  useEffect(() => {
    loadAnosLetivos();
  }, []);

  useEffect(() => {
    load();
  }, [page]);

  async function loadAnosLetivos() {
    try {
      const { data } = await getAnoLetivos();
      setAnosLetivos(data.data);
    } catch {
      /* silencioso */
    }
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await getTurmas(page, pageSize);
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
    setForm({ ...defaultForm, anoLetivoId: anosLetivos[0]?.id ?? "" });
    setError("");
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      nome: item.nome,
      segmento: item.segmento,
      anoLetivoId: item.anoLetivoId,
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
        segmento: Number(form.segmento),
        anoLetivoId: Number(form.anoLetivoId),
      };
      if (editItem) {
        await updateTurma(editItem.id, payload);
      } else {
        await createTurma(payload);
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
    if (!confirm("Confirmar exclusão da turma?")) return;
    try {
      await deleteTurma(id);
      load();
    } catch {
      alert("Erro ao excluir.");
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Users size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Turmas</h5>
        </div>
        <Button
          size="md"
          variant="primary"
          onClick={openCreate}
          disabled={anosLetivos.length === 0}
        >
          Nova Turma
        </Button>
      </div>

      {anosLetivos.length === 0 && !loading && (
        <Alert variant="warning" className="small py-2 mb-3">
          Cadastre um <strong>Ano Letivo</strong> antes de criar turmas.
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
              Nenhuma turma cadastrada.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Nome</th>
                  <th>Segmento</th>
                  <th>Ano Letivo</th>
                  <th style={{ width: 100 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="ps-4 fw-medium">{item.nome}</td>
                    <td>
                      <Badge bg={SEGMENTO_COLORS[item.segmento]}>
                        {SEGMENTO_LABELS[item.segmento]}
                      </Badge>
                    </td>
                    <td>{item.anoLetivoAno}</td>
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
              {editItem ? "Editar" : "Nova"} Turma
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
                    placeholder="Ex: 1º Ano A"
                    required
                    autoFocus
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small fw-medium">Segmento</Form.Label>
                  <Form.Select
                    value={form.segmento}
                    onChange={(e) => set("segmento", Number(e.target.value))}
                    required
                  >
                    {SEGMENTO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
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
