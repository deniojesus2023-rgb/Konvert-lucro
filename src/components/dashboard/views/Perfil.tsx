"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { TabGroup, ToggleSwitch } from "../shared";
import { sessions as initialSessions } from "../data";

const TABS = ["Informações pessoais", "Segurança", "Notificações", "Preferências"];

export function Perfil({ isActive }: { isActive: boolean }) {
  const { toast } = useDashboard();
  const [tab, setTab] = useState(TABS[0]);
  const [sessions, setSessions] = useState(initialSessions);

  function handleEndSession(device: string) {
    setSessions((prev) => prev.filter((s) => s.device !== device));
    toast("Sessão encerrada.");
  }

  function handleDeleteAccount() {
    if (window.confirm("Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.")) {
      toast("Exclusão de conta bloqueada nesta demonstração.");
    }
  }

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-perfil">
      <div className="page-head">
        <div>
          <h1>Perfil</h1>
          <p>Gerencie suas informações pessoais e da sua conta.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="profile-header">
          <div className="avatar">MC</div>
          <div>
            <div className="profile-name">
              Mariana Costa{" "}
              <span className="badge badge-green" style={{ marginLeft: 6 }}>
                👑 Administrador
              </span>
            </div>
            <div className="profile-email">proprietaria@burgerdavila.com</div>
            <div className="profile-member">Membro desde 15 de mar. de 2026</div>
          </div>
          <button className="btn" style={{ marginLeft: "auto" }} onClick={() => toast("Alterar foto (demonstração)")}>
            📷 Alterar foto
          </button>
        </div>
      </div>

      <TabGroup tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Informações pessoais" && (
        <div className="grid grid-2">
          <div className="card section-block">
            <div className="section-title">Dados pessoais</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Atualize suas informações pessoais.</p>
            <div className="kv-grid" style={{ marginTop: 14 }}>
              <div>
                <label className="field-label">Nome completo</label>
                <input className="field-input" defaultValue="Mariana Costa" />
              </div>
              <div>
                <label className="field-label">E-mail</label>
                <input className="field-input" defaultValue="proprietaria@burgerdavila.com" />
              </div>
              <div>
                <label className="field-label">Telefone</label>
                <input className="field-input" defaultValue="(11) 91234-5678" />
              </div>
              <div>
                <label className="field-label">Cargo</label>
                <input className="field-input" defaultValue="Proprietária" />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast("Alterações salvas.")}>
              Salvar alterações
            </button>
          </div>

          <div className="card section-block">
            <div className="section-title">Alterar senha</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Mantenha sua conta segura com uma senha forte.</p>
            <label className="field-label" style={{ marginTop: 14 }}>
              Senha atual
            </label>
            <input className="field-input" type="password" placeholder="Digite sua senha atual" />
            <label className="field-label" style={{ marginTop: 12 }}>
              Nova senha
            </label>
            <input className="field-input" type="password" placeholder="Digite sua nova senha" />
            <label className="field-label" style={{ marginTop: 12 }}>
              Confirmar nova senha
            </label>
            <input className="field-input" type="password" placeholder="Confirme sua nova senha" />
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast("Senha atualizada.")}>
              Atualizar senha
            </button>
          </div>
        </div>
      )}

      {tab === "Segurança" && (
        <div className="grid grid-2">
          <div className="card section-block">
            <div className="section-title">Sessões ativas</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Gerencie os dispositivos conectados à sua conta.</p>
            <div style={{ marginTop: 12 }}>
              {sessions.map((s) => (
                <div
                  key={s.device}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F3F8", gap: 10, flexWrap: "wrap" }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {s.device}{" "}
                      {s.current && (
                        <span className="badge badge-green" style={{ marginLeft: 6 }}>
                          Sessão atual
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.location}</div>
                  </div>
                  {!s.current && (
                    <button className="btn" onClick={() => handleEndSession(s.device)}>
                      Encerrar sessão
                    </button>
                  )}
                </div>
              ))}
              {sessions.length === 1 && <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>Só a sua sessão atual está ativa.</p>}
            </div>
          </div>
          <div className="card section-block" style={{ borderColor: "#F6D2D2" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--red-bg)", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                🗑
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>Excluir conta</div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 14px" }}>
                  Ao excluir sua conta, todos os seus dados serão removidos permanentemente.
                </p>
                <button className="btn" style={{ color: "var(--red)", borderColor: "#F6D2D2" }} onClick={handleDeleteAccount}>
                  Excluir minha conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Notificações" && (
        <div className="grid grid-2">
          <div className="card section-block">
            <div className="section-title">Notificações da conta</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Escolha como você, pessoalmente, quer ser avisado.</p>
            <div style={{ marginTop: 10 }}>
              <div className="toggle-row">
                <div>
                  <div className="tname">Notificações por e-mail</div>
                  <div className="tdesc">Receba avisos importantes da sua conta por e-mail</div>
                </div>
                <ToggleSwitch />
              </div>
              <div className="toggle-row">
                <div>
                  <div className="tname">Notificações push</div>
                  <div className="tdesc">Receba alertas no navegador</div>
                </div>
                <ToggleSwitch defaultOn={false} />
              </div>
              <div className="toggle-row">
                <div>
                  <div className="tname">Resumo semanal</div>
                  <div className="tdesc">Um resumo do desempenho toda segunda-feira</div>
                </div>
                <ToggleSwitch />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast("Preferências salvas.")}>
              Salvar preferências
            </button>
          </div>
        </div>
      )}

      {tab === "Preferências" && (
        <div className="grid grid-2">
          <div className="card section-block">
            <div className="section-title">Preferências pessoais</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Ajustes que valem só para o seu usuário.</p>
            <div style={{ marginTop: 10 }}>
              <div className="toggle-row">
                <div>
                  <div className="tname">Densidade compacta nas tabelas</div>
                </div>
                <ToggleSwitch defaultOn={false} />
              </div>
              <div className="toggle-row">
                <div>
                  <div className="tname">Confirmar antes de excluir</div>
                </div>
                <ToggleSwitch />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast("Preferências salvas.")}>
              Salvar preferências
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
