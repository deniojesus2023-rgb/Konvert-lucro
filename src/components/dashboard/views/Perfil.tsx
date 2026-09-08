"use client";

import { useDashboard } from "../DashboardContext";
import { TabGroup } from "../shared";
import { sessions } from "../data";

export function Perfil({ isActive }: { isActive: boolean }) {
  const { toast } = useDashboard();

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
              Mariana Costa <span className="badge badge-green" style={{ marginLeft: 6 }}>
                👑 Administrador
              </span>
            </div>
            <div className="profile-email">proprietaria@burgerdavila.com</div>
            <div className="profile-member">Membro desde 15 de mar. de 2026</div>
          </div>
          <button className="btn" style={{ marginLeft: "auto" }}>
            📷 Alterar foto
          </button>
        </div>
      </div>

      <TabGroup tabs={["Informações pessoais", "Segurança", "Notificações", "Preferências"]} />

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
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast("Alterações salvas (demonstração)")}>
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
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => toast("Senha atualizada (demonstração)")}>
            Atualizar senha
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
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
                  <button className="btn" onClick={() => toast("Sessão encerrada (demonstração)")}>
                    Encerrar sessão
                  </button>
                )}
              </div>
            ))}
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
              <button className="btn" style={{ color: "var(--red)", borderColor: "#F6D2D2" }} onClick={() => toast("Ação bloqueada nesta demonstração")}>
                Excluir minha conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
