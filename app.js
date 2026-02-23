document.addEventListener('DOMContentLoaded', () => {
    // ─── State ───
    let requests = [];
    let manuals = [];
    let ngs = [];
    let restaurants = [];
    let participants = [];
    let draftPlans = [];

    // ─── DOM ───
    const reqInput = document.getElementById('request-input');
    const addReqBtn = document.getElementById('add-request-btn');
    const reqList = document.getElementById('request-list');
    const manualInput = document.getElementById('manual-input');
    const addManualBtn = document.getElementById('add-manual-btn');
    const manualList = document.getElementById('manual-list');
    const ngInput = document.getElementById('ng-input');
    const addNgBtn = document.getElementById('add-ng-btn');
    const ngList = document.getElementById('ng-list');

    const budgetMin = document.getElementById('budget-min');
    const budgetMax = document.getElementById('budget-max');
    const restList = document.getElementById('restaurant-list');
    const addRestBtn = document.getElementById('add-restaurant-btn');
    const modal = document.getElementById('restaurant-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const manualApiSearch = document.getElementById('manual-api-search');
    const manualApiBtn = document.getElementById('manual-api-btn');
    const manualApiResults = document.getElementById('manual-api-results');
    const resultsModal = document.getElementById('results-modal');
    const closeResultsBtn = document.getElementById('close-results-btn');
    const resultsPreviewList = document.getElementById('results-preview-list');
    const addSelectedBtn = document.getElementById('add-selected-results-btn');
    const selectAllCheck = document.getElementById('select-all-results');
    const resultsCountBadge = document.getElementById('results-count-badge');
    let previewRestaurants = [];
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

    // ─── Keyword Validation & Dictionary ───
    const synonymDict = {
        'のみほうだい': '飲み放題', 'のみほ': '飲み放題',
        'たべほうだい': '食べ放題', 'たべほ': '食べ放題',
        'やきにく': '焼肉',
        'こしつ': '個室',
        'えきつか': '駅近', 'えきちか': '駅近',
        'じょしかい': '女子会',
        'わしょく': '和食',
        'ちゅうか': '中華',
        'いたりあん': 'イタリアン',
        'ふれんち': 'フレンチ'
    };

    const checkKeywordValidity = async (keyword) => {
        const apiKey = 'f15b7ad9efab6381';
        const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}&format=json&count=1`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        try {
            const res = await fetch(proxyUrl);
            if (!res.ok) return true; // Fail silently if proxy is down
            const data = await res.json();
            return data.results && data.results.shop && data.results.shop.length > 0;
        } catch (e) {
            return true;
        }
    };

    const addRequest = async (val) => {
        const parts = val.split(/[,、]/).map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;

        reqInput.value = ''; // clear early
        autoSearchBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> ワード確認中...';
        autoSearchBtn.disabled = true;

        for (const cleanVal of parts) {
            const isValid = await checkKeywordValidity(cleanVal);
            if (!isValid) {
                const suggestion = synonymDict[cleanVal];
                let msg = `「${cleanVal}」はホットペッパーで検索結果が見つからない可能性があります。`;
                if (suggestion) {
                    if (confirm(`${msg}\n\nもしかして：「${suggestion}」ですか？\n「OK」を押すと「${suggestion}」を追加します。`)) {
                        requests.push(suggestion);
                    }
                } else {
                    alert(`${msg}\n検索にはヒットしないため、店舗確認用リスト（検索不使用）への追加をおすすめします。`);
                }
            } else {
                requests.push(cleanVal);
            }
        }

        autoSearchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> 条件に合うお店を自動検索';
        autoSearchBtn.disabled = false;
        renderTags(requests, reqList, 'req');
    };

    const removeRequest = (idx) => { requests.splice(idx, 1); renderTags(requests, reqList, 'req'); };

    const addManual = (val) => {
        const parts = val.split(/[,、]/).map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;
        parts.forEach(p => manuals.push(p));
        manualInput.value = '';
        renderTags(manuals, manualList, 'manual');
    };
    const removeManual = (idx) => { manuals.splice(idx, 1); renderTags(manuals, manualList, 'manual'); };

    const addNg = (val) => {
        const parts = val.split(/[,、]/).map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;
        parts.forEach(p => ngs.push(p));
        ngInput.value = '';
        renderTags(ngs, ngList, 'ng');
    };
    const removeNg = (idx) => { ngs.splice(idx, 1); renderTags(ngs, ngList, 'ng'); };

    const renderTags = (arr, container, type) => {
        container.innerHTML = '';
        arr.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'tag-item';
            li.innerHTML = `${item} <button data-index="${index}"><i class="ph ph-x"></i></button>`;
            li.querySelector('button').addEventListener('click', () => {
                if (type === 'ng') removeNg(index);
                else if (type === 'manual') removeManual(index);
                else removeRequest(index);
            });
            container.appendChild(li);
        });
        renderRestaurants();
    };

    addReqBtn.addEventListener('click', () => addRequest(reqInput.value));
    reqInput.addEventListener('keypress', (e) => e.key === 'Enter' && addRequest(reqInput.value));
    addManualBtn.addEventListener('click', () => addManual(manualInput.value));
    manualInput.addEventListener('keypress', (e) => e.key === 'Enter' && addManual(manualInput.value));
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
        if (requests.length === 0 && !budgetMin.value && !budgetMax.value) {
            alert('「必須条件・希望」か「予算」のいずれかを指定してください。');
            return;
        }

        const keyword = requests.join(' ');
        const apiKey = 'f15b7ad9efab6381';

        const allBudgetCodes = ['B009', 'B010', 'B011', 'B001', 'B002', 'B003', 'B008', 'B004', 'B005', 'B006'];
        let budgetQuery = '';
        let isClientSideBudgetFilter = false;
        let selectedCodes = [];
        if (budgetMin.value || budgetMax.value) {
            let startIndex = budgetMin.value ? allBudgetCodes.indexOf(budgetMin.value) : 0;
            let endIndex = budgetMax.value ? allBudgetCodes.indexOf(budgetMax.value) : allBudgetCodes.length - 1;

            if (startIndex > endIndex) {
                alert('予算の金額設定が正しくありません。\n上限は下限より高い金額を設定してください。');
                return;
            }

            selectedCodes = allBudgetCodes.slice(startIndex, endIndex + 1);
            if (selectedCodes.length <= 3) {
                budgetQuery = selectedCodes.map(code => `&budget=${code}`).join('');
            } else {
                isClientSideBudgetFilter = true;
            }
        }

        const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}${budgetQuery}&format=json&count=50`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        autoSearchBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> 検索中...';
        autoSearchBtn.disabled = true;

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) throw new Error('API_ERROR_CLIENT');
                throw new Error('NETWORK_ERROR');
            }

            const data = await response.json();
            if (data.results && data.results.error) throw new Error('API_ERROR_RESPONSE');

            if (data.results && data.results.shop && data.results.shop.length > 0) {
                const isYokohamaSearch = requests.some(r => r.includes('横浜')) && !requests.some(r => r.includes('新横浜'));

                let filteredShops = data.results.shop.filter(shop => {
                    const text = (shop.name + (shop.address || '') + (shop.catch || '') + (shop.station_name || '')).toLowerCase();
                    if (ngs.length > 0 && ngs.some(ng => text.includes(ng.toLowerCase()))) return false;
                    if (isYokohamaSearch && text.includes('新横浜')) return false;
                    if (isClientSideBudgetFilter && shop.budget && shop.budget.code && !selectedCodes.includes(shop.budget.code)) return false;
                    return true;
                });

                if (filteredShops.length === 0) {
                    alert('条件に一致するお店が見つかりませんでした。\n（NG条件や予算によって全て除外されました）');
                    return;
                }

                previewRestaurants = filteredShops.map(shop => ({
                    id: generateId(),
                    name: shop.name,
                    url: (shop.urls && shop.urls.pc) || '',
                    price: (shop.budget && shop.budget.name) || '',
                    feature: shop.catch || (shop.genre && shop.genre.name) || '',
                    access: shop.mobile_access || shop.access || '',
                    isFavorite: false,
                    checks: {},
                    plans: []
                }));

                resultsPreviewList.innerHTML = '';
                previewRestaurants.forEach((rest, index) => {
                    const li = document.createElement('li');
                    li.className = 'preview-card selected';
                    li.innerHTML = `
                        <input type="checkbox" class="toggle-checkbox preview-card-checkbox" data-index="${index}" checked>
                        <div class="preview-card-content">
                            <h4 style="margin-bottom:0.25rem;color:var(--text-main);"><a href="${rest.url}" target="_blank" style="text-decoration:none;color:inherit;">${rest.name}</a></h4>
                            <div style="font-size:0.8rem;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:0.5rem;">
                                ${rest.price ? `<span><i class="ph ph-currency-jpy"></i> ${rest.price}</span>` : ''}
                                ${rest.feature ? `<span><i class="ph ph-tag"></i> ${rest.feature}</span>` : ''}
                                ${rest.access ? `<span><i class="ph ph-map-pin"></i> ${rest.access}</span>` : ''}
                            </div>
                        </div>
                    `;
                    const cb = li.querySelector('.preview-card-checkbox');
                    cb.addEventListener('change', (e) => {
                        if (e.target.checked) li.classList.add('selected');
                        else li.classList.remove('selected');
                        selectAllCheck.checked = document.querySelectorAll('.preview-card-checkbox:checked').length === previewRestaurants.length;
                    });
                    resultsPreviewList.appendChild(li);
                });

                resultsCountBadge.textContent = `${previewRestaurants.length}件ヒット`;
                selectAllCheck.checked = true;
                resultsModal.classList.remove('hidden');

            } else {
                alert('条件に一致するお店が見つかりませんでした。\nキーワードを変えてお試しください。');
            }
        } catch (error) {
            console.error('Search error:', error);
            if (error.message === 'API_ERROR_CLIENT' || error.message === 'API_ERROR_RESPONSE') {
                alert('検索条件に誤りがあるか、条件が複雑すぎてAPIエラーになりました。（予算の上限・下限の幅を広げるか、キーワードを減らしてみてください）');
            } else {
                alert('通信エラーが発生しました。インターネット接続を確認してください。\n（※ローカルファイルからの場合はWebサーバー経由でお試しください）');
            }
        } finally {
            autoSearchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> 条件に合うお店を自動検索';
            autoSearchBtn.disabled = false;
        }
    };

    autoSearchBtn.addEventListener('click', handleAutoSearch);

    closeResultsBtn.addEventListener('click', () => resultsModal.classList.add('hidden'));

    selectAllCheck.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.preview-card-checkbox').forEach(cb => {
            cb.checked = isChecked;
            const card = cb.closest('.preview-card');
            if (isChecked) card.classList.add('selected');
            else card.classList.remove('selected');
        });
    });

    addSelectedBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.preview-card-checkbox:checked');
        checkboxes.forEach(cb => {
            const index = cb.getAttribute('data-index');
            const shop = previewRestaurants[index];
            if (shop) addRestaurant(shop);
        });
        resultsModal.classList.add('hidden');
    });

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
            isFavorite: false,
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

    const toggleFavorite = (id) => {
        const rest = restaurants.find(r => r.id === id);
        if (rest) {
            rest.isFavorite = !rest.isFavorite;
            renderRestaurants(); // Re-render triggers sorting
        }
    };

    const renderRestaurants = () => {
        restList.innerHTML = '';
        updateEmptyState();

        // Sort restaurants: favorites first
        const sortedRestaurants = [...restaurants].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
        });

        sortedRestaurants.forEach(rest => {
            const card = document.createElement('div');
            card.className = 'rest-card';

            const titleLink = rest.url
                ? `<a href="${rest.url}" target="_blank">${rest.name} <i class="ph ph-arrow-square-out" style="font-size:0.85rem;opacity:0.5"></i></a>`
                : rest.name;

            // Condition checks
            let checksHtml = '';
            const allConditions = [
                ...requests.map(r => ({ type: 'req', text: r })),
                ...manuals.map(m => ({ type: 'manual', text: m })),
                ...ngs.map(n => ({ type: 'ng', text: n }))
            ];
            if (allConditions.length > 0) {
                checksHtml = `
                    <div class="rest-check-section">
                        <h4><i class="ph ph-check-square-offset"></i> 確認リスト</h4>
                        ${allConditions.map(cond => {
                    const checkKey = `${cond.type}_${cond.text}`;
                    const isChecked = rest.checks[checkKey] || false;
                    let icon = '<i class="ph ph-check"></i>';
                    if (cond.type === 'req') icon = '<i class="ph ph-star"></i>';
                    if (cond.type === 'ng') icon = '<i class="ph ph-warning-circle"></i>';
                    if (cond.type === 'manual') icon = '<i class="ph ph-list-checks"></i>';

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
            let plansHtml = `
                <div class="card-plans-section">
                    <h4><i class="ph ph-list-bullets"></i> プラン候補</h4>
                    <ul class="plan-list" style="${rest.plans && rest.plans.length > 0 ? '' : 'display:none;'}">
                        ${(rest.plans || []).map((p, pIndex) => `
                            <li class="plan-item">
                                <div class="plan-info">
                                    <span class="plan-name">${p.name}</span>
                                    ${p.price ? `<span class="plan-price">${p.price}</span>` : ''}
                                </div>
                                <button class="icon-btn delete-plan-btn" data-rest-id="${rest.id}" data-plan-index="${pIndex}" style="min-width:28px;height:28px;border:none;background:transparent;color:var(--danger);"><i class="ph ph-x"></i></button>
                            </li>`).join('')}
                    </ul>
                    <div class="inline-plan-form">
                        <input type="text" placeholder="プラン名" class="inline-plan-name" style="flex:2">
                        <input type="text" placeholder="金額(任意)" class="inline-plan-price" style="flex:1">
                        <button class="icon-btn inline-add-plan" data-id="${rest.id}"><i class="ph ph-plus"></i></button>
                    </div>
                </div>`;

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
                        <button class="icon-btn fav-btn ${rest.isFavorite ? 'is-favorite' : ''}" data-id="${rest.id}">
                            <i class="${rest.isFavorite ? 'ph-fill' : 'ph'} ph-star"></i>
                        </button>
                        <button class="icon-btn delete-btn" data-id="${rest.id}">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </div>
                ${plansHtml}
                ${checksHtml}
            `;

            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                deleteRestaurant(e.currentTarget.getAttribute('data-id'));
            });
            card.querySelector('.fav-btn').addEventListener('click', (e) => {
                toggleFavorite(e.currentTarget.getAttribute('data-id'));
            });
            card.querySelector('.inline-add-plan').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const nameInp = card.querySelector('.inline-plan-name');
                const priceInp = card.querySelector('.inline-plan-price');
                const name = nameInp.value.trim();
                const price = priceInp.value.trim();
                if (name) {
                    const targetRest = restaurants.find(r => r.id === id);
                    if (targetRest) {
                        targetRest.plans = targetRest.plans || [];
                        targetRest.plans.push({ id: generateId(), name, price });
                        renderRestaurants();
                    }
                }
            });
            card.querySelectorAll('.delete-plan-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rId = e.currentTarget.getAttribute('data-rest-id');
                    const pIdx = parseInt(e.currentTarget.getAttribute('data-plan-index'), 10);
                    const targetRest = restaurants.find(r => r.id === rId);
                    if (targetRest && targetRest.plans) {
                        targetRest.plans.splice(pIdx, 1);
                        renderRestaurants();
                    }
                });
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

    // ─── Manual Add Modal API Auto-fill ───
    manualApiBtn.addEventListener('click', async () => {
        const keyword = manualApiSearch.value.trim();
        if (!keyword) return;
        manualApiBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
        manualApiResults.innerHTML = '';
        manualApiResults.classList.add('hidden');

        try {
            const apiKey = 'f15b7ad9efab6381';
            const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}&format=json&count=5`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const res = await fetch(proxyUrl);
            const data = await res.json();
            if (data.results && data.results.shop && data.results.shop.length > 0) {
                data.results.shop.forEach(shop => {
                    const li = document.createElement('li');
                    li.className = 'api-result-item';
                    li.innerHTML = `<div class="api-result-name">${shop.name}</div><div class="api-result-meta">${shop.access || ''}</div>`;
                    li.addEventListener('click', () => {
                        restNameInput.value = shop.name;
                        restUrlInput.value = (shop.urls && shop.urls.pc) || '';
                        restPriceInput.value = (shop.budget && shop.budget.name) || '';
                        restFeatureInput.value = shop.catch || (shop.genre && shop.genre.name) || '';
                        restAccessInput.value = shop.mobile_access || shop.access || '';
                        manualApiResults.classList.add('hidden');
                        manualApiSearch.value = '';
                    });
                    manualApiResults.appendChild(li);
                });
                manualApiResults.classList.remove('hidden');
            } else {
                alert('該当する店舗が見つかりませんでした。');
            }
        } catch (e) {
            alert('検索中にエラーが発生しました。ネットワーク接続を確認してください。');
        } finally {
            manualApiBtn.innerHTML = '検索';
        }
    });

    manualApiSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            manualApiBtn.click();
        }
    });

    // ─── Init (no presets) ───
    updateEmptyState();
});
