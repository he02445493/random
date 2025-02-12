let display = document.getElementById('result');
let currentInput = '';
let previousInput = '';
let operation = null;

let categories = {
    '飲食': {
        '早餐': ['麥當勞', '永和豆漿', '肯德基', '早餐店', '自己煮', '三明治'],
        '午餐': ['便當', '麵食', '速食', '自助餐', '水餃', '義大利麵'],
        '晚餐': ['火鍋', '燒烤', '日本料理', '韓式料理', '中式料理', '西式料理']
    },
    '娛樂': {
        '室內': ['看電影', 'KTV', '密室逃脫', '桌遊', '健身', '逛街'],
        '戶外': ['踏青', '野餐', '騎腳踏車', '露營', '登山', '游泳'],
        '約會': ['咖啡廳', '電影院', '遊樂園', '動物園', '美術館', '書店']
    },
    '運動': {
        '球類': ['籃球', '羽球', '排球', '網球', '桌球', '足球'],
        '有氧': ['跑步', '游泳', '騎車', '跳繩', '有氧舞蹈', '爬樓梯'],
        '其他': ['瑜珈', '健身', '太極拳', '散步', '伸展操', '平板支撐']
    }
};

let questions = {
    '日常': [
        '今天要去哪裡約會？',
        '晚餐吃什麼好呢？',
        '週末要做什麼？',
        '選擇什麼活動好呢？',
        '今天要穿什麼顏色的衣服？',
        '要不要來點下午茶？'
    ],
    '娛樂': [
        '要看什麼電影？',
        '要玩什麼遊戲？',
        '要聽什麼音樂？',
        '要追什麼新劇？',
        '要去哪裡放鬆心情？'
    ],
    '學習': [
        '今天要學習什麼新技能？',
        '要看什麼書？',
        '要報名什麼課程？',
        '要學習什麼語言？'
    ],
    '時事': [] // 將由 fetchTrendingTopics 填充
};

let history = [];

const colorPairs = [
    ['#FF9999', '#FFB366'], // 紅橙
    ['#99FF99', '#66FFB3'], // 綠青
    ['#9999FF', '#CC99FF'], // 藍紫
    ['#FFE666', '#FFCC66'], // 黃金
    ['#FF99CC', '#FF99FF'], // 粉紫
    ['#66FFE6', '#66FFCC'], // 青綠
    ['#FFB3E6', '#FF99CC'], // 粉紅
    ['#99CCFF', '#99FFFF'], // 天藍
    ['#E6B3FF', '#CC99FF'], // 淺紫
    ['#FFB366', '#FFCC66']  // 橙黃
];

// 添加新的變數和函數
let currentCategory = '';
let currentSubCategory = '';
let drawTitle = '';

// 添加當前抽籤結果數組
let currentDrawResults = [];

// 使用環境變數中的 API 金鑰
const OPENAI_API_KEY = 'sk-YourOpenAIKeyHere';

// 添加已抽取卡片的追踪
let drawnCards = new Set();

// 添加進階版套件狀態
const premiumFeatures = {
    isPremium: false,
    features: {
        allSounds: false,
        allEffects: false,
        noAds: false,
        customThemes: false
    }
};

// 修改音效庫，添加更多音效選項
const soundLibrary = {
    basic: {
        flip: 'sounds/card-flip.mp3',
        select: 'sounds/select.mp3',
        success: 'sounds/success.mp3',
        shuffle: 'sounds/shuffle.mp3'
    },
    magical: {
        flip: 'sounds/magical-flip.mp3',
        select: 'sounds/magical-select.mp3',
        success: 'sounds/magical-success.mp3',
        shuffle: 'sounds/magical-shuffle.mp3'
    },
    game: {
        flip: 'sounds/game-flip.mp3',
        select: 'sounds/game-select.mp3',
        success: 'sounds/game-success.mp3',
        shuffle: 'sounds/game-shuffle.mp3'
    },
    retro: {
        flip: 'sounds/retro-flip.mp3',
        select: 'sounds/retro-select.mp3',
        success: 'sounds/retro-success.mp3',
        shuffle: 'sounds/retro-shuffle.mp3'
    }
};

// 添加音效控制面板
const soundEffects = {
    enabled: true,
    volume: 0.5
};

// 添加音效主題切換功能
let currentSoundTheme = 'basic';

function appendNumber(num) {
    currentInput += num;
    updateDisplay();
}

function appendOperator(op) {
    if (currentInput === '') return;
    
    if (previousInput !== '') {
        calculate();
    }
    
    operation = op;
    previousInput = currentInput;
    currentInput = '';
}

function calculate() {
    if (currentInput === '' || previousInput === '' || operation === null) return;
    
    let result;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);
    
    switch(operation) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                alert('不能除以零！');
                return;
            }
            result = prev / current;
            break;
    }
    
    currentInput = result.toString();
    previousInput = '';
    operation = null;
    updateDisplay();
}

function clearDisplay() {
    currentInput = '';
    previousInput = '';
    operation = null;
    updateDisplay();
}

function updateDisplay() {
    display.value = currentInput;
}

// 修改初始化函數
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTrendingTopics();
    setupTitleEditing();
    renderCategories();
    renderCards();
    setupKeyboardShortcuts();
    updateCategorySelectors();
});

function setupTitleEditing() {
    const mainTitle = document.getElementById('main-title');
    
    // 移除可能已存在的事件監聽器
    mainTitle.removeEventListener('click', handleTitleClick);
    mainTitle.removeEventListener('blur', handleTitleBlur);
    mainTitle.removeEventListener('keypress', handleTitleKeypress);
    
    // 添加事件監聽器
    mainTitle.addEventListener('click', handleTitleClick);
    mainTitle.addEventListener('blur', handleTitleBlur);
    mainTitle.addEventListener('keypress', handleTitleKeypress);
}

// 將事件處理函數分離出來
function handleTitleClick() {
    this.contentEditable = true;
    this.classList.add('editing');
    this.focus();
}

function handleTitleBlur() {
    this.contentEditable = false;
    this.classList.remove('editing');
    if (this.textContent.trim() === '') {
        this.textContent = '未命名的抽籤';
    }
}

function handleTitleKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
    }
}

function updateCategorySelectors() {
    const categorySelect = document.getElementById('category-select');
    const subcategorySelect = document.getElementById('subcategory-select');
    
    // 更新主分類選項
    categorySelect.innerHTML = '<option value="">請選擇分類...</option>';
    Object.keys(categories).forEach(category => {
        categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

function changeCategory() {
    const categorySelect = document.getElementById('category-select');
    const subcategorySelect = document.getElementById('subcategory-select');
    currentCategory = categorySelect.value;
    
    // 更新子分類選項
    subcategorySelect.innerHTML = '<option value="">請選擇子分類...</option>';
    if (currentCategory) {
        Object.keys(categories[currentCategory]).forEach(subCategory => {
            subcategorySelect.innerHTML += `<option value="${subCategory}">${subCategory}</option>`;
        });
    }
    
    renderCards();
}

function changeSubCategory() {
    const subcategorySelect = document.getElementById('subcategory-select');
    currentSubCategory = subcategorySelect.value;
    renderCards();
}

function renderCategories() {
    const categoriesDiv = document.getElementById('categories');
    categoriesDiv.innerHTML = '';
    
    Object.entries(categories).forEach(([mainCategory, subCategories]) => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-group';
        
        let subCategoriesHtml = '';
        Object.entries(subCategories).forEach(([subCategory, options]) => {
            subCategoriesHtml += `
                <div class="sub-category collapsed" data-category="${mainCategory}" data-subcategory="${subCategory}">
                    <h5 onclick="toggleSubCategory('${mainCategory}', '${subCategory}')">
                        ${subCategory}
                        <span class="arrow" style="transform: rotate(-90deg)">▼</span>
                    </h5>
                    <div class="options">
                        ${options.map(option => `
                            <div class="option">
                                ${option}
                                <button onclick="deleteOption('${mainCategory}', '${subCategory}', '${option}')">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        categoryElement.innerHTML = `
            <h4>${mainCategory}
                <button onclick="deleteMainCategory('${mainCategory}')" class="delete-btn">刪除</button>
                <button onclick="addSubCategory('${mainCategory}')" class="add-btn">新增子分類</button>
            </h4>
            ${subCategoriesHtml}
        `;
        
        categoriesDiv.appendChild(categoryElement);
    });
}

function renderCards() {
    const cardsContainer = document.querySelector('.cards-container');
    cardsContainer.innerHTML = '';
    
    // 播放洗牌音效
    if (soundEffects.enabled) {
        sounds.shuffle.currentTime = 0;
        sounds.shuffle.play();
    }

    const options = getCurrentOptions();
    options.forEach((option, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        if (drawnCards.has(option)) {
            card.classList.add('flipped', 'drawn');
        }
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <span class="card-number">${index + 1}</span>
                    <div class="card-pattern"></div>
                </div>
                <div class="card-back">
                    <span class="card-text">${option}</span>
                    ${drawnCards.has(option) ? '<span class="drawn-mark">已抽取</span>' : ''}
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => selectCard(option, card));
        cardsContainer.appendChild(card);
    });
}

function getCurrentOptions() {
    let options = [];
    
    if (currentCategory && currentSubCategory) {
        options = categories[currentCategory][currentSubCategory].map(option => ({
            option: option
        }));
    } else if (currentCategory) {
        Object.values(categories[currentCategory]).forEach(subCategoryOptions => {
            options = options.concat(subCategoryOptions.map(option => ({
                option: option
            })));
        });
    } else {
        // 如果沒有選擇分類，顯示所有選項
        Object.values(categories).forEach(category => {
            Object.values(category).forEach(subCategoryOptions => {
                options = options.concat(subCategoryOptions.map(option => ({
                    option: option
                })));
            });
        });
    }
    
    // Fisher-Yates 洗牌
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options.map(item => item.option);
}

function getRandomColor() {
    const pair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
    return {
        color1: pair[0],
        color2: pair[1]
    };
}

function changeQuestion() {
    const questionElements = document.querySelectorAll('#random-question');
    const currentQuestion = questionElements[0].textContent;
    
    // 隨機選擇問題類別
    const categories = Object.keys(questions);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryQuestions = questions[randomCategory];
    
    // 從選中的類別中隨機選擇問題
    let newQuestion;
    do {
        newQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    } while (newQuestion === currentQuestion && categoryQuestions.length > 1);
    
    // 更新所有問題元素
    questionElements.forEach(element => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.textContent = newQuestion;
            element.style.opacity = '1';
        }, 300);
    });
}

function addCategory() {
    const input = document.getElementById('new-category');
    const category = input.value.trim();
    
    if (category && !categories[category]) {
        categories[category] = [];
        renderCategories();
        input.value = '';
    }
}

function deleteCategory(category) {
    delete categories[category];
    renderCategories();
    renderCards();
}

function addOption() {
    const input = document.getElementById('new-option');
    const option = input.value.trim();
    
    if (option) {
        const selectedCategory = Object.keys(categories)[0]; // 預設加入第一個分類
        if (selectedCategory) {
            categories[selectedCategory].push(option);
            renderCategories();
            renderCards();
            input.value = '';
        }
    }
}

function selectCard(option, card) {
    if (drawnCards.has(option)) {
        // 如果卡片已經被抽取過，播放提示音效
        if (soundEffects.enabled) {
            sounds.select.currentTime = 0;
            sounds.select.play();
        }
        return;
    }

    // 添加到已抽取集合
    drawnCards.add(option);
    
    // 添加到當前結果列表
    currentDrawResults.push(option);
    updateDrawResults();

    // 翻轉卡片並添加特效
    flipCard(card);

    // 更新歷史記錄
    const now = new Date();
    const currentQuestion = document.querySelector('.header #random-question').textContent;
    
    const historyItem = {
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        question: currentQuestion,
        result: option,
        category: currentCategory,
        subCategory: currentSubCategory
    };
    
    history.unshift(historyItem);
    updateHistory();

    // 顯示結果和詢問是否繼續
    showResultWithConfirm(option);
}

function updateHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <div class="history-time">${item.date} ${item.time}</div>
            <div class="history-category">${item.category || '未分類'} > ${item.subCategory || '一般'}</div>
            <div class="history-question">${item.question}</div>
            <div class="history-result">${item.result}</div>
            <div class="history-actions">
                <button onclick="searchFromHistory('${item.result}')">
                    <i class="fab fa-google"></i>
                </button>
                <button onclick="navigateFromHistory('${item.result}')">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button onclick="shareFromHistory(${index})">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                drawRandomCard();
                break;
            case 't':
            case 'T':
                showShortcuts();
                break;
            case 'x':
            case 'X':
                hideShortcuts();
                break;
            case 's':
            case 'S':
                renderCards();
                break;
            case 'e':
            case 'E':
                editCurrentOption();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
        }
    });
}

function shareToFacebook(question, result) {
    const text = `問題：${question}\n結果：${result}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToTwitter(question, result) {
    const text = `問題：${question}\n結果：${result}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToLine(question, result) {
    const text = `問題：${question}\n結果：${result}`;
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function startDrawing() {
    // 隱藏初始畫面
    document.querySelector('.initial-screen').style.display = 'none';
    // 顯示主容器
    document.querySelector('.container').style.display = 'flex';
    
    // 保存當前問題
    const currentQuestion = document.getElementById('random-question').textContent;
    
    // 更新主畫面的問題
    const headerQuestion = document.querySelector('.header #random-question');
    if (headerQuestion) {
        headerQuestion.textContent = currentQuestion;
    }
    
    // 重新渲染卡片
    renderCards();
    
    // 添加卡片翻轉動畫
    setTimeout(() => {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.remove('hidden');
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 300);
        });
    }, 100);
}

function toggleSubCategory(mainCategory, subCategory) {
    const subCategoryDiv = document.querySelector(`[data-category="${mainCategory}"][data-subcategory="${subCategory}"]`);
    if (subCategoryDiv) {
        subCategoryDiv.classList.toggle('collapsed');
        const arrow = subCategoryDiv.querySelector('.arrow');
        if (arrow) {
            arrow.style.transform = subCategoryDiv.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
        }
    }
}

function deleteOption(mainCategory, subCategory, option) {
    categories[mainCategory][subCategory] = categories[mainCategory][subCategory]
        .filter(item => item !== option);
    renderCategories();
    renderCards();
}

function deleteMainCategory(mainCategory) {
    delete categories[mainCategory];
    renderCategories();
    renderCards();
}

function addSubCategory(mainCategory) {
    const name = prompt('請輸入新的子分類名稱：');
    if (name && name.trim()) {
        if (!categories[mainCategory][name]) {
            categories[mainCategory][name] = [];
            renderCategories();
        }
    }
}

// 添加獲取 Google 趨勢的函數
async function fetchTrendingTopics() {
    try {
        // 這裡使用 Google Trends API 的示例
        // 實際使用時需要替換為真實的 API 端點
        const response = await fetch('https://trends.google.com/trends/api/dailytrends?hl=zh-TW&geo=TW');
        const data = await response.json();
        
        // 將熱搜話題轉換為問題
        const trends = data.default.trendingSearchesDays[0].trendingSearches;
        questions.時事 = trends.map(trend => 
            `要不要了解「${trend.title}」這個話題？`
        ).slice(0, 5);
        
    } catch (error) {
        console.log('無法獲取趨勢數據，使用備用話題');
        questions.時事 = [
            '要關注什麼新聞話題？',
            '要討論什麼時事議題？',
            '要參與什麼社會活動？',
            '要響應什麼環保行動？',
            '要支持什麼公益活動？'
        ];
    }
}

// 修改 drawRandomCard 函數
function drawRandomCard() {
    const unflippedCards = Array.from(document.querySelectorAll('.card:not(.flipped)'));
    if (unflippedCards.length > 0) {
        const randomCard = unflippedCards[Math.floor(Math.random() * unflippedCards.length)];
        const option = randomCard.querySelector('.card-back .card-text').textContent;
        
        // 選擇卡片
        selectCard(option, randomCard);
        
        // 滾動到選中的卡片
        randomCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // 詢問是否要繼續抽籤
        setTimeout(() => {
            if (unflippedCards.length > 1) {
                showContinueDrawDialog();
            }
        }, 1500);
    }
}

// 添加繼續抽籤對話框
function showContinueDrawDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'continue-draw-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <p>要繼續抽籤嗎？</p>
            <div class="dialog-buttons">
                <button onclick="drawRandomCard(); this.closest('.continue-draw-dialog').remove();">
                    繼續抽籤
                </button>
                <button onclick="this.closest('.continue-draw-dialog').remove();">
                    結束
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
}

// 添加快捷鍵提示顯示/隱藏功能
function showShortcuts() {
    const tooltip = document.querySelector('.shortcuts-tooltip');
    if (tooltip) {
        tooltip.style.display = 'block';
    }
}

function hideShortcuts() {
    const tooltip = document.querySelector('.shortcuts-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// 修改分享按鈕的行為
document.addEventListener('DOMContentLoaded', function() {
    const shareButton = document.querySelector('.share-button');
    shareButton.addEventListener('click', function() {
        this.classList.toggle('active');
    });

    // 點擊其他地方時關閉分享選項
    document.addEventListener('click', function(e) {
        if (!shareButton.contains(e.target)) {
            shareButton.classList.remove('active');
        }
    });
});

// 修改分享功能
function shareToX(question, result) {
    const text = `問題：${question}\n結果：${result}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToInstagram(question, result) {
    // Instagram 不支援直接分享連結，可以複製到剪貼簿
    const text = `問題：${question}\n結果：${result}`;
    navigator.clipboard.writeText(text).then(() => {
        alert('內容已複製到剪貼簿，請貼到 Instagram 分享');
    });
}

// 添加全螢幕功能
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`全螢幕請求失敗: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// 添加編輯功能
function editCurrentOption() {
    const selectedOption = document.querySelector('.card.flipped .card-back');
    if (selectedOption) {
        const newValue = prompt('請輸入新的內容:', selectedOption.textContent);
        if (newValue && newValue.trim()) {
            // 更新選項內容
            const oldValue = selectedOption.textContent;
            if (currentCategory && currentSubCategory) {
                const index = categories[currentCategory][currentSubCategory].indexOf(oldValue);
                if (index !== -1) {
                    categories[currentCategory][currentSubCategory][index] = newValue;
                    renderCategories();
                    renderCards();
                }
            }
        }
    }
}

// 修改 Google 搜尋功能
function searchGoogle(query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
}

function openMaps(location) {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank');
}

// 添加關閉結果的功能
function closeResult(button) {
    const resultElement = button.closest('.latest-result');
    if (resultElement) {
        resultElement.style.opacity = '0';
        resultElement.style.transform = 'translate(-50%, -60%)';
        setTimeout(() => {
            resultElement.remove();
        }, 300);
    }
}

// 添加歷史記錄的操作函數
function searchFromHistory(result) {
    searchGoogle(result);
}

function navigateFromHistory(result) {
    openMaps(result);
}

function shareFromHistory(index) {
    const item = history[index];
    const shareMenu = document.createElement('div');
    shareMenu.className = 'share-menu';
    shareMenu.innerHTML = `
        <div class="share-menu-content">
            <button onclick="shareToFacebook('${item.question}', '${item.result}')">
                <i class="fab fa-facebook"></i> Facebook
            </button>
            <button onclick="shareToX('${item.question}', '${item.result}')">
                <i class="fab fa-x-twitter"></i> X
            </button>
            <button onclick="shareToInstagram('${item.question}', '${item.result}')">
                <i class="fab fa-instagram"></i> Instagram
            </button>
            <button onclick="shareToLine('${item.question}', '${item.result}')">
                <i class="fab fa-line"></i> Line
            </button>
        </div>
    `;
    document.body.appendChild(shareMenu);

    // 點擊其他地方關閉分享選單
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!shareMenu.contains(e.target)) {
                shareMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// 添加商家入駐功能
function showBusinessForm() {
    const formHtml = `
        <div class="business-form">
            <h2>商家入駐申請</h2>
            <form onsubmit="submitBusinessForm(event)">
                <div class="form-group">
                    <label>商家名稱</label>
                    <input type="text" name="businessName" required>
                </div>
                <div class="form-group">
                    <label>商家類型</label>
                    <select name="businessType" required>
                        <option value="">請選擇類型...</option>
                        <option value="restaurant">餐廳</option>
                        <option value="cafe">咖啡廳</option>
                        <option value="gym">健身房</option>
                        <option value="entertainment">娛樂場所</option>
                        <option value="other">其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>地址</label>
                    <input type="text" name="address" required>
                </div>
                <div class="form-group">
                    <label>聯絡電話</label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>電子郵件</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>簡介</label>
                    <textarea name="description" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit">提交申請</button>
                    <button type="button" onclick="closeBusinessForm()">取消</button>
                </div>
            </form>
        </div>
    `;

    const formContainer = document.createElement('div');
    formContainer.className = 'business-form-container';
    formContainer.innerHTML = formHtml;
    document.body.appendChild(formContainer);
}

function closeBusinessForm() {
    const formContainer = document.querySelector('.business-form-container');
    if (formContainer) {
        formContainer.remove();
    }
}

function submitBusinessForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const businessData = Object.fromEntries(formData.entries());
    
    // 這裡可以添加發送到後端的邏輯
    console.log('商家申請資料:', businessData);
    
    alert('感謝您的申請！我們會盡快審核並與您聯繫。');
    closeBusinessForm();
}

// 添加社群功能
function showCommunity() {
    const modalHtml = `
        <div class="community-content">
            <div class="community-header">
                <h2>抽籤社群</h2>
                <button onclick="closeCommunity()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="community-tabs">
                <div class="community-tab active" onclick="switchTab(this, 'popular')">熱門抽籤</div>
                <div class="community-tab" onclick="switchTab(this, 'latest')">最新發布</div>
                <div class="community-tab" onclick="switchTab(this, 'following')">追蹤中</div>
            </div>
            <div class="community-feed">
                ${generateDrawCards()}
            </div>
        </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'community-modal';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);
}

function closeCommunity() {
    const modal = document.querySelector('.community-modal');
    if (modal) {
        modal.remove();
    }
}

function generateDrawCards() {
    // 模擬抽籤數據
    const draws = [
        {
            id: 1,
            title: '美食探險',
            author: '美食達人',
            likes: 234,
            shares: 45,
            categories: ['餐廳', '小吃', '甜點'],
            options: ['日式料理', '韓式烤肉', '義大利麵', '火鍋', '燒烤']
        },
        {
            id: 2,
            title: '週末約會地點',
            author: '戀愛顧問',
            likes: 567,
            shares: 123,
            categories: ['約會', '休閒', '娛樂'],
            options: ['電影院', '遊樂園', '咖啡廳', '海邊', '動物園']
        }
        // ... 可以添加更多範例
    ];

    return draws.map(draw => `
        <div class="draw-card">
            <div class="draw-header">
                <h3>${draw.title}</h3>
                <span class="author">by ${draw.author}</span>
            </div>
            <div class="draw-categories">
                ${draw.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
            </div>
            <div class="draw-stats">
                <span><i class="fas fa-heart"></i> ${draw.likes}</span>
                <span><i class="fas fa-share"></i> ${draw.shares}</span>
            </div>
            <div class="draw-preview">
                <p>包含 ${draw.options.length} 個選項</p>
                <p class="options-preview">${draw.options.slice(0, 3).join(', ')}...</p>
            </div>
            <div class="draw-actions">
                <button class="like-btn" onclick="likeDrawing(${draw.id})">
                    <i class="fas fa-heart"></i> 讚
                </button>
                <button class="share-btn" onclick="shareDrawing(${draw.id})">
                    <i class="fas fa-share"></i> 分享
                </button>
                <button class="use-btn" onclick="useDrawing(${draw.id})">
                    <i class="fas fa-magic"></i> 使用這個
                </button>
            </div>
        </div>
    `).join('');
}

function switchTab(tab, type) {
    // 移除所有標籤的 active 類
    document.querySelectorAll('.community-tab').forEach(t => t.classList.remove('active'));
    // 添加當前標籤的 active 類
    tab.classList.add('active');
    
    // 根據類型更新內容
    const feed = document.querySelector('.community-feed');
    feed.innerHTML = generateDrawCards(); // 這裡可以根據不同類型顯示不同內容
}

function likeDrawing(id) {
    // 處理點讚邏輯
    console.log('點讚抽籤:', id);
}

function shareDrawing(id) {
    // 處理分享邏輯
    console.log('分享抽籤:', id);
}

function useDrawing(id) {
    // 使用該抽籤設定
    console.log('使用抽籤:', id);
    // 可以將該抽籤的設定導入當前抽籤
    closeCommunity();
}

// 添加結果列表更新函數
function updateDrawResults() {
    const resultsDiv = document.querySelector('.draw-results');
    const resultsList = document.querySelector('.result-list');
    
    if (currentDrawResults.length > 0) {
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = currentDrawResults.map((result, index) => `
            <li>
                <span class="priority">優先度 ${index + 1}</span>
                <span>${result}</span>
            </li>
        `).join('');
    } else {
        resultsDiv.style.display = 'none';
    }
}

// 添加結果確認函數
function showResultWithConfirm(option) {
    const latestResult = document.createElement('div');
    latestResult.className = 'latest-result';
    latestResult.innerHTML = `
        <div class="result-content">
            <h3>${option}</h3>
            <div class="result-actions">
                <button onclick="searchGoogle('${option}')">
                    <i class="fab fa-google"></i> Google 搜尋
                </button>
                <button onclick="openMaps('${option}')">
                    <i class="fas fa-map-marker-alt"></i> 導航
                </button>
                <button onclick="drawAnotherCard()">
                    <i class="fas fa-random"></i> 再抽一次
                </button>
                <button onclick="closeResult(this)">
                    <i class="fas fa-times"></i> 關閉
                </button>
            </div>
        </div>
    `;
    
    const oldResult = document.querySelector('.latest-result');
    if (oldResult) {
        oldResult.remove();
    }
    
    document.body.appendChild(latestResult);
}

// 添加再抽一次函數
function drawAnotherCard() {
    closeResult(document.querySelector('.latest-result button'));
    drawRandomCard();
}

// 修改重置函數
function resetAll() {
    // 清空已抽取卡片集合
    drawnCards.clear();
    
    // 重置所有卡片
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('flipped', 'selected');
    });
    
    // 清空當前結果列表
    currentDrawResults = [];
    updateDrawResults();
    
    // 重新洗牌
    renderCards();
}

// 添加 AI 對話功能
function toggleChat() {
    const chatContainer = document.querySelector('.chat-container');
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
}

// 修改 AI 對話功能，連接 OpenAI API
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    // 添加用戶訊息
    addMessage(message, 'user');
    input.value = '';

    // 顯示思考中
    const dots = addMessage('思考中...', 'ai');
    
    try {
        // 調用 OpenAI API
        const response = await callOpenAI(message);
        dots.remove();
        addMessage(response, 'ai');
    } catch (error) {
        dots.remove();
        addMessage('抱歉，AI 服務暫時無法使用，請稍後再試。', 'ai');
        console.error('AI API 錯誤:', error);
    }
}

// 修改 AI 對話功能
async function callOpenAI(message) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "你是一個友善的抽籤助手，可以幫助用戶做決定和推薦美食。"
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        throw new Error('AI API 調用失敗');
    }
}

function addMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

// 添加按下 Enter 發送訊息的功能
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 添加音效函數
const sounds = {
    flip: new Audio('sounds/card-flip.mp3'),
    select: new Audio('sounds/select.mp3'),
    success: new Audio('sounds/success.mp3'),
    shuffle: new Audio('sounds/shuffle.mp3')
};

// 預加載音效
Object.values(sounds).forEach(sound => {
    sound.load();
});

// 修改卡片翻轉函數，添加特效
function flipCard(card) {
    // 只在音效開啟時播放
    if (soundEffects.enabled) {
        sounds.flip.currentTime = 0;
        sounds.flip.play();
    }

    // 添加發光特效
    card.style.animation = 'glow 0.5s ease-in-out';
    
    // 添加粒子特效
    createParticles(card);
    
    // 添加翻轉和已抽取標記
    card.classList.add('flipped', 'drawn');
}

// 修改粒子特效
function createParticles(element) {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.appendChild(particlesContainer);

    const particles = 30;
    const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#64B5F6'];

    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        particlesContainer.appendChild(particle);
        
        const angle = (i * 360) / particles;
        const radius = 100 + Math.random() * 50;
        
        // 使用 CSS 動畫替代 anime.js
        particle.style.animation = `particle-fade 1s ease-out forwards`;
        particle.style.transform = `translate(
            ${Math.cos(angle * Math.PI / 180) * radius}px,
            ${Math.sin(angle * Math.PI / 180) * radius}px
        )`;
    }

    // 清理粒子容器
    setTimeout(() => {
        if (particlesContainer.parentNode) {
            particlesContainer.remove();
        }
    }, 1000);
}

// 修改音效設置面板
function createSoundControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'sound-control-panel';
    panel.innerHTML = `
        <div class="sound-header">
            <h3>音效設置</h3>
            <button class="close-btn" onclick="closeSoundPanel()">×</button>
        </div>
        <div class="sound-controls">
            <div class="sound-toggle">
                <label class="switch">
                    <input type="checkbox" ${soundEffects.enabled ? 'checked' : ''} 
                           onchange="toggleSound(this.checked)">
                    <span class="slider round"></span>
                    <span class="label">音效開關</span>
                </label>
            </div>
            <div class="volume-control">
                <span>音量</span>
                <input type="range" min="0" max="1" step="0.1" 
                       value="${soundEffects.volume}"
                       onchange="adjustVolume(this.value)">
                <span class="volume-value">${Math.round(soundEffects.volume * 100)}%</span>
            </div>
            <div class="sound-theme">
                <label>音效主題</label>
                <div class="theme-buttons">
                    <button class="theme-btn ${currentSoundTheme === 'basic' ? 'active' : ''}"
                            onclick="changeSoundTheme('basic')">
                        <i class="fas fa-music"></i>
                        基本音效
                    </button>
                    <button class="theme-btn ${currentSoundTheme === 'magical' ? 'active' : ''}"
                            onclick="changeSoundTheme('magical')"
                            ${!premiumFeatures.isPremium ? 'disabled' : ''}>
                        <i class="fas fa-magic"></i>
                        魔法音效
                        ${!premiumFeatures.isPremium ? '<span class="premium-badge">PRO</span>' : ''}
                    </button>
                    <button class="theme-btn ${currentSoundTheme === 'game' ? 'active' : ''}"
                            onclick="changeSoundTheme('game')"
                            ${!premiumFeatures.isPremium ? 'disabled' : ''}>
                        <i class="fas fa-gamepad"></i>
                        遊戲音效
                        ${!premiumFeatures.isPremium ? '<span class="premium-badge">PRO</span>' : ''}
                    </button>
                    <button class="theme-btn ${currentSoundTheme === 'retro' ? 'active' : ''}"
                            onclick="changeSoundTheme('retro')"
                            ${!premiumFeatures.isPremium ? 'disabled' : ''}>
                        <i class="fas fa-compact-disc"></i>
                        復古音效
                        ${!premiumFeatures.isPremium ? '<span class="premium-badge">PRO</span>' : ''}
                    </button>
                </div>
            </div>
            ${!premiumFeatures.isPremium ? `
                <div class="premium-prompt">
                    <button onclick="showPremiumDialog()" class="upgrade-btn">
                        <i class="fas fa-crown"></i>
                        升級解鎖所有音效
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    return panel;
}

function toggleSound(enabled) {
    soundEffects.enabled = enabled;
    Object.values(sounds).forEach(sound => {
        sound.muted = !enabled;
    });
}

function adjustVolume(value) {
    soundEffects.volume = parseFloat(value);
    Object.values(sounds).forEach(sound => {
        sound.volume = soundEffects.volume;
    });
}

// 添加進階版解鎖功能
function showPremiumDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'premium-dialog';
    dialog.innerHTML = `
        <div class="premium-content">
            <h2>解鎖進階版功能</h2>
            <div class="premium-features">
                <div class="feature">
                    <i class="fas fa-music"></i>
                    <h3>豐富音效</h3>
                    <p>解鎖所有進階音效主題</p>
                </div>
                <div class="feature">
                    <i class="fas fa-magic"></i>
                    <h3>特效升級</h3>
                    <p>解鎖華麗視覺特效</p>
                </div>
                <div class="feature">
                    <i class="fas fa-ban"></i>
                    <h3>無廣告</h3>
                    <p>完全移除所有廣告</p>
                </div>
                <div class="feature">
                    <i class="fas fa-palette"></i>
                    <h3>自訂主題</h3>
                    <p>自訂卡片和介面風格</p>
                </div>
            </div>
            <button onclick="upgradeToPremium()" class="upgrade-btn">
                立即升級
            </button>
            <button onclick="closePremiumDialog()" class="close-btn">
                稍後再說
            </button>
        </div>
    `;
    document.body.appendChild(dialog);
}

// 添加音效主題切換功能
function changeSoundTheme(theme) {
    if (!premiumFeatures.isPremium && theme !== 'basic') {
        showPremiumDialog();
        return;
    }
    
    currentSoundTheme = theme;
    // 更新音效來源
    Object.keys(sounds).forEach(key => {
        sounds[key].src = soundLibrary[theme][key];
        sounds[key].load();
    });
    
    // 更新按鈕狀態
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="changeSoundTheme('${theme}')"]`).classList.add('active');
} 