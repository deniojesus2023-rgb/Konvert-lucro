"use client";

import { useRef, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useDashboardData } from "../DashboardDataContext";
import { DatePickerButton } from "../shared";
import { RowMenu } from "../RowMenu";
import { importacoes as initialImportacoes } from "../data";

export function Importacoes({ isActive }: { isActive: boolean }) {
  const { goTo, toast } = useDashboard();
  const { integList, toggleIntegracao } = useDashboardData();
  const [importacoes, setImportacoes] = useState(initialImportacoes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const iFood = integList.find((it) => it.name === "iFood")!;
  const anotaAi = integList.find((it) => it.name === "Anota Aí")!;
  const whatsapp = integList.find((it) => it.name === "WhatsApp")!;

  function handleConnect(name: string, on: boolean) {
    toggleIntegracao(name);
    toast(on ? `${name} desconectado.` : `${name} conectado.`);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setImportacoes((prev) => [
      {
        dataHora: `${dd}/${mm}/${now.getFullYear()} ${hh}:${min}`,
        origem: "Arquivo CSV",
        periodo: file.name,
        registros: "—",
        status: "Concluída",
        usuario: "Mariana Costa",
      },
      ...prev,
    ]);
    toast(`Arquivo "${file.name}" importado.`);
    e.target.value = "";
  }

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-importacoes">
      <div className="page-head">
        <div>
          <h1>Importações</h1>
          <p>Importe suas vendas e pedidos de forma rápida e segura.</p>
        </div>
        <div className="head-actions">
          <DatePickerButton />
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card integration-card">
          <div className="integration-top">
            <div className="ico ico-ifood" style={{ borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
              if
            </div>
            <div>
              <div className="integration-name">iFood</div>
              <div className="integration-desc">Importe automaticamente seus pedidos do iFood.</div>
            </div>
          </div>
          <div className={`status-chip ${iFood.on ? "on" : "off"}`}>
            <span className={`dot ${iFood.on ? "on" : ""}`}></span>
            {iFood.on ? "Conectado" : "Não conectado"}
          </div>
          <button className="btn btn-outline" onClick={() => handleConnect("iFood", iFood.on)}>
            {iFood.on ? "Desconectar" : "Conectar"}
          </button>
        </div>
        <div className="card integration-card">
          <div className="integration-top">
            <div className="ico ico-anota" style={{ borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
              A
            </div>
            <div>
              <div className="integration-name">Anota Aí</div>
              <div className="integration-desc">Importe seus pedidos do Anota Aí.</div>
            </div>
          </div>
          <div className={`status-chip ${anotaAi.on ? "on" : "off"}`}>
            <span className={`dot ${anotaAi.on ? "on" : ""}`}></span>
            {anotaAi.on ? "Conectado" : "Não conectado"}
          </div>
          <button className="btn btn-outline" onClick={() => handleConnect("Anota Aí", anotaAi.on)}>
            {anotaAi.on ? "Desconectar" : "Conectar"}
          </button>
        </div>
        <div className="card integration-card">
          <div className="integration-top">
            <div className="ico ico-whats" style={{ borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
              W
            </div>
            <div>
              <div className="integration-name">WhatsApp</div>
              <div className="integration-desc">Importe vendas realizadas pelo WhatsApp.</div>
            </div>
          </div>
          <div className={`status-chip ${whatsapp.on ? "on" : "off"}`}>
            <span className={`dot ${whatsapp.on ? "on" : ""}`}></span>
            {whatsapp.on ? "Conectado" : "Não conectado"}
          </div>
          <button className="btn btn-outline" onClick={() => handleConnect("WhatsApp", whatsapp.on)}>
            {whatsapp.on ? "Desconectar" : "Conectar"}
          </button>
        </div>
        <div className="card integration-card">
          <div className="integration-top">
            <div className="ico" style={{ borderRadius: 10, width: 40, height: 40, background: "#EEF1F7", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div>
              <div className="integration-name">Arquivo CSV</div>
              <div className="integration-desc">Importe suas vendas por planilha (CSV ou Excel).</div>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileSelected} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            Importar arquivo
          </button>
        </div>
      </div>

      <div className="card section-block" style={{ marginBottom: 20 }}>
        <div className="section-title">Histórico de importações</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table id="importacoes-table">
            <tbody>
              <tr>
                <th>Data e hora</th>
                <th>Origem</th>
                <th>Período</th>
                <th>Registros</th>
                <th>Status</th>
                <th>Usuário</th>
                <th>Ações</th>
              </tr>
              {importacoes.map((imp, i) => (
                <tr key={i}>
                  <td>{imp.dataHora}</td>
                  <td>{imp.origem}</td>
                  <td>{imp.periodo}</td>
                  <td>{imp.registros}</td>
                  <td>
                    <span className={`badge ${imp.status === "Concluída" ? "badge-green" : "badge-red"}`}>{imp.status}</span>
                  </td>
                  <td>{imp.usuario}</td>
                  <td>
                    <RowMenu onDelete={() => setImportacoes((prev) => prev.filter((_, idx) => idx !== i))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }}>
        <div className="card section-block">
          <div className="section-title">Como importar?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div className="avatar sm" style={{ background: "var(--primary)", color: "#fff" }}>
                1
              </div>
              <div style={{ paddingTop: 4, fontSize: 13.5 }}>Conecte sua integração ou escolha um arquivo</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div className="avatar sm" style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                2
              </div>
              <div style={{ paddingTop: 4, fontSize: 13.5 }}>Selecione o período das vendas</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div className="avatar sm" style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
                3
              </div>
              <div style={{ paddingTop: 4, fontSize: 13.5 }}>Confirme e aguarde a importação</div>
            </div>
          </div>
          <span className="link" style={{ marginTop: 14, display: "inline-block" }} onClick={() => goTo("ajuda")}>
            Ver guia completo →
          </span>
        </div>
        <div className="card section-block">
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>🛈 Importação segura</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Seus dados são importados de forma segura e usados apenas para gerar suas informações dentro do sistema.
          </p>
        </div>
        <div className="card section-block">
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>❔ Precisa de ajuda?</div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px" }}>
            Veja o passo a passo de cada integração ou fale com nosso suporte.
          </p>
          <span className="link" onClick={() => goTo("ajuda")}>
            Acessar ajuda →
          </span>
        </div>
      </div>
    </section>
  );
}
