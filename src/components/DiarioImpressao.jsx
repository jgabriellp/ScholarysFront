import { createPortal } from "react-dom";
import { SEGMENTOS, SEGMENTO_LABELS } from "../utils/constants";

// Layout exclusivo da impressão do Diário (não aparece na tela).
// Renderizado direto no <body> para que o @media print possa esconder
// todo o #root e imprimir só esta folha.

function fmt(valor) {
  if (valor == null) return "—";
  return Number(valor).toFixed(1);
}

function diasComFalta(mes) {
  return Object.entries(mes.dias ?? {})
    .filter(([, presente]) => presente === false)
    .map(([dia]) => Number(dia))
    .sort((a, b) => a - b);
}

function Frequencia({ frequencia }) {
  if (!frequencia) return null;
  return (
    <section className="dp-bloco">
      <h2 className="dp-titulo">
        Frequência
        <span className="dp-titulo-info">
          {fmt(frequencia.frequencia)}% · {frequencia.totalFaltas} falta(s)
        </span>
      </h2>
      {frequencia.meses.length === 0 ? (
        <p className="dp-vazio">Nenhuma frequência registrada.</p>
      ) : (
        <table className="dp-tabela">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Mês</th>
              <th style={{ width: "10%" }}>Faltas</th>
              <th>Dias com falta</th>
            </tr>
          </thead>
          <tbody>
            {frequencia.meses.map((mes) => {
              const dias = diasComFalta(mes);
              return (
                <tr key={mes.mes}>
                  <td>{mes.mesNome}</td>
                  <td className="dp-centro">{mes.totalFaltas}</td>
                  <td>{dias.length ? dias.join(", ") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

const COLUNAS_NOTAS = [
  ["U1", "unidade1"],
  ["U2", "unidade2"],
  ["U3", "unidade3"],
  ["M1°", "media1Semestre", true],
  ["U4", "unidade4"],
  ["U5", "unidade5"],
  ["U6", "unidade6"],
  ["M2°", "media2Semestre", true],
  ["M.Anual", "mediaAnual", true],
  ["Rec", "notaRecuperacao"],
  ["M.Final", "mediaFinal", true],
];

function Notas({ notas }) {
  if (!notas || notas.length === 0) return null;
  return (
    <section className="dp-bloco">
      <h2 className="dp-titulo">Notas</h2>
      <table className="dp-tabela dp-notas">
        <thead>
          <tr>
            <th className="dp-esquerda">Disciplina</th>
            {COLUNAS_NOTAS.map(([rotulo, , media]) => (
              <th key={rotulo} className={media ? "dp-media" : undefined}>
                {rotulo}
              </th>
            ))}
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((n) => (
            <tr key={n.disciplinaId}>
              <td className="dp-esquerda">{n.disciplinaNome}</td>
              {COLUNAS_NOTAS.map(([rotulo, campo, media]) => (
                <td key={rotulo} className={media ? "dp-media" : undefined}>
                  {fmt(n[campo])}
                </td>
              ))}
              <td>{n.resultado ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Desenvolvimentos({ desenvolvimentos }) {
  return (
    <section className="dp-bloco">
      <h2 className="dp-titulo">Desenvolvimento por Bimestre</h2>
      {[1, 2, 3, 4].map((b) => {
        const dev = desenvolvimentos?.find((d) => d.bimestre === b);
        return (
          <div key={b} className="dp-bimestre">
            <h3>{b}º Bimestre</h3>
            <p>{dev ? dev.descricao : "Não registrado."}</p>
          </div>
        );
      })}
    </section>
  );
}

export default function DiarioImpressao({ diario, segmento }) {
  if (!diario) return null;

  return createPortal(
    <div className="diario-print">
      <header className="dp-cabecalho">
        <div>
          <h1>{diario.alunoNome}</h1>
          <p>
            Nº {diario.numeroChamada} · {diario.turmaNome} · Ano letivo{" "}
            {diario.anoLetivo}
          </p>
        </div>
        <div className="dp-cabecalho-dir">
          <p>{SEGMENTO_LABELS[segmento]}</p>
          {diario.resultado && (
            <p>
              Resultado: <strong>{diario.resultado}</strong>
            </p>
          )}
        </div>
      </header>

      <Frequencia frequencia={diario.frequencia} />

      {segmento === SEGMENTOS.Fundamental && <Notas notas={diario.notas} />}
      {segmento === SEGMENTOS.Maternal && (
        <Desenvolvimentos desenvolvimentos={diario.desenvolvimentos} />
      )}

      {/* margin-top: auto empurra a assinatura para o pé da última página */}
      <footer className="dp-assinatura">
        <div className="dp-linha">Direção Escolar</div>
        <div className="dp-data">Data: ____/____/________</div>
      </footer>
    </div>,
    document.body,
  );
}
