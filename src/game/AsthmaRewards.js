// ============================================================
// AsthmaRewards — Ao derrotar cada Guardião, o jogador recebe:
//  1) um RESUMO EDUCATIVO sobre a asma
//  2) uma MELHORIA permanente para o personagem
// ============================================================

export const ASTHMA_REWARDS = {
  traqueon: {
    bossName: 'Traqueon',
    icon: '🌬️',
    titulo: 'O que é a Asma?',
    resumo: [
      'A asma é uma doença inflamatória CRÔNICA das vias aéreas. Quem tem asma possui vias respiratórias naturalmente mais sensíveis e reativas.',
      'A traqueia é o grande tubo que leva o ar até os pulmões. Na asma, as vias aéreas ficam inchadas, produzem muco em excesso e se estreitam — por isso o ar passa com dificuldade.',
      'A asma NÃO é contagiosa e NÃO é "frescura": é uma condição real que afeta milhões de pessoas no mundo, e com tratamento correto é possível ter uma vida totalmente normal.'
    ],
    melhoria: { texto: '+15 VIDA MÁXIMA', apply: (p) => { p.maxHp += 15; p.hp = p.maxHp; } }
  },
  bronkar: {
    bossName: 'Bronkar',
    icon: '🌿',
    titulo: 'Gatilhos da Asma',
    resumo: [
      'Os brônquios são os grandes ramos que distribuem o ar pelos pulmões. Na asma, eles reagem de forma exagerada aos chamados GATILHOS.',
      'Gatilhos comuns: poeira, ácaros, pólen, pelos de animais, fumaça de cigarro, poluição, cheiros fortes, ar frio e mudanças bruscas de temperatura.',
      'Evitar os gatilhos é uma das formas mais importantes de prevenir crises: manter o quarto limpo, arejar a casa e ficar longe da fumaça fazem uma diferença enorme.'
    ],
    melhoria: { texto: '+25 STAMINA MÁXIMA', apply: (p) => { p.maxStamina += 25; p.stamina = p.maxStamina; } }
  },
  bronquius: {
    bossName: 'Bronquius',
    icon: '⚡',
    titulo: 'Sintomas: reconhecer a crise',
    resumo: [
      'Os bronquíolos são os ramos mais finos da árvore respiratória. Quando inflamam e se contraem (broncoespasmo), o ar fica "preso" — é a crise de asma.',
      'Sintomas clássicos: FALTA DE AR, CHIADO no peito (como um apito ao respirar), TOSSE seca (principalmente à noite e de madrugada) e sensação de APERTO no peito.',
      'Reconhecer os sintomas cedo permite agir rápido: usar a medicação de alívio prescrita e procurar ajuda médica se não melhorar.'
    ],
    melhoria: { texto: '+15% VELOCIDADE DE MOVIMENTO', apply: (p) => { p.walkSpeed *= 1.15; p.runSpeed *= 1.15; } }
  },
  alveor: {
    bossName: 'Alveor',
    icon: '🫧',
    titulo: 'A Bombinha e a Troca Gasosa',
    resumo: [
      'Nos alvéolos acontece a troca gasosa: o oxigênio (O2) entra no sangue e o gás carbônico (CO2) sai. Na crise de asma, o ar fica preso nos alvéolos e essa troca fica prejudicada.',
      'O inalador de ALÍVIO (a famosa "bombinha", broncodilatador) relaxa a musculatura das vias aéreas e abre a passagem do ar em poucos minutos — por isso deve estar sempre por perto.',
      'Técnica correta importa: agitar o inalador, expirar o ar, aplicar inspirando fundo e prender a respiração por alguns segundos.'
    ],
    melhoria: { texto: 'INALADOR 40% MAIS RÁPIDO (1,0s → 0,6s)', apply: (p) => { p.inhalerDuration = 0.6; } }
  },
  diafragon: {
    bossName: 'Diafragon',
    icon: '🫀',
    titulo: 'Respiração e Exercício Físico',
    resumo: [
      'O diafragma é o principal músculo da respiração: ele desce para puxar o ar e sobe para expulsá-lo. Treinar a respiração diafragmática (pela barriga) ajuda a controlar a falta de ar.',
      'Exercício físico regular FAZ BEM para quem tem asma: fortalece os músculos respiratórios e melhora o condicionamento. Natação e caminhada são ótimas opções.',
      'O segredo é o controle: aquecer antes, ter a bombinha de alívio por perto e respeitar os limites do corpo. Asma controlada NÃO impede a prática de esportes!'
    ],
    melhoria: { texto: '+6 FORÇA (dano de ataque)', apply: (p) => { p.bonusDamage += 6; } }
  },
  guardiaoFinal: {
    bossName: 'Guardião Final',
    icon: '👑',
    titulo: 'Tratamento e Controle da Asma',
    resumo: [
      'A asma NÃO TEM CURA, mas TEM CONTROLE. O tratamento tem duas frentes: o inalador de ALÍVIO (broncodilatador, para crises) e o inalador de CONTROLE (corticoide, uso diário para prevenir).',
      'Muita gente abandona o corticoide quando melhora — erro grave! É ele que mantém a inflamação sob controle e previne as crises futuras.',
      'O ideal é ter um PLANO DE AÇÃO escrito com o médico: o que fazer no dia a dia, quando aumentar a medicação e quando procurar emergência. Asma controlada = vida plena!',
      '🏆 Parabéns! Você completou o Caminho dos Guardiões e dominou o conhecimento sobre a asma!'
    ],
    melhoria: {
      texto: 'LENDA DOS PULMÕES: +20 VIDA, +20 STAMINA, +4 FORÇA',
      apply: (p) => {
        p.maxHp += 20; p.hp = p.maxHp;
        p.maxStamina += 20; p.stamina = p.maxStamina;
        p.bonusDamage += 4;
      }
    }
  }
};
