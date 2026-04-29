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
  getTurmasByAnoLetivo,
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
  const [anosLetivos, setAnosLetivos] = useState([]);
  const [anoLetivoFiltro, setAnoLetivoFiltro] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnoLetivos()
      .then(({ data }) => {
        setAnosLetivos(data.data);
        if (data.data.length > 0) setAnoLetivoFiltro(String(data.data[0].id));
      })
      .finally(() => setLoadingSelects(false));
  }, []);

  useEffect(() => {
    if (!anoLetivoFiltro) return;
    load();
  }, [anoLetivoFiltro]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await getTurmasByAnoLetivo(anoLetivoFiltro);
      setItems(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openCreate() {
    setEditItem(null);
    setForm({ ...defaultForm, anoLetivoId: anoLetivoFiltro });
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

  if (loadingSelects) {
    return <div className="text-center p-5"><Spinner variant="primary" /></div>;
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Users size={20} className="text-slate-600" />
          <h5 className="fw-bold text-slate-800 mb-0">Turmas</h5>
        </div>
        <Button
          variant="primary"
          onClick={openCreate}
          disabled={anosLetivos.length === 0}
        >
          <Plus size={14} className="me-1" />
          Nova Turma
        </Button>
      </div>

      {anosLetivos.length === 0 && (
        <Alert variant="warning" className="small py-2 mb-3">
          Cadastre um <strong>Ano Letivo</strong> antes de criar turmas.
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-3 px-4">
          <Form.Group>
            <Form.Label className="small fw-medium">Ano Letivo</Form.Label>
            <Form.Select
              value={anoLetivoFiltro}
              onChange={(e) => setAnoLetivoFiltro(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              <option value="">Selecione</option>
              {anosLetivos.map((a) => (
                <option key={a.id} value={a.id}>{a.ano}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner variant="primary" />
            </div>
          ) : !anoLetivoFiltro ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Selecione um ano letivo para ver as turmas.
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted text-center p-5 mb-0 small">
              Nenhuma turma cadastrada para este ano letivo.
            </p>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Nome</th>
                  <th>Segmento</th>
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
                  <Form.Label className="small fw-medium">Ano Letivo</Form.Label>
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
