export class Almanac {
  constructor() {
    this.screenEl = document.getElementById('almanac-screen');
    this.topicsEl = document.getElementById('almanac-topics');
    this.detailEl = document.getElementById('almanac-detail');
    this.btnClose = document.getElementById('btn-close-almanac');

    this.entries = [
      {
        id: 'caminhoAr',
        title: '🫁 O Caminho do Ar',
        unlocked: true,
        summary: 'A trajetória completa do oxigênio desde o ambiente externo até as células.',
        content: `
          <h3 class="almanac-title">Trajetória do Sistema Respiratório</h3>
          <div class="almanac-body">
            <p><strong>1. Nariz e Cavidade Nasal:</strong> O ar entra pelas narinas, onde é aquecido, umedecido e filtrado por cílios e muco.</p>
            <p><strong>2. Faringe:</strong> Canal comum aos sistemas respiratório e digestório.</p>
            <p><strong>3. Laringe:</strong> Contém as pregas vocais e a epiglote, que impede a entrada de alimentos na via aérea.</p>
            <p><strong>4. Traqueia:</strong> Tubo cartilaginoso revestido por epitélio ciliado que conduz o ar limpo aos brônquios.</p>
            <p><strong>5. Brônquios e Bronquíolos:</strong> Ramificações que conduzem o ar para o interior de cada pulmão.</p>
            <p><strong>6. Alvéolos Pulmonares:</strong> Pequenos sacos microscópicos cercados de capilares onde ocorre a troca gasosa.</p>
          </div>
        `
      },
      {
        id: 'traqueia',
        title: '🌬️ Traqueia (Guardião Traqueon)',
        unlocked: true,
        summary: 'Estrutura cartilaginosa que garante a passagem contínua de ar.',
        content: `
          <h3 class="almanac-title">Traqueia e o Guardião Traqueon</h3>
          <div class="almanac-body">
            <p>A <strong>Traqueia</strong> possui anéis cartilaginosos em formato de "C" que impedem o seu colapso, garantindo que a passagem de ar permaneça sempre aberta durante a respiração.</p>
            <p>No jogo, o Guardião <strong>Traqueon</strong> controla rajadas e correntes de ar, simbolizando a força do fluxo constante que percorre esta estrutura primária.</p>
          </div>
        `
      },
      {
        id: 'bronquios',
        title: '🌿 Brônquios e Bronquíolos',
        unlocked: true,
        summary: 'A grande árvore respiratória responsável pela distribuição do ar.',
        content: `
          <h3 class="almanac-title">Árvore Brônquica</h3>
          <div class="almanac-body">
            <p>A traqueia se divide em dois <strong>Brônquios Principais</strong> (direito e esquerdo), que por sua vez se ramificam em <strong>Bronquíolos</strong> cada vez menores.</p>
            <p>Os Guardiões <strong>Bronkar</strong> e <strong>Bronquius</strong> representam essa divisão e a alta velocidade com que o ar se distribui por toda a extensão dos pulmões.</p>
          </div>
        `
      },
      {
        id: 'alveolos',
        title: '🫧 Alvéolos e Troca Gasosa',
        unlocked: true,
        summary: 'A hematose: entrada de Oxigênio (O2) e remoção de Gás Carbônico (CO2).',
        content: `
          <h3 class="almanac-title">Troca Gasosa nos Alvéolos</h3>
          <div class="almanac-body">
            <p>Nos <strong>Alvéolos Pulmonares</strong> ocorre o fenômeno da <strong>Hematose</strong>: por difusão, o O2 passa do ar alveolar para os capilares sanguíneos, e o CO2 passa do sangue para os alvéolos para ser expirado.</p>
            <p>O Guardião <strong>Alveor</strong> desafia o jogador a diferenciar áreas seguras de Oxigênio (O2) e áreas tóxicas de dióxido de carbono (CO2).</p>
          </div>
        `
      },
      {
        id: 'diafragma',
        title: '🫀 Diafragma e Ventilação',
        unlocked: true,
        summary: 'O músculo responsável pelos movimentos de Inspiração e Expiração.',
        content: `
          <h3 class="almanac-title">Mecânica da Ventilação</h3>
          <div class="almanac-body">
            <p><strong>Inspiração:</strong> O Diafragma contrai e desce, aumentando o volume da caixa torácica e reduzindo a pressão interna, fazendo o ar entrar.</p>
            <p><strong>Expiração:</strong> O Diafragma relaxa e sobe, diminuindo o volume torácico e empurrando o ar para fora.</p>
          </div>
        `
      }
    ];

    this.selectedId = 'caminhoAr';
    this.initEvents();
    this.loadUnlockedState();
  }

  loadUnlockedState() {
    try {
      const saved = localStorage.getItem('almanac_unlocked');
      if (saved) {
        const ids = JSON.parse(saved);
        this.entries.forEach(e => {
          if (ids.includes(e.id)) e.unlocked = true;
        });
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  saveUnlockedState() {
    try {
      const unlockedIds = this.entries.filter(e => e.unlocked).map(e => e.id);
      localStorage.setItem('almanac_unlocked', JSON.stringify(unlockedIds));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  unlockTopic(id) {
    const entry = this.entries.find(e => e.id === id);
    if (entry && !entry.unlocked) {
      entry.unlocked = true;
      this.saveUnlockedState();
      return true;
    }
    return false;
  }

  initEvents() {
    this.btnClose.addEventListener('click', () => this.hide());
  }

  show() {
    this.renderSidebar();
    this.renderDetail();
    this.screenEl.classList.remove('hidden');
  }

  hide() {
    this.screenEl.classList.add('hidden');
  }

  renderSidebar() {
    this.topicsEl.innerHTML = '';
    this.entries.forEach(entry => {
      const btn = document.createElement('button');
      btn.className = `almanac-tab ${entry.id === this.selectedId ? 'active' : ''} ${!entry.unlocked ? 'locked' : ''}`;
      btn.innerText = entry.unlocked ? entry.title : '🔒 [BLOQUEADO]';
      btn.disabled = !entry.unlocked;

      if (entry.unlocked) {
        btn.addEventListener('click', () => {
          this.selectedId = entry.id;
          this.renderSidebar();
          this.renderDetail();
        });
      }
      this.topicsEl.appendChild(btn);
    });
  }

  renderDetail() {
    const entry = this.entries.find(e => e.id === this.selectedId);
    if (entry && entry.unlocked) {
      this.detailEl.innerHTML = entry.content;
    } else {
      this.detailEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #94a3b8;">
          <h2>🔒 CONHECIMENTO BLOQUEADO</h2>
          <p>Derrote o Guardião correspondente ou encontre livros no mundo para desbloquear este tópico do Almanaque!</p>
        </div>
      `;
    }
  }
}
