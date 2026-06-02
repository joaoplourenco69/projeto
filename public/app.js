const state = {
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    page: {
        planos: 1,
        partidas: 1,
        noticias: 1,
        atletas: 1
    },
    filters: {
        planos: {},
        partidas: { futuras: 'true' },
        noticias: {},
        atletas: {}
    },
    planos: []
};

const demo = {
    planos: [
        { id: 1, nome_plano: 'Torcedor', mensalidade: 29.9, beneficios: 'Conteudos exclusivos e prioridade em noticias.' },
        { id: 2, nome_plano: 'Socio Tricolor', mensalidade: 59.9, beneficios: 'Descontos em produtos oficiais e beneficios em jogos.' },
        { id: 3, nome_plano: 'Diamante', mensalidade: 99.9, beneficios: 'Prioridade em ingressos e experiencias exclusivas.' }
    ],
    partidas: [
        { id: 1, adversario: 'Palmeiras', data_hora: '2026-06-02T20:30:00', local: 'Morumbi', vagas_disponiveis: 45000 },
        { id: 2, adversario: 'Corinthians', data_hora: '2026-06-09T21:00:00', local: 'Morumbi', vagas_disponiveis: 38000 },
        { id: 3, adversario: 'Flamengo', data_hora: '2026-06-16T19:00:00', local: 'Morumbi', vagas_disponiveis: 41000 }
    ],
    noticias: [
        { id: 1, titulo: 'Socio torcedor ganha nova area digital', categoria: 'Socio torcedor', conteudo: 'O sistema agora centraliza planos, reservas e beneficios em uma unica experiencia.' },
        { id: 2, titulo: 'Elenco se prepara para sequencia no Morumbi', categoria: 'Futebol profissional', conteudo: 'A agenda de jogos permite acompanhar partidas futuras e disponibilidade de ingressos.' },
        { id: 3, titulo: 'Categorias de base recebem destaque', categoria: 'Base', conteudo: 'Noticias podem ser filtradas por categoria e paginadas dentro do painel.' }
    ],
    atletas: [
        { id: 1, nome: 'Rafael Monteiro', apelido: 'Rafa', posicao: 'Goleiro', nacionalidade: 'Brasil' },
        { id: 2, nome: 'Lucas Andrade', apelido: 'Luquinha', posicao: 'Meia', nacionalidade: 'Brasil' },
        { id: 3, nome: 'Diego Santos', apelido: 'DS9', posicao: 'Atacante', nacionalidade: 'Brasil' }
    ]
};

const routes = {
    inicio: () => loadHome(),
    planos: () => loadPlanos(),
    partidas: () => loadPartidas(),
    noticias: () => loadNoticias(),
    atletas: () => loadAtletas(),
    'minha-conta': () => loadAccount()
};

function qs(selector) {
    return document.querySelector(selector);
}

function qsa(selector) {
    return [...document.querySelectorAll(selector)];
}

function money(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dateTime(value) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message) {
    const toast = qs('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

function demoResult(name) {
    const data = demo[name] || [];

    return {
        data,
        pagination: {
            page: 1,
            limit: data.length,
            total: data.length,
            total_pages: 1
        }
    };
}

async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(path, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let data = null;

    if (text && contentType.includes('application/json')) {
        data = JSON.parse(text);
    }

    if (!response.ok) {
        throw new Error(data?.error?.message || data?.erro || 'A API respondeu um erro. Verifique se o banco foi configurado e as migrations foram executadas.');
    }

    if (text && !contentType.includes('application/json')) {
        throw new Error('A rota chamada nao retornou JSON. Verifique se a URL da API esta correta.');
    }

    return data;
}

function paramsFrom(filters, page) {
    const params = new URLSearchParams({ page, limit: 6 });

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            params.set(key, value);
        }
    });

    return params.toString();
}

function renderPager(name, pagination) {
    const pager = qs(`[data-pager="${name}"]`);

    if (!pager || !pagination) {
        return;
    }

    pager.innerHTML = `
        <button type="button" data-page="${pagination.page - 1}" ${pagination.page <= 1 ? 'disabled' : ''}>Anterior</button>
        <span>Pagina ${pagination.page} de ${pagination.total_pages || 1}</span>
        <button type="button" data-page="${pagination.page + 1}" ${pagination.page >= pagination.total_pages ? 'disabled' : ''}>Proxima</button>
    `;

    pager.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
            state.page[name] = Number(button.dataset.page);
            routes[name]();
        });
    });
}

function setRoute(route) {
    const selected = routes[route] ? route : 'inicio';

    qsa('[data-view]').forEach((view) => {
        view.hidden = view.id !== `view-${selected}`;
    });
    qsa('.nav-link').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.route === selected);
    });

    window.location.hash = selected;
    routes[selected]();
}

async function loadHome() {
    try {
        const [planos, partidas] = await Promise.all([
            api('/planos?page=1&limit=1'),
            api('/partidas?page=1&limit=1')
        ]);

        qs('#metric-planos').textContent = planos.pagination.total;
        qs('#metric-partidas').textContent = partidas.pagination.total;
        qs('#metric-api').textContent = 'online';
    } catch (error) {
        qs('#metric-planos').textContent = demo.planos.length;
        qs('#metric-partidas').textContent = demo.partidas.length;
        qs('#metric-api').textContent = 'demo';
    }
}

async function loadPlanos() {
    const container = qs('#planos-list');
    container.innerHTML = '<p class="muted">Carregando planos...</p>';

    try {
        const result = await api(`/planos?${paramsFrom(state.filters.planos, state.page.planos)}`);
        renderPlanos(result);
    } catch (error) {
        renderPlanos(demoResult('planos'), true);
    }
}

function renderPlanos(result, isDemo = false) {
    const container = qs('#planos-list');
    state.planos = result.data;
    fillPlanSelect();
    container.innerHTML = `
        ${isDemo ? '<p class="muted">Dados de demonstracao. Configure o MySQL para usar dados reais.</p>' : ''}
        ${result.data.map((plano) => `
            <article class="card">
                <span class="badge">Plano</span>
                <h2>${plano.nome_plano}</h2>
                <p>${plano.beneficios || 'Beneficios exclusivos para socios.'}</p>
                <div class="price">${money(plano.mensalidade)}<span class="muted">/mes</span></div>
                <button class="primary-action" type="button" data-route="minha-conta">Assinar</button>
            </article>
        `).join('') || '<p class="muted">Nenhum plano encontrado.</p>'}
    `;
    renderPager('planos', result.pagination);
    bindRouteButtons();
}

async function loadPartidas() {
    const container = qs('#partidas-list');
    container.innerHTML = '<tr><td colspan="5">Carregando partidas...</td></tr>';

    try {
        const result = await api(`/partidas?${paramsFrom(state.filters.partidas, state.page.partidas)}`);
        renderPartidas(result);
    } catch (error) {
        renderPartidas(demoResult('partidas'), true);
    }
}

function renderPartidas(result, isDemo = false) {
    const container = qs('#partidas-list');
    container.innerHTML = `
        ${isDemo ? '<tr><td colspan="5">Dados de demonstracao. Configure o MySQL para usar dados reais.</td></tr>' : ''}
        ${result.data.map((partida) => `
            <tr>
                <td><strong>SPFC x ${partida.adversario}</strong></td>
                <td>${dateTime(partida.data_hora)}</td>
                <td>${partida.local || '-'}</td>
                <td>${partida.vagas_disponiveis ?? '-'}</td>
                <td><button class="secondary-action small" type="button" data-reservar="${partida.id}">Reservar</button></td>
            </tr>
        `).join('') || '<tr><td colspan="5">Nenhuma partida encontrada.</td></tr>'}
    `;
    renderPager('partidas', result.pagination);
    bindReservaButtons();
}

async function loadNoticias() {
    const container = qs('#noticias-list');
    container.innerHTML = '<p class="muted">Carregando noticias...</p>';

    try {
        const result = await api(`/noticias?${paramsFrom(state.filters.noticias, state.page.noticias)}`);
        renderNoticias(result);
    } catch (error) {
        renderNoticias(demoResult('noticias'), true);
    }
}

function renderNoticias(result, isDemo = false) {
    const container = qs('#noticias-list');
    container.innerHTML = `
        ${isDemo ? '<p class="muted">Dados de demonstracao. Configure o MySQL para usar dados reais.</p>' : ''}
        ${result.data.map((noticia) => `
            <article class="card">
                <span class="badge">${noticia.categoria || 'Noticia'}</span>
                <h2>${noticia.titulo}</h2>
                <p>${String(noticia.conteudo || '').slice(0, 150)}${String(noticia.conteudo || '').length > 150 ? '...' : ''}</p>
            </article>
        `).join('') || '<p class="muted">Nenhuma noticia encontrada.</p>'}
    `;
    renderPager('noticias', result.pagination);
}

async function loadAtletas() {
    const container = qs('#atletas-list');
    container.innerHTML = '<p class="muted">Carregando atletas...</p>';

    try {
        const result = await api(`/atletas?${paramsFrom(state.filters.atletas, state.page.atletas)}`);
        renderAtletas(result);
    } catch (error) {
        renderAtletas(demoResult('atletas'), true);
    }
}

function renderAtletas(result, isDemo = false) {
    const container = qs('#atletas-list');
    container.innerHTML = `
        ${isDemo ? '<p class="muted">Dados de demonstracao. Configure o MySQL para usar dados reais.</p>' : ''}
        ${result.data.map((atleta) => `
            <article class="card">
                <span class="badge">${atleta.posicao || 'Atleta'}</span>
                <h2>${atleta.nome}</h2>
                <p>${atleta.apelido || 'Sem apelido cadastrado'}</p>
                <p class="muted">${atleta.nacionalidade || 'Nacionalidade nao informada'}</p>
            </article>
        `).join('') || '<p class="muted">Nenhum atleta encontrado.</p>'}
    `;
    renderPager('atletas', result.pagination);
}

async function loadAccount() {
    renderMember();
    await ensurePlanos();
    fillPlanSelect();

    if (!state.token) {
        qs('#assinaturas-list').innerHTML = '<p class="muted">Entre para ver assinaturas.</p>';
        qs('#reservas-list').innerHTML = '<p class="muted">Entre para ver reservas.</p>';
        return;
    }

    await Promise.all([loadMinhasAssinaturas(), loadMinhasReservas()]);
}

async function ensurePlanos() {
    if (state.planos.length > 0) {
        return;
    }

    try {
        const result = await api('/planos?page=1&limit=50');
        state.planos = result.data;
    } catch (error) {
        state.planos = demo.planos;
    }
}

function fillPlanSelect() {
    const select = qs('#assinatura-plano');

    if (!select) {
        return;
    }

    select.innerHTML = state.planos.map((plano) => (
        `<option value="${plano.id}">${plano.nome_plano} - ${money(plano.mensalidade)}</option>`
    )).join('');
}

function renderMember() {
    const card = qs('#member-card');

    if (!state.user) {
        card.innerHTML = `
            <p class="eyebrow">Sessao</p>
            <h2>Nenhum usuario logado</h2>
            <p>Entre para criar assinatura, consultar suas reservas e bloquear ingressos.</p>
        `;
        return;
    }

    card.innerHTML = `
        <p class="eyebrow">${state.user.tipo_usuario}</p>
        <h2>${state.user.nome}</h2>
        <p>${state.user.email}</p>
    `;
}

async function loadMinhasAssinaturas() {
    const container = qs('#assinaturas-list');
    container.innerHTML = '<p class="muted">Carregando...</p>';

    try {
        const result = await api('/assinaturas/minhas');
        container.innerHTML = result.map((assinatura) => `
            <article class="mini-item">
                <strong>${assinatura.nome_plano}</strong>
                <p>Status: ${assinatura.status} | Pagamento: ${assinatura.pagamento_status}</p>
                <p>${money(assinatura.valor_final)} por mes</p>
            </article>
        `).join('') || '<p class="muted">Nenhuma assinatura cadastrada.</p>';
    } catch (error) {
        container.innerHTML = `<p class="muted">${error.message}</p>`;
    }
}

async function loadMinhasReservas() {
    const container = qs('#reservas-list');
    container.innerHTML = '<p class="muted">Carregando...</p>';

    try {
        const result = await api('/reservas/minhas');
        container.innerHTML = result.map((reserva) => `
            <article class="mini-item">
                <strong>SPFC x ${reserva.adversario}</strong>
                <p>${dateTime(reserva.data_hora)} | ${reserva.quantidade} ingresso(s)</p>
                <p>Status: ${reserva.status} | Total: ${money(reserva.valor_total)}</p>
            </article>
        `).join('') || '<p class="muted">Nenhuma reserva cadastrada.</p>';
    } catch (error) {
        container.innerHTML = `<p class="muted">${error.message}</p>`;
    }
}

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function bindForms() {
    qsa('[data-list-form]').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = form.dataset.listForm;
            const data = formData(form);

            form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
                if (!input.checked) {
                    delete data[input.name];
                }
            });

            state.filters[name] = data;
            state.page[name] = 1;
            routes[name]();
        });
    });

    qs('#login-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            const result = await api('/auth/login', {
                method: 'POST',
                body: JSON.stringify(formData(event.currentTarget))
            });
            state.token = result.token;
            state.user = result.usuario;
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.usuario));
            showToast('Login realizado');
            loadAccount();
        } catch (error) {
            showToast(error.message);
        }
    });

    qs('#register-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            const result = await api('/auth/register', {
                method: 'POST',
                body: JSON.stringify(formData(event.currentTarget))
            });
            state.token = result.token;
            state.user = result.usuario;
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.usuario));
            showToast('Conta criada');
            loadAccount();
        } catch (error) {
            showToast(error.message);
        }
    });

    qs('#assinatura-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!state.token) {
            showToast('Entre na sua conta para assinar');
            return;
        }

        try {
            await api('/assinaturas', {
                method: 'POST',
                body: JSON.stringify(formData(event.currentTarget))
            });
            event.currentTarget.reset();
            showToast('Assinatura criada. Aguarde aprovacao.');
            loadMinhasAssinaturas();
        } catch (error) {
            showToast(error.message);
        }
    });

    qs('#logout-button').addEventListener('click', () => {
        state.token = '';
        state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Sessao encerrada');
        loadAccount();
    });
}

function bindRouteButtons() {
    qsa('[data-route]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            setRoute(button.dataset.route);
        });
    });
}

function bindReservaButtons() {
    qsa('[data-reservar]').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!state.token) {
                showToast('Entre na sua conta para reservar');
                setRoute('minha-conta');
                return;
            }

            const quantidade = window.prompt('Quantidade de ingressos', '1');

            if (!quantidade) {
                return;
            }

            try {
                await api(`/partidas/${button.dataset.reservar}/reservas`, {
                    method: 'POST',
                    body: JSON.stringify({ quantidade })
                });
                showToast('Ingressos bloqueados por 15 minutos');
                loadPartidas();
            } catch (error) {
                showToast(error.message);
            }
        });
    });
}

function boot() {
    bindRouteButtons();
    bindForms();
    setRoute(window.location.hash.replace('#', '') || 'inicio');
}

boot();
