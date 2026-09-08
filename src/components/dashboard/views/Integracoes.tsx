"use client";

import { useDashboard } from "../DashboardContext";
import { useDashboardData } from "../DashboardDataContext";

export function Integracoes({ isActive }: { isActive: boolean }) {
  const { toast } = useDashboard();
  const { integList, toggleIntegracao } = useDashboardData();

  function handleToggle(name: string, currentlyOn: boolean) {
    toggleIntegracao(name);
    toast(currentlyOn ? `${name} desconectado.` : `${name} conectado.`);
  }

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-integracoes">
      <div className="page-head">
        <div>
          <h1>Integrações</h1>
          <p>Conecte seus canais e centralize todas as suas vendas em um só lugar.</p>
        </div>
      </div>

      <div className="banner" style={{ background: "var(--primary-light)", borderColor: "#D6E1FB", color: "var(--primary-dark)" }}>
        <span>
          <b>Integre seus canais e ganhe tempo.</b> Importe pedidos automaticamente, acompanhe suas vendas e tenha tudo no mesmo lugar.
        </span>
        <span className="link" style={{ color: "var(--primary-dark)" }}>
          Saiba mais →
        </span>
      </div>

      <div className="grid grid-4" id="integ-cards" style={{ marginBottom: 20 }}>
        {integList.map((it) => (
          <div className="card integration-card" key={it.name}>
            <div className="integration-top">
              <div
                className={`ico ${it.ico}`}
                style={{
                  borderRadius: 10,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(it.ico ? {} : { background: "#EEF1F7", color: "#6B7794" }),
                }}
              >
                {it.letter}
              </div>
              <div>
                <div className="integration-name">{it.name}</div>
                <div className="integration-desc">{it.desc}</div>
              </div>
            </div>
            <div className={`status-chip ${it.on ? "on" : "off"}`}>
              <span className={`dot ${it.on ? "on" : ""}`}></span>
              {it.on ? "Conectado" : "Conectar"}
            </div>
            {it.on && it.sync && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Última sincronização: {it.sync}</div>}
            <button
              className={`btn ${it.on ? "" : "btn-primary"}`}
              onClick={() => (it.on ? toast("Configurações da integração (demonstração)") : handleToggle(it.name, it.on))}
            >
              {it.on ? "Configurar" : "Conectar"}
            </button>
          </div>
        ))}
      </div>

      <div className="card section-block">
        <div className="section-title">Integrações conectadas</div>
        <div className="section-sub">Gerencie suas integrações ativas.</div>
        <div className="table-wrap">
          <table id="integ-table">
            <tbody>
              <tr>
                <th></th>
                <th>Nome</th>
                <th>Status</th>
                <th></th>
              </tr>
              {integList.map((it) => (
                <tr key={it.name}>
                  <td>
                    <div
                      className={`ico ${it.ico}`}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        ...(it.ico ? {} : { background: "#EEF1F7", color: "#6B7794" }),
                      }}
                    >
                      {it.letter}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{it.name}</td>
                  <td>
                    <span className={`badge ${it.on ? "badge-green" : "badge-gray"}`}>{it.on ? "Conectado" : "Não conectado"}</span>
                  </td>
                  <td
                    className="row-link"
                    onClick={() => (it.on ? toast("Configurações da integração (demonstração)") : handleToggle(it.name, it.on))}
                  >
                    {it.on ? "Configurar" : "Conectar"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
