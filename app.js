document.addEventListener('DOMContentLoaded', () => {
    // ─── State ───
    let requests = [];
    let manuals = [];
    let ngs = [];
    let restaurants = [];
    let draftPlans = [];
    // Initialize matrix with example data from user screenshot
    let matrix = {
        cols: ['ともき', 'けいすけ', 'ひさき', 'こうし'],
        rows: ['苦手', 'ビール', '希望'],
        data: {
            '0_0': 'きのこ', '0_1': 'ー', '0_2': 'マヨネーズ', '0_3': '貝、きのこ',
            '1_0': '〜', '1_1': '〜', '1_2': '〇', '1_3': '△',
            '2_0': '唐揚げ', '2_1': '鍋', '2_2': '(鍋/焼き鳥)', '2_3': 'バターポテト肉寿司'
        }
    };

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

    // Share DOM
    const shareBtn = document.getElementById('share-btn');
    const shareModal = document.getElementById('share-modal');
    const closeShareModal = document.getElementById('close-share-modal');
    const shareTextOutput = document.getElementById('share-text-output');
    const copyShareTextBtn = document.getElementById('copy-share-text-btn');
    const shareUrlOutput = document.getElementById('share-url-output');
    const copyShareUrlBtn = document.getElementById('copy-share-url-btn');

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

    // Matrix DOM
    const toggleParticipants = document.getElementById('toggle-participants');
    const participantsContainer = document.getElementById('participants-container');
    const addMatrixColBtn = document.getElementById('add-matrix-col-btn');
    const addMatrixRowBtn = document.getElementById('add-matrix-row-btn');
    const participantMatrix = document.getElementById('participant-matrix');

    const emptyState = document.getElementById('empty-state');

    const generateId = () => Math.random().toString(36).substring(2, 9);

    // ─── Initialization & Readonly Check ───
    const meetingNameInput = document.getElementById('meeting-name-input');
    const headerTitleText = document.getElementById('header-title-text');
    const headerMeetingName = document.getElementById('header-meeting-name');
    const readonlyFooter = document.getElementById('readonly-footer');

    const urlParams = new URLSearchParams(window.location.search);
    const shareData = urlParams.get('share');
    let isReadonly = false;
    let meetingName = '';

    if (shareData) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(shareData))));
            if (Array.isArray(decoded)) {
                restaurants = decoded;
            } else {
                restaurants = decoded.data || [];
                meetingName = decoded.name || '';
            }
            document.body.classList.add('readonly-mode');
            isReadonly = true;

            if (meetingName) {
                if (headerTitleText) headerTitleText.innerText = `【${meetingName}】飲み会候補店リスト`;
                document.title = `【${meetingName}】幹事スマートアシスト`;
            } else {
                if (headerTitleText) headerTitleText.innerText = '飲み会候補店リスト';
            }
            if (headerMeetingName) headerMeetingName.style.display = 'none';
            if (readonlyFooter) readonlyFooter.classList.remove('hidden');

        } catch (e) {
            console.error('Failed to parse share data', e);
        }
    }

    // ─── Empty State ───
    const updateEmptyState = () => {
        const isEmpty = restaurants.length === 0;
        emptyState.style.display = isEmpty && !isReadonly ? 'block' : 'none';
        restList.style.display = isEmpty ? 'none' : 'grid';
    };

    // ─── Toasts ───
    const toastContainer = document.getElementById('toast-container');
    const createToast = (message, type = 'loading') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconHtml = '';
        if (type === 'success') iconHtml = '<i class="ph ph-check-circle toast-icon"></i>';
        else if (type === 'error') iconHtml = '<i class="ph ph-x-circle toast-icon"></i>';
        else if (type === 'warning') iconHtml = '<i class="ph ph-warning toast-icon"></i>';
        else iconHtml = '<i class="ph ph-spinner ph-spin toast-icon"></i>'; // loading

        toast.innerHTML = `${iconHtml}<span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Trigger reflow for slide-in animation
        toast.offsetHeight;
        toast.classList.add('show');

        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        };

        // Auto remove non-loading toasts
        if (type !== 'loading') {
            setTimeout(removeToast, 4000);
        }

        return removeToast;
    };

    // ─── API Wrapper (with retry) ───
    const fetchWithRetry = async (url, retries = 2) => {
        for (let i = 0; i <= retries; i++) {
            try {
                const res = await fetch(url);
                if (!res.ok) {
                    if (res.status >= 400 && res.status < 500) throw new Error('API_ERROR_CLIENT');
                    throw new Error('NETWORK_ERROR');
                }
                return await res.json();
            } catch (err) {
                if (i === retries) throw err;
                // Wait briefly before retrying (e.g. for proxy to wake up)
                await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 2000));
            }
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

    const checkKeywordValidity = async (keyword, toastUpdater) => {
        const apiKey = 'f15b7ad9efab6381';
        const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}&format=json&count=1`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        try {
            const data = await fetchWithRetry(proxyUrl, 1);
            return data.results && data.results.shop && data.results.shop.length > 0;
        } catch (e) {
            return true; // Fail silently
        }
    };

    const addRequest = async (val) => {
        const parts = val.split(/[,、]/).map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return;

        reqInput.value = ''; // clear early
        autoSearchBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> API準備中...';
        autoSearchBtn.disabled = true;
        autoSearchBtn.classList.add('btn-loading');

        let removeToast = null;
        if (parts.length > 0) {
            removeToast = createToast('キーワードの有効性をチェック中...', 'loading');
        }

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
        autoSearchBtn.classList.remove('btn-loading');
        if (removeToast) {
            removeToast();
            createToast('キーワードを追加しました', 'success');
        }
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

    // ─── Matrix Logic ───
    toggleParticipants.addEventListener('change', (e) => {
        participantsContainer.classList.toggle('hidden', !e.target.checked);
    });

    const renderMatrix = () => {
        participantMatrix.innerHTML = '';

        // Header row
        const thead = document.createElement('tr');
        thead.innerHTML = `<th>条件 \\ 名前</th>` + matrix.cols.map((col, idx) => `
            <th>
                <input type="text" value="${col}" data-col-idx="${idx}" class="matrix-col-input" placeholder="名前">
                <button class="col-delete-btn" data-idx="${idx}"><i class="ph ph-trash"></i></button>
            </th>
        `).join('');
        participantMatrix.appendChild(thead);

        // Data rows
        matrix.rows.forEach((row, rIdx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <th>
                    <input type="text" value="${row}" data-row-idx="${rIdx}" class="matrix-row-input" placeholder="条件">
                    <button class="row-delete-btn" data-idx="${rIdx}"><i class="ph ph-trash"></i></button>
                </th>` + matrix.cols.map((_, cIdx) => `
                <td>
                    <input type="text" value="${matrix.data[`${rIdx}_${cIdx}`] || ''}" data-cell="${rIdx}_${cIdx}" class="matrix-cell-input">
                </td>
            `).join('');
            participantMatrix.appendChild(tr);
        });

        // Event Listeners for inputs
        participantMatrix.querySelectorAll('.matrix-col-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                matrix.cols[e.target.dataset.colIdx] = e.target.value;
                updatePreviewMatrix();
            });
        });
        participantMatrix.querySelectorAll('.matrix-row-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                matrix.rows[e.target.dataset.rowIdx] = e.target.value;
                updatePreviewMatrix();
            });
        });
        participantMatrix.querySelectorAll('.matrix-cell-input').forEach(inp => {
            inp.addEventListener('change', (e) => {
                matrix.data[e.target.dataset.cell] = e.target.value;
                updatePreviewMatrix();
            });
        });

        // Event Listeners for deletes
        participantMatrix.querySelectorAll('.col-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                matrix.cols.splice(idx, 1);
                // Shift data columns
                let newData = {};
                matrix.rows.forEach((_, r) => {
                    let newC = 0;
                    matrix.cols.forEach((_, c) => {
                        let oldC = c >= idx ? c + 1 : c;
                        newData[`${r}_${newC}`] = matrix.data[`${r}_${oldC}`];
                        newC++;
                    });
                });
                matrix.data = newData;
                renderMatrix();
            });
        });
        participantMatrix.querySelectorAll('.row-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                matrix.rows.splice(idx, 1);
                // Shift data rows
                let newData = {};
                let newR = 0;
                matrix.rows.forEach((_, r) => {
                    let oldR = r >= idx ? r + 1 : r;
                    matrix.cols.forEach((_, c) => {
                        newData[`${newR}_${c}`] = matrix.data[`${oldR}_${c}`];
                    });
                    newR++;
                });
                matrix.data = newData;
                renderMatrix();
            });
        });
    };

    addMatrixColBtn.addEventListener('click', () => {
        matrix.cols.push(`参加者${matrix.cols.length + 1}`);
        renderMatrix();
    });

    addMatrixRowBtn.addEventListener('click', () => {
        matrix.rows.push(`条件${matrix.rows.length + 1}`);
        renderMatrix();
    });

    // Initialize rendering
    renderMatrix();

    // ─── Draft Plans (Modal) ───
    const formatPriceWithYen = (val) => {
        if (!val) return '';
        const v = val.trim();
        return (v.endsWith('円') || v.includes('円')) ? v : `${v}円`;
    };

    const renderDraftPlans = () => {
        modalPlanList.innerHTML = '';
        draftPlans.forEach((plan, index) => {
            const li = document.createElement('li');
            li.className = 'plan-item';
            li.innerHTML = `
                <div class="plan-info">
                    <span class="plan-name">${plan.url ? `<a href="${plan.url}" target="_blank">${plan.name}</a>` : plan.name}</span>
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
        const price = formatPriceWithYen(planPriceInput.value);
        draftPlans.push({
            id: generateId(),
            name,
            url: '', // Modals don't have URL input yet but could, leaving empty for now
            price,
            isChecked: false,
            isFavorite: false
        });
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
        if (budgetMin.value || budgetMax.value) {
            let startIndex = budgetMin.value ? allBudgetCodes.indexOf(budgetMin.value) : 0;
            let endIndex = budgetMax.value ? allBudgetCodes.indexOf(budgetMax.value) : allBudgetCodes.length - 1;

            if (startIndex > endIndex) {
                alert('予算の金額設定が正しくありません。\n上限は下限より高い金額を設定してください。');
                return;
            }

            const selectedCodes = allBudgetCodes.slice(startIndex, endIndex + 1);
            budgetQuery = '&budget=' + selectedCodes.join(',');
        }

        const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}${budgetQuery}&format=json&count=100`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        autoSearchBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> 検索中...';
        autoSearchBtn.disabled = true;
        autoSearchBtn.classList.add('btn-loading');
        const removeToast = createToast('中継サーバーを利用して店舗データを取得中...', 'loading');

        try {
            const data = await fetchWithRetry(proxyUrl, 2);
            if (data.results && data.results.error) throw new Error('API_ERROR_RESPONSE');

            if (data.results && data.results.shop && data.results.shop.length > 0) {
                const isYokohamaSearch = requests.some(r => r.includes('横浜')) && !requests.some(r => r.includes('新横浜'));

                let filteredShops = data.results.shop.filter(shop => {
                    const text = (shop.name + (shop.address || '') + (shop.catch || '') + (shop.station_name || '')).toLowerCase();
                    if (isYokohamaSearch && text.includes('新横浜')) return false;
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
                alert('通信エラー（タイムアウトなど）が発生しました。インターネット接続を確認して再試行してください。\n数回繰り返すとつながる場合があります。');
            }
        } finally {
            removeToast();
            autoSearchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i> 条件に合うお店を自動検索';
            autoSearchBtn.disabled = false;
            autoSearchBtn.classList.remove('btn-loading');
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
                        ${(rest.plans || []).map((p, i) => ({ ...p, originalIndex: i }))
                    .sort((a, b) => {
                        if (a.isFavorite && !b.isFavorite) return -1;
                        if (!a.isFavorite && b.isFavorite) return 1;
                        return 0;
                    })
                    .map((p) => `
                            <li class="plan-item">
                                <div class="plan-info">
                                    <span class="plan-name">${p.url ? `<a href="${p.url}" target="_blank">${p.name} <i class="ph ph-arrow-square-out" style="font-size:0.75rem;opacity:0.5"></i></a>` : p.name}</span>
                                    ${p.price ? `<span class="plan-price">${p.price}</span>` : ''}
                                </div>
                                <div style="display:flex; align-items:center; gap:0.2rem;">
                                    <button class="plan-star-btn toggle-plan-star ${p.isFavorite ? 'is-favorite' : ''}" data-rest-id="${rest.id}" data-plan-index="${p.originalIndex}">
                                        <i class="${p.isFavorite ? 'ph-fill' : 'ph'} ph-star"></i>
                                    </button>
                                    <button class="icon-btn delete-plan-btn" data-rest-id="${rest.id}" data-plan-index="${p.originalIndex}" style="min-width:28px;height:28px;border:none;background:transparent;color:var(--danger);"><i class="ph ph-x"></i></button>
                                </div>
                            </li>`).join('')}
                    </ul>
                    <div class="inline-plan-form">
                        <input type="text" placeholder="プラン名" class="inline-plan-name">
                        <input type="text" placeholder="URL(任意)" class="inline-plan-url">
                        <input type="text" placeholder="金額(任意)" class="inline-plan-price">
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
                const urlInp = card.querySelector('.inline-plan-url');
                const priceInp = card.querySelector('.inline-plan-price');
                const name = nameInp.value.trim();
                const url = urlInp.value.trim();
                const price = formatPriceWithYen(priceInp.value);
                if (name) {
                    const targetRest = restaurants.find(r => r.id === id);
                    if (targetRest) {
                        targetRest.plans = targetRest.plans || [];
                        targetRest.plans.push({ id: generateId(), name, url, price, isChecked: false, isFavorite: false });
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
            card.querySelectorAll('.toggle-plan-star').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rId = e.currentTarget.getAttribute('data-rest-id');
                    const pIdx = parseInt(e.currentTarget.getAttribute('data-plan-index'), 10);
                    const targetRest = restaurants.find(r => r.id === rId);
                    if (targetRest && targetRest.plans) {
                        targetRest.plans[pIdx].isFavorite = !targetRest.plans[pIdx].isFavorite;
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

        const removeToast = createToast('手動追加用の店舗を検索中...', 'loading');

        try {
            const apiKey = 'f15b7ad9efab6381';
            const targetUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&keyword=${encodeURIComponent(keyword)}&format=json&count=5`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const data = await fetchWithRetry(proxyUrl, 1);
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
            removeToast();
            manualApiBtn.innerHTML = '検索';
        }
    });

    manualApiSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            manualApiBtn.click();
        }
    });

    // ─── Sharing Logic ───
    const getShareData = () => {
        return restaurants.filter(r => r.isFavorite || (r.plans && r.plans.some(p => p.isFavorite))).map(r => {
            const favoredPlans = (r.plans || []).filter(p => p.isFavorite);
            return { ...r, plans: favoredPlans };
        });
    };

    const generateShareText = (data) => {
        if (data.length === 0) return 'お気に入りの店舗・プランがありません。';
        let text = '🍺 飲み会候補リスト 🍺\n\n';
        data.forEach((r, i) => {
            text += `${i + 1}. ${r.name}\n`;
            if (r.access) text += `📍 アクセス: ${r.access}\n`;
            if (r.url) text += `🔗 ${r.url}\n`;
            if (r.plans && r.plans.length > 0) {
                text += `👑 候補プラン:\n`;
                r.plans.forEach(p => {
                    text += `  - ${p.name} ${p.price ? `(${p.price})` : ''}\n`;
                    if (p.url) text += `    ${p.url}\n`;
                });
            }
            text += '\n';
        });
        return text.trim();
    };

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const data = getShareData();
            shareTextOutput.value = generateShareText(data);

            const minData = {
                name: meetingNameInput ? meetingNameInput.value.trim() : "",
                data: data.map(r => ({
                    id: r.id, name: r.name, url: r.url, price: r.price, feature: r.feature, access: r.access, isFavorite: r.isFavorite,
                    plans: r.plans.map(p => ({ id: p.id, name: p.name, url: p.url, price: p.price, isFavorite: true }))
                }))
            };

            try {
                const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(minData))));
                const shareUrl = `${window.location.href.split('?')[0]}?share=${encodeURIComponent(base64)}`;
                shareUrlOutput.value = shareUrl;
            } catch (e) {
                console.error(e);
                shareUrlOutput.value = "URLの生成に失敗しました。";
            }

            shareModal.classList.remove('hidden');
        });
    }

    if (closeShareModal) closeShareModal.addEventListener('click', () => shareModal.classList.add('hidden'));

    if (copyShareTextBtn) {
        copyShareTextBtn.addEventListener('click', () => {
            shareTextOutput.select();
            document.execCommand('copy');
            createToast('テキストをクリップボードにコピーしました', 'success');
        });
    }

    if (copyShareUrlBtn) {
        copyShareUrlBtn.addEventListener('click', () => {
            shareUrlOutput.select();
            document.execCommand('copy');
            createToast('URLをクリップボードにコピーしました', 'success');
        });
    }

    // ─── Init (no presets) ───
    updateEmptyState();
    if (isReadonly) {
        renderRestaurants();
    }
});
