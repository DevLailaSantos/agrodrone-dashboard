// VARIÁVEIS GLOBAIS DE MÓDULOS E GRÁFICOS (PREVINE TRAVAMENTO DE MEMÓRIA)
let chart1 = null;
let chart2 = null;

let frota = JSON.parse(localStorage.getItem('agrodrone_frota')) || [
    { id: 1, modelo: 'DJI Agras T40', serie: 'SN-T40-990', capacidade: 40, status: 'Operacional' },
    { id: 2, modelo: 'DJI Agras T70', serie: 'SN-T70-112', capacidade: 70, status: 'Manutenção' }
];

let estoque = JSON.parse(localStorage.getItem('agrodrone_estoque')) || [
    { id: 1, nome: 'Glifosato 480', categoria: 'Herbicida', quantidade: 300, minimo: 100 },
    { id: 2, nome: 'Adjuvante Aureo', categoria: 'Adjuvante', quantidade: 20, minimo: 50 }
];

const specsDrones = {
    'T40': { capacidade: 40, vazaoMax: 12, bicos: 'Atomizadores Centrífugos Duplos' },
    'T70': { capacidade: 70, vazaoMax: 16, bicos: 'Atomizadores de Alta Vazão' },
    'T100': { capacidade: 100, vazaoMax: 24, bicos: 'Sistema Quádruplo de Centrifugação' }
};

// ACESSIBILIDADE
function definirTema(tema) {
    document.body.classList.remove('dark-mode', 'daltonico-mode');
    if (tema === 'escuro') document.body.classList.add('dark-mode');
    if (tema === 'daltonico') document.body.classList.add('daltonico-mode');
    localStorage.setItem('agrodrone_tema', tema);
}

const temaSalvo = localStorage.getItem('agrodrone_tema');
if (temaSalvo) definirTema(temaSalvo);

// AUTENTICAÇÃO E CHECAGEM SEGURA
function realizarLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const perfil = document.getElementById('perfil').value;
    
    sessionStorage.setItem('usuario_logado', JSON.stringify({ email, perfil }));
    window.location.href = 'dashboard.html';
}

function verificarAcesso() {
    const usuarioRaw = sessionStorage.getItem('usuario_logado');
    const isDashboard = window.location.pathname.includes('dashboard.html');

    // Se estiver no dashboard e NÃO tiver login, redireciona APENAS UMA VEZ
    if (!usuarioRaw && isDashboard) {
        window.location.href = 'index.html';
        return;
    }

    if (usuarioRaw && isDashboard) {
        const usuario = JSON.parse(usuarioRaw);
        const elEmail = document.getElementById('user-email');
        const elBadge = document.getElementById('user-badge');
        
        if (elEmail) elEmail.innerText = usuario.email;
        if (elBadge) elBadge.innerText = usuario.perfil.toUpperCase();

        if (usuario.perfil === 'operador') {
            ['btn-novo-drone', 'btn-novo-insumo'].forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.style.display = 'none';
            });
        }
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// CALCULADORA DE CALDA
function calcularCalda(event) {
    event.preventDefault();
    const modelo = document.getElementById('calc-drone-modelo').value;
    const area = parseFloat(document.getElementById('calc-area').value);
    const taxa = parseFloat(document.getElementById('calc-taxa').value);
    const dosagem = parseFloat(document.getElementById('calc-dosagem').value);

    const spec = specsDrones[modelo];
    if (!spec) return;

    const volCalda = area * taxa;
    const volProd = area * dosagem;
    const volAgua = volCalda - volProd;
    const voos = Math.ceil(volCalda / spec.capacidade);
    const prodTanque = (volProd / voos).toFixed(2);
    const aguaTanque = ((volCalda / voos) - prodTanque).toFixed(2);

    const caixa = document.getElementById('resultado-calculo');
    const lista = document.getElementById('lista-diagnostico');
    caixa.style.display = 'block';

    lista.innerHTML = `
        <li><strong>Volume Total:</strong> ${volCalda.toFixed(1)} Litros (${volProd.toFixed(1)}L Produto + ${volAgua.toFixed(1)}L Água).</li>
        <li><strong>Logística:</strong> ${voos} reabastecimentos de ${spec.capacidade}L no ${modelo}.</li>
        <li><strong>Preparo por Tanque:</strong> Adicionar <strong>${aguaTanque}L Água</strong> + <strong>${prodTanque}L Produto</strong>.</li>
        <li><strong>Hardware Validade:</strong> ${spec.bicos} (Limite: ${spec.vazaoMax} L/min).</li>
    `;
}

// RENDERIZAÇÃO DE TABELAS
function renderizarTabelas() {
    const tDrones = document.getElementById('tabela-drones');
    const tEstoque = document.getElementById('tabela-estoque');

    if (tDrones) {
        tDrones.innerHTML = '';
        frota.forEach(d => {
            tDrones.innerHTML += `
                <tr>
                    <td>${d.modelo}</td><td>${d.serie}</td><td>${d.capacidade} L</td>
                    <td><span class="badge">${d.status}</span></td>
                    <td><button type="button" onclick="deletarDrone(${d.id})" style="background:none; border:none; cursor:pointer;">🗑️</button></td>
                </tr>`;
        });
        const kpi = document.getElementById('kpi-drones');
        if (kpi) kpi.innerText = frota.length;
    }

    if (tEstoque) {
        tEstoque.innerHTML = '';
        let alertas = 0;
        estoque.forEach(i => {
            const baixo = i.quantidade <= i.minimo;
            if (baixo) alertas++;
            tEstoque.innerHTML += `
                <tr>
                    <td>${i.nome}</td><td>${i.categoria}</td><td>${i.quantidade}</td><td>${i.minimo}</td>
                    <td><span class="badge ${baixo ? 'badge-danger' : ''}">${baixo ? 'BAIXO' : 'OK'}</span></td>
                </tr>`;
        });
        const kpiEstoque = document.getElementById('kpi-estoque-alerta');
        if (kpiEstoque) kpiEstoque.innerText = alertas;
    }

    localStorage.setItem('agrodrone_frota', JSON.stringify(frota));
    localStorage.setItem('agrodrone_estoque', JSON.stringify(estoque));
}

function salvarDrone(e) {
    e.preventDefault();
    frota.push({
        id: Date.now(),
        modelo: document.getElementById('drone-modelo').value,
        serie: document.getElementById('drone-serie').value,
        capacidade: document.getElementById('drone-capacidade').value,
        status: document.getElementById('drone-status').value
    });
    fecharModal('modal-drone');
    renderizarTabelas();
    carregarGraficos(); // Atualiza o gráfico com o novo drone sem travar
}

function deletarDrone(id) {
    frota = frota.filter(d => d.id !== id);
    renderizarTabelas();
    carregarGraficos();
}

function salvarInsumo(e) {
    e.preventDefault();
    estoque.push({
        id: Date.now(),
        nome: document.getElementById('insumo-nome').value,
        categoria: document.getElementById('insumo-categoria').value,
        quantidade: parseFloat(document.getElementById('insumo-qtd').value),
        minimo: parseFloat(document.getElementById('insumo-min').value)
    });
    fecharModal('modal-estoque');
    renderizarTabelas();
}

function abrirModal(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }

// GRÁFICOS (COM DESTRUIÇÃO DE INSTÂNCIA - PREVINE RE-RENDER E TRAVAMENTO)
function carregarGraficos() {
    const ctx1 = document.getElementById('chartHectares');
    const ctx2 = document.getElementById('chartFrota');

    if (!ctx1 || !ctx2) return;

    // Se o gráfico já existe no DOM, destrói antes de recriar
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();

    chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{ label: 'Hectares Pulverizados', data: [500, 800, 1100, 950, 1200, 1400], backgroundColor: '#10b981' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const operacionais = frota.filter(d => d.status === 'Operacional').length;
    const manutencao = frota.filter(d => d.status !== 'Operacional').length;

    chart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Operacional', 'Manutenção'],
            datasets: [{ data: [operacionais, manutencao], backgroundColor: ['#10b981', '#f59e0b'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// INICIALIZADOR ÚNICO
document.addEventListener('DOMContentLoaded', () => {
    verificarAcesso();
    renderizarTabelas();
    if (window.location.pathname.includes('dashboard.html')) {
        carregarGraficos();
    }
});