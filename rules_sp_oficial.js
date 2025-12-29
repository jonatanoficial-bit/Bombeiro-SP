/* rules_sp_oficial.js - São Paulo (Oficial / Estruturado)
   Objetivo:
   - Centralizar base legal (Decreto/IT/NBR/leis) + engine de recomendações.
   - Ser plugável (troca de pacote sem quebrar app).
   - IMPORTANTE: este arquivo NÃO inclui valores numéricos normativos completos ainda.
     Ele prepara estrutura + validações de entrada + recomendações e referências.
   Como evoluir:
   - Preencher RULES_DB.tables com valores/tabelas oficiais (por IT/NBR).
   - Implementar computeSizing com regras fechadas e quantidades mínimas calculadas.
*/

export const PACK_INFO = {
  id: "sp-oficial",
  name: "São Paulo (Oficial)",
  version: "0.1.0",
  updatedAt: "2025-12-29",
  note:
    "Estrutura oficial (refs + validações). Valores/tabelas para cálculos serão adicionados no próximo passo."
};

/* ===== Base de Referências (para aparecer no relatório) =====
   Não colocamos o texto completo de normas (direitos autorais),
   mas mantemos os identificadores e observações.
*/
export const RULES_DB = {
  jurisdiction: "BR-SP",
  legal: [
    {
      id: "sp_decreto_69118_2024",
      title: "Decreto SP nº 69.118/2024 - Regulamento de Segurança Contra Incêndios",
      type: "DECRETO",
      authority: "Governo do Estado de São Paulo",
      issued: "2024-12-09",
      summary:
        "Institui o regulamento de segurança contra incêndios das edificações e áreas de risco no Estado de São Paulo (base do processo AVCB/CLCB/LAVCB/TAACB)."
    }
  ],
  viafacil: [
    {
      id: "viafacil_pts",
      title: "Via Fácil Bombeiros - PTS (Projeto Técnico Simplificado)",
      type: "PROCEDIMENTO",
      summary:
        "PTS utilizado para regularização de imóveis de baixo risco; ocorrência de situação de risco pode exigir PT."
    }
  ],
  its: [
    // Aqui você vai alimentar com a lista “real” conforme CBPMESP (ex.: IT-01, IT-21, IT-17, etc.)
    // Mantemos estrutura pronta:
    { id: "it_01", code: "IT-01", title: "Procedimentos Administrativos", year: null },
    { id: "it_21", code: "IT-21", title: "Sistema de proteção por extintores de incêndio", year: null },
    { id: "it_17", code: "IT-17", title: "Brigada de incêndio", year: null },
    { id: "it_42", code: "IT-42", title: "Projeto Técnico Simplificado (PTS)", year: null }
  ],
  nbrs: [
    { id: "nbr_12693", code: "ABNT NBR 12693", title: "Sistemas de proteção por extintores de incêndio", year: 2021 },
    { id: "nbr_14276", code: "ABNT NBR 14276", title: "Brigada de incêndio", year: null }
  ],
  tables: {
    // FUTURO (próximo passo):
    // - tabelas por ocupação, carga de incêndio, distâncias máximas, capacidade extintora, etc.
    // exemplo (placeholder):
    extinguisher: {
      enabled: false,
      note:
        "Tabelas de dimensionamento de extintores serão preenchidas com base em IT/NBR oficiais."
    },
    brigade: {
      enabled: false,
      note:
        "Tabelas de dimensionamento de brigada/brigadistas serão preenchidas com base em IT/NBR oficiais."
    }
  }
};

/* ===== Checklist =====
   Por enquanto reaproveitamos o checklist macro (mesma estrutura do pacote base),
   mas o pacote “oficial” pode adicionar itens específicos ou condicionar por ocupação.
*/
function item(id, title, help, tags = []) {
  return { id, title, help, tags };
}

export function buildChecklist({ tipoLocal, riscos = [] }) {
  const r = new Set(riscos);

  const sections = [
    {
      id: "ident",
      title: "Identificação e Documentos",
      items: [
        item("ident_placa", "Placas de lotação/regras (quando aplicável)", "Verificar se há controle/limites e orientações visíveis quando aplicável."),
        item("ident_planta", "Planta/croqui disponível para orientação", "Se não houver, registrar e sugerir croqui para orientar rotas e equipamentos."),
        item("ident_man", "Registros de manutenção (extintores/iluminação/alarme)", "Verificar evidências mínimas de manutenção e teste quando houver sistemas.")
      ]
    },
    {
      id: "rotas",
      title: "Rotas de fuga e Saídas",
      items: [
        item("rotas_desob", "Rotas de fuga desobstruídas", "Corredores, portas e saídas sem obstáculos, materiais ou travamentos indevidos."),
        item("rotas_portas", "Portas de saída funcionais", "Sem cadeados durante operação; registrar travas e bloqueios."),
        item("rotas_larg", "Larguras compatíveis com fluxo", "Registrar gargalos, estreitamentos e barreiras."),
        item("rotas_escadas", "Escadas/níveis com proteção e segurança", "Corrimão/guarda-corpo quando aplicável; registrar riscos."),
        item("rotas_dist", "Percurso até saídas e alternativa", "Registrar se percurso parece excessivo/sem alternativas.")
      ]
    },
    {
      id: "ext",
      title: "Extintores",
      items: [
        item("ext_qtd", "Quantidade/distribuição adequada", "Verificar se há extintores suficientes e bem distribuídos."),
        item("ext_tipo", "Tipos compatíveis com riscos", "Compatibilidade com risco elétrico, cozinha/óleo, inflamáveis etc.", ["cozinha", "inflamaveis"]),
        item("ext_sinal", "Sinalização do extintor", "Sinalização visível e correta do ponto do equipamento."),
        item("ext_acesso", "Acesso livre ao extintor", "Sem obstáculos no acesso."),
        item("ext_valid", "Validade/lacre/manômetro/condição", "Verificar indicadores: lacre, pressão (quando houver), integridade.")
      ]
    },
    {
      id: "sinal",
      title: "Sinalização de emergência",
      items: [
        item("sinal_rotas", "Sinalização de rotas e saídas", "Placas indicando saída/rota conforme necessidade do ambiente."),
        item("sinal_equip", "Sinalização de equipamentos", "Extintores, hidrantes, alarme, etc."),
        item("sinal_alerta", "Sinalização de alerta/risco", "Riscos específicos (energia, inflamáveis, GLP, etc.).", ["glp", "inflamaveis"])
      ]
    },
    {
      id: "ilu",
      title: "Iluminação de emergência",
      items: [
        item("ilu_pres", "Iluminação de emergência presente", "Verificar existência em rotas, saídas e pontos críticos."),
        item("ilu_teste", "Teste funcional básico", "Se possível, registrar teste simples/indicadores."),
        item("ilu_aut", "Autonomia/condição aparente", "Estado das luminárias e bateria; registrar falhas.")
      ]
    },
    {
      id: "alarme",
      title: "Alarme e Detecção (quando houver)",
      items: [
        item("al_central", "Central/indicadores operacionais (se existe)", "Registrar existência e condição aparente."),
        item("al_acion", "Acionadores/sirenes (se existe)", "Verificar presença, acesso e condição."),
        item("al_teste", "Registros de teste/manutenção", "Se existir sistema, verificar evidências mínimas.")
      ]
    },
    {
      id: "brigada",
      title: "Brigada / Plano de emergência",
      items: [
        item("br_plano", "Plano de emergência/orientações internas", "Procedimentos básicos, rota, encontro, responsável."),
        item("br_treino", "Treinamento/brigadistas definidos", "Registrar evidência de treinamento e designação."),
        item("br_dimension", "Dimensionamento (quando aplicável)", "Será calculado por tabela oficial no pacote SP (quando ativado).")
      ]
    },
    {
      id: "riscos",
      title: "Riscos Especiais",
      items: [
        item("r_glp", "GLP: armazenamento e sinalização", "Condição do botijão/central, ventilação e sinalização.", ["glp"]),
        item("r_cozinha", "Cozinha/óleo: controle de risco", "Limpeza/ordem, risco de gordura, registro.", ["cozinha"]),
        item("r_inflam", "Inflamáveis: armazenamento e controle", "Local adequado, sinalização e controle.", ["inflamaveis"]),
        item("r_subsolo", "Subsolo: rotas e ventilação", "Checar acessos, rotas e condições.", ["subsolo"]),
        item("r_evento", "Evento: layout/saídas temporárias/controle público", "Registrar layout, saídas, barreiras e fluxo.", ["palco","som_luz"])
      ]
    }
  ];

  for (const sec of sections) {
    sec.items = sec.items.filter(it => {
      if (!it.tags || it.tags.length === 0) return true;
      if (tipoLocal === "evento" && (it.tags.includes("palco") || it.tags.includes("som_luz"))) return true;
      return it.tags.some(t => r.has(t));
    });
  }

  return sections;
}

/* ===== Motor de Dimensionamento (OFICIAL - modo “validação + recomendações”) =====
   Aqui a gente:
   - valida entradas mínimas
   - gera recomendações com refs
   - se não tiver tabela oficial ativada, retorna "precisa classificar/parametrizar"
*/
export function computeSizing(context) {
  const warnings = [];
  const results = [];

  const area = num(context.area_m2);
  const pav = int(context.pavimentos);
  const lot = int(context.lotacao);
  const tipoLocal = context.tipoLocal || "comercio";
  const riscos = Array.isArray(context.riscos) ? context.riscos : [];

  // Entradas mínimas
  if (!area) warnings.push("Área (m²) não informada: cálculos ficam limitados.");
  if (!pav && pav !== 0) warnings.push("Pavimentos não informados: análise de rotas/saídas pode ficar limitada.");
  if (lot === null) warnings.push("Lotação não informada: recomendações de controle de público/brigada ficam limitadas.");
  if (!context.ocupacao) warnings.push("Ocupação/atividade não informada: classificação de risco e exigências ficam limitadas.");

  // Referências (IDs internos)
  const refDecreto = ref("DECRETO SP 69.118/2024", "Base do regulamento estadual para SCI em SP.");
  const refViaFacil = ref("Via Fácil Bombeiros (PTS/PT)", "Procedimentos e enquadramento por risco/complexidade.");
  const refNBR12693 = ref("ABNT NBR 12693", "Extintores: requisitos de projeto/seleção/instalação.");
  const refBrigada = ref("ABNT NBR 14276 / IT-17", "Brigada: treinamento e dimensionamento (quando aplicável).");
  const refIT21 = ref("IT-21", "Sistema de proteção por extintores (SP).");

  // Bloco base (sempre útil)
  results.push({
    id: "sp_base_legal",
    category: "Base legal e processo",
    title: "Conferir enquadramento e processo de licenciamento",
    summary:
      "Confirmar se o caso é PTS, PT ou outra via de regularização e reunir documentos e evidências.",
    details:
      "O app gera relatório de adequações para o contratante. Vistoria/licenciamento oficial segue procedimento do CBPMESP.",
    refs: [refDecreto, refViaFacil],
    severity: "info"
  });

  // Extintores (modo oficial, mas sem tabela numérica ainda)
  results.push({
    id: "ext_eval",
    category: "Extintores",
    title: "Dimensionar extintores por ocupação/risco e distribuição",
    summary:
      "Registrar extintores existentes (tipo, capacidade, localização, validade) e comparar com o dimensionamento aplicável.",
    details:
      "Para calcular mínimo com precisão, é necessário classificar a ocupação/risco e aplicar tabela oficial (IT/NBR). Este pacote já guarda as referências e validações; as tabelas serão ativadas quando adicionadas.",
    refs: [refIT21, refNBR12693],
    severity: "warn"
  });

  // Brigada (modo oficial, sem tabela numérica ainda)
  results.push({
    id: "brig_eval",
    category: "Brigada",
    title: "Avaliar brigada/treinamento e dimensionamento",
    summary:
      "Dimensionamento depende de ocupação, lotação, risco e exigências aplicáveis.",
    details:
      "Informe lotação, turnos e riscos. Quando a tabela oficial estiver ativa, o app calculará quantitativo mínimo e justificará no relatório.",
    refs: [refBrigada, refDecreto],
    severity: "warn"
  });

  // Evento
  if (tipoLocal === "evento" || riscos.includes("palco") || context.possuiPalcoEstrutura) {
    results.push({
      id: "evt_fluxo",
      category: "Evento",
      title: "Validar layout, saídas temporárias e controle de público",
      summary:
        "Garantir fluxo seguro, rotas desobstruídas e sinalização adequada para evacuação.",
      details:
        "Registrar mapa do layout, barreiras, gargalos, pontos de maior densidade, posição de extintores e equipe.",
      refs: [refDecreto, refViaFacil],
      severity: "critical"
    });
  }

  // Se um dia ativarmos as tabelas, você liga aqui:
  if (RULES_DB.tables.extinguisher.enabled) {
    // FUTURO: cálculo real -> results.push({ value, unit, refs oficiais })
  }
  if (RULES_DB.tables.brigade.enabled) {
    // FUTURO: cálculo real -> results.push({ value, unit, refs oficiais })
  }

  return { results, warnings };
}

/* ===== Helpers ===== */
function num(v) {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}
function int(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.trunc(Number(String(v).trim()));
  return Number.isFinite(n) ? n : null;
}
function ref(code, note) {
  return { code, note };
}
