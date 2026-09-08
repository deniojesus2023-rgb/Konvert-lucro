"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { SearchIcon } from "../shared";
import { faqs } from "../data";

const videos: [string, string][] = [
  ["Como conectar o iFood", "2:45"],
  ["Como importar vendas", "3:20"],
  ["Como configurar metas", "2:10"],
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`} onClick={() => setOpen((v) => !v)}>
      <div className="faq-q">
        {question}
        <svg className="faq-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className="faq-a">{answer}</div>
    </div>
  );
}

export function Ajuda({ isActive }: { isActive: boolean }) {
  const { goTo, toast } = useDashboard();
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filteredFaqs = term ? faqs.filter(([q, a]) => q.toLowerCase().includes(term) || a.toLowerCase().includes(term)) : faqs;

  return (
    <section className={`view${isActive ? " active" : ""}`} id="view-ajuda">
      <div className="page-head">
        <div>
          <h1>Ajuda</h1>
          <p>Encontre respostas, tutoriais e fale com nosso suporte.</p>
        </div>
      </div>

      <div className="search-box" style={{ maxWidth: 640, margin: "0 auto 26px", padding: "12px 16px" }}>
        <SearchIcon />
        <input type="text" placeholder="O que você precisa?" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-primary" style={{ padding: "6px 14px" }}>
          Buscar
        </button>
      </div>

      <div className="help-grid">
        <div className="card help-card">
          <div className="hico">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h4>Primeiros passos</h4>
          <p>Aprenda a configurar seu delivery.</p>
        </div>
        <div className="card help-card">
          <div className="hico">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 10.6l6.9-3.9M8.6 13.4l6.9 3.9" />
            </svg>
          </div>
          <h4>Integrações</h4>
          <p>Conecte iFood, WhatsApp e outras plataformas.</p>
        </div>
        <div className="card help-card" onClick={() => goTo("vendas")}>
          <div className="hico">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 20V10" />
              <path d="M12 20V4" />
              <path d="M20 20v-7" />
            </svg>
          </div>
          <h4>Vendas e relatórios</h4>
          <p>Entenda seus dados e aumente suas vendas.</p>
        </div>
        <div className="card help-card" onClick={() => goTo("configuracoes")}>
          <div className="hico">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87" />
            </svg>
          </div>
          <h4>Configurações</h4>
          <p>Ajuste preferências e personalize o sistema.</p>
        </div>
        <div className="card help-card">
          <div className="hico">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <h4>Plano e cobrança</h4>
          <p>Gerencie seu plano e forma de pagamento.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card section-block">
          <div className="section-title">Perguntas frequentes</div>
          <div style={{ marginTop: 12 }}>
            {filteredFaqs.map(([q, a]) => (
              <FaqItem key={q} question={q} answer={a} />
            ))}
            {filteredFaqs.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13.5 }}>Nenhuma pergunta encontrada para &quot;{search}&quot;.</p>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card support-cta">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ainda precisa de ajuda?</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px" }}>Nossa equipe está pronta para te atender.</p>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => toast("Abrindo chat de suporte… (demonstração)")}>
              💬 Falar com o suporte
            </button>
            <div className="avg-time">Tempo médio de resposta: até 2 horas</div>
          </div>
          <div className="card section-block">
            <div className="section-title" style={{ marginBottom: 10 }}>
              Tutoriais em vídeo
            </div>
            {videos.map(([title, dur]) => (
              <div className="video-item" key={title}>
                <div className="video-thumb">▶</div>
                <div>
                  <div className="video-title">{title}</div>
                  <div className="video-dur">{dur}</div>
                </div>
              </div>
            ))}
            <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => toast("Abrindo tutoriais… (demonstração)")}>
              Ver todos os tutoriais
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
