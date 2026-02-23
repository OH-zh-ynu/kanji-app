document.addEventListener('DOMContentLoaded', () => {
    // ─── State ───
    let requests = [];
    let ngs = [];
    let restaurants = [];
    let participants = [];
    let draftPlans = [];

    // ─── DOM ───
    const reqInput = document.getElementById('request-input');
    const addReqBtn = document.getElementById('add-request-btn');
    const reqList = document.getElementById('request-list');
    const ngInput = document.getElementById('ng-input');
    const addNgBtn = document.getElementById('add-ng-btn');
    const ngList = document.getElementById('ng-list');
    const restList = document.getElementById('restaurant-list');
    const addRestBtn = document.getElementById('add-restaurant-btn');
    const modal = document.getElementById('restaurant-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveRestBtn = document.getElementById('save-restaurant-btn');
    const restNameInput = document.getElementById('rest-name');
    const restUrlInput = document.getElementById('rest-url');
    const restPriceInput = document.getElementById('rest-price');
    const restFeatureInput = document.getElementById('rest-feature');
    const restAccessInput = document.getElementById('rest-access');
    const planNameInput = document.getElementById('plan-name-input');
    const planPriceInput = document.getElementById('plan-price-input');
    const addPlanBtn = document.getElementById('add-plan-btn');
    const modalPlanList = document.getElementById('modal-plan-list');
    const generalMemo = document.getElementById('general-memo');
    const autoSearchBtn = document.getElementById('auto-search-btn');
    const toggleParticipants = document.getElementById('toggle-participants');
    const participantsContainer = document.getElementById('participants-container');
    const partNameInput = document.getElementById('participant-name-input');
    const partNoteInput = document.getElementById('participant-note-input');
    const addPartBtn = document.getElementById('add-participant-btn');
    const partList = document.getElementById('participant-list');
    const emptyState = document.getElementById('empty-state');

    const generateId = () => Math.random().toString(36).substring(2, 9);

    // ─── Empty State ───
    const updateEmptyState = () => {
        if (emptyState) {
            emptyState.style.display = restaurants.length === 0 ? 'block' : 'none';
        }
    };

    // ─── Tags ───
    const renderTags = (arr, container, isDanger) => {
        container.innerHTML = '';
        arr.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'tag-item';
            li.innerHTML = `${item} <button data-index="${index}"><i class="ph ph-x"></i></button>`;
            li.querySelector('button').addEventListener('click', () => {
                if (isDanger) removeNg(index);
                else removeRequest(index);
            });
            container.appendChild(li);
        });
        renderRestaurants();
    };

    const addRequest = (val) => {
        if (!val.trim()) return;
        requests.push(val.trim());
        reqInput.value = '';
        renderTags(requests, reqList, false);
    };
    const removeRequest = (idx) => { requests.splice(idx, 1); renderTags(requests, reqList, false); };
    const addNg = (val) => {
        if (!val.trim()) return;
        ngs.push(val.trim());
        ngInput.value = '';
        renderTags(ngs, ngList, true);
    };
    const removeNg = (idx) => { ngs.splice(idx, 1); renderTags(ngs, ngList, true); };

    addReqBtn.addEventListener('click', () => addRequest(reqInput.value));
    reqInput.addEventListener('keypress', (e) => e.key === 'Enter' && addRequest(reqInput.value));
    addNgBtn.addEventListener('click', () => addNg(ngInput.value));
    ngInput.addEventListener('keypress', (e) => e.key === 'Enter' && addNg(ngInput.value));

    // ─── Participants ───
    toggleParticipants.addEventListener('change', (e) => {
        participantsContainer.classList.toggle('hidden', !e.target.checked);
    });

    const renderParticipants = () => {
        partList.innerHTML = '';
        participants.forEach((p, index) => {
            const li = document.createElement('li');
            li.className = 'participant-item';
            li.innerHTML = `
                <div class="participant-info">
                    <span class="participant-name">${p.name}</span>
                    ${p.note ? `<span class="participant-note">${p.note}</span>` : ''}
                </div>
                <button class="icon-btn delete-btn" style="min-width:28px;height:28px;"><i class="ph ph-trash"></i></button>
            `;
            li.querySelector('button').addEventListener('click', () => removeParticipant(index));
            partList.appendChild(li);
        });
    };

    const addParticipant = (name, note) => {
        if (!name.trim()) return;
        participants.push({ name: name.trim(), note: (note || '').trim() });
        partNameInput.value = '';
        partNoteInput.value = '';
        renderParticipants();
    };
    const removeParticipant = (idx) => { participants.splice(idx, 1); renderParticipants(); };

    addPartBtn.addEventListener('click', () => addParticipant(partNameInput.value, partNoteInput.value));
    partNameInput.addEventListener('keypress', (e) => e.key === 'Enter' && addParticipant(partNameInput.value, partNoteInput.value));
    partNoteInput.addEventListener('keypress', (e) => e.key === 'Enter' && addParticipant(partNameInput.value, partNoteInput.value));

    // ─── Draft Plans (Modal) ───
    const renderDraftPlans = () => {
        modalPlanList.innerHTML = '';
        draftPlans.forEach((plan, index) => {
            const li = document.createElement('li');
            li.className = 'plan-item';
            li.innerHTML = `
                <div class="plan-info">
                    <span class="plan-name">${plan.name}</span>
                    ${plan.price ? `<span class="plan-price">${plan.price}</span>` : ''}
                </div>
                <button class="icon-btn delete-btn" style="min-width:28px;height:28px;"><i class="ph ph-trash"></i></button>
            `;
            li.querySelector('button').addEventListener('click', () => { draftPlans.splice(index, 1); renderDraftPlans(); });
            modalPlanList.appendChild(li);
        });
    };

    addPlanBtn.addEventListener('click', () => {
        const name = planNameInput.value.trim();
        if (!name) return;
        draftPlans.push({ id: generateId(), name, price: planPriceInput.value.trim() });
        planNameInput.value = '';
        planPriceInput.value = '';
        renderDraftPlans();
    });

    // ─── Auto Search (Hotpepper API) ───
    const handleAutoSearch = async () => {
        // Build a focused keyword string from ONLY the request tags
        // The memo is for the user's own notes, not for API search
        if (requests.length === 0) {
            alert('「必須条件・希望」に検索キーワード（例: 新宿 個室）を追加してください。');
            return;
        }

        const keyword = requests.join(' ');
        const apiKey = 'f15b7ad9efab6381';
        const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}&format=json&count=10`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        autoSearchBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> 検索中...';
        autoSearchBtn.disabled = true;

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data.results && data.results.shop && data.results.shop.length > 0) {
                data.results.shop.forEach(shop => {
                    addRestaurant({
                        id: generateId(),
                        name: shop.name,
                        url: (shop.urls && shop.urls.pc) || '',
                        price: (shop.budget && shop.budget.name) || '',
                        feature: shop.catch || (shop.genre && shop.genre.name) || '',
                        access: shop.mobile_access || shop.access || '',
                        checks: {},
                        plans: []
                    });
                });
            } else {
                alert('条件に一致するお店が見つかりませんでした。\nキーワードを変えてお試しください。');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('検索に失敗しました。\nインターネット接続を確認してください。\n\n※ローカルファイルから直接開いた場合はセキュリティ制限で動作しないことがあります。Webサーバー経由でお試しください。');
        } finally {
            autoSearchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> 条件に合うお店を自動検索';
            autoSearchBtn.disabled = false;
        }
    };

    autoSearchBtn.addEventListener('click', handleAutoSearch);

    // ─── Modal ───
    const openModal = () => {
        restNameInput.value = '';
        restUrlInput.value = '';
        restPriceInput.value = '';
        restFeatureInput.value = '';
        restAccessInput.value = '';
        draftPlans = [];
        renderDraftPlans();
        modal.classList.remove('hidden');
    };
    const closeModal = () => modal.classList.add('hidden');

    addRestBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    saveRestBtn.addEventListener('click', () => {
        const name = restNameInput.value.trim();
        if (!name) return alert('店名を入力してください');
        addRestaurant({
            id: generateId(),
            name,
            url: restUrlInput.value.trim(),
            price: restPriceInput.value.trim(),
            feature: restFeatureInput.value.trim(),
            access: restAccessInput.value.trim(),
            checks: {},
            plans: [...draftPlans]
        });
        closeModal();
    });

    // ─── Restaurants ───
    const addRestaurant = (rest) => {
        restaurants.push(rest);
        renderRestaurants();
    };

    const deleteRestaurant = (id) => {
        restaurants = restaurants.filter(r => r.id !== id);
        renderRestaurants();
    };

    const updateRestCheck = (restId, checkKey, isChecked) => {
        const rest = restaurants.find(r => r.id === restId);
        if (rest) rest.checks[checkKey] = isChecked;
    };

    const renderRestaurants = () => {
        restList.innerHTML = '';
        updateEmptyState();

        restaurants.forEach(rest => {
            const card = document.createElement('div');
            card.className = 'rest-card';

            const titleLink = rest.url
                ? `<a href="${rest.url}" target="_blank">${rest.name} <i class="ph ph-arrow-square-out" style="font-size:0.85rem;opacity:0.5"></i></a>`
                : rest.name;

            // Condition checks
            let checksHtml = '';
            const allConditions = [
                ...requests.map(r => ({ type: 'req', text: r })),
                ...ngs.map(n => ({ type: 'ng', text: n }))
            ];
            if (allConditions.length > 0) {
                checksHtml = `
                    <div class="rest-check-section">
                        <h4><i class="ph ph-check-square-offset"></i> 条件チェック</h4>
                        ${allConditions.map(cond => {
                    const checkKey = `${cond.type}_${cond.text}`;
                    const isChecked = rest.checks[checkKey] || false;
                    const icon = cond.type === 'req' ? '<i class="ph ph-star"></i>' : '<i class="ph ph-warning-circle"></i>';
                    const cls = cond.type === 'ng' ? 'danger-text' : '';
                    return `<div class="check-item">
                                <span class="check-label ${cls}">${icon} ${cond.text}</span>
                                <input type="checkbox" class="toggle-checkbox condition-toggle"
                                       data-rest-id="${rest.id}" data-check-key="${checkKey}"
                                       ${isChecked ? 'checked' : ''}>
                            </div>`;
                }).join('')}
                    </div>`;
            }

            // Plans
            let plansHtml = '';
            if (rest.plans && rest.plans.length > 0) {
                plansHtml = `
                    <div class="card-plans-section">
                        <h4><i class="ph ph-list-bullets"></i> プラン候補</h4>
                        <ul class="plan-list">
                            ${rest.plans.map(p => `
                                <li class="plan-item">
                                    <div class="plan-info">
                                        <span class="plan-name">${p.name}</span>
                                        ${p.price ? `<span class="plan-price">${p.price}</span>` : ''}
                                    </div>
                                </li>`).join('')}
                        </ul>
                    </div>`;
            }

            card.innerHTML = `
                <div class="rest-card-header">
                    <div>
                        <h3 class="rest-name">${titleLink}</h3>
                        <div class="rest-meta">
                            ${rest.price ? `<span><i class="ph ph-currency-jpy"></i> ${rest.price}</span>` : ''}
                            ${rest.feature ? `<span><i class="ph ph-tag"></i> ${rest.feature}</span>` : ''}
                            ${rest.access ? `<span><i class="ph ph-map-pin"></i> ${rest.access}</span>` : ''}
                        </div>
                    </div>
                    <div class="rest-actions">
                        <button class="icon-btn delete-btn" data-id="${rest.id}"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                ${plansHtml}
                ${checksHtml}
            `;

            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                deleteRestaurant(e.currentTarget.getAttribute('data-id'));
            });
            card.querySelectorAll('.condition-toggle').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    updateRestCheck(
                        e.target.getAttribute('data-rest-id'),
                        e.target.getAttribute('data-check-key'),
                        e.target.checked
                    );
                });
            });

            restList.appendChild(card);
        });
    };

    // ─── Init (no presets) ───
    updateEmptyState();
});
