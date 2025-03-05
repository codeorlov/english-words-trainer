// Константи для конфігурації програми
const SPEECH_RATE = 1; // Швидкість мовлення для синтезатора (1 - нормальна швидкість)
const SIDEBAR_TRANSITION_DURATION = 200; // Тривалість анімації бічної панелі в мілісекундах

// Об'єкт із селекторами для DOM-елементів
const SELECTORS = {
    wordDisplay: '.word-display', // Селектор для відображення слова
    transcription: '.transcription', // Селектор для транскрипції
    translation: '.translation', // Селектор для перекладу
    wordList: '.word-list', // Селектор для списку вивчених слів
    navSidebar: '.nav-sidebar', // Селектор для навігаційної бічної панелі
    dictionarySidebar: '.dictionary-sidebar', // Селектор для словникової бічної панелі
    menuIcon: '.menu-icon', // Селектор для іконки меню
    dictionaryButton: '.dictionary-button', // Селектор для кнопки словника
    knowButton: '.know-button', // Селектор для кнопки "Вже знаю"
    listenButton: '.listen-button', // Селектор для кнопки прослуховування
    filterInput: '.filter-input', // Селектор для поля фільтрації
    navItems: '.nav-list li', // Селектор для елементів меню
    card: '.card', // Селектор для картки зі словом
    categoryTitle: '.category-title', // Селектор для заголовка категорії
};

// Об'єкт стану програми
let state = {
    viewedWords: [], // Масив слів, які користувач уже переглядав
    currentFilter: '', // Поточний фільтр для пошуку слів
    VOCABULARY: [], // Масив словникових даних
    currentVocab: 'anatomy', // Поточна категорія за замовчуванням
};

// Об'єкт із допоміжними утилітами
const utils = {
    /**
     * Зберігає дані в localStorage
     * @param {string} key - Ключ для зберігання
     * @param {any} data - Дані для збереження
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    },
    /**
     * Повертає випадковий індекс для масиву
     * @param {number} max - Максимальний індекс
     * @returns {number} Випадковий індекс
     */
    getRandomIndex(max) {
        return Math.floor(Math.random() * max);
    },
    /**
     * Створює функцію з затримкою (debounce) для уникнення надмірних викликів
     * @param {function} func - Функція, яку потрібно відкласти
     * @param {number} wait - Час затримки в мілісекундах
     * @returns {function} Обгорнута функція з затримкою
     */
    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
};

/**
 * Ініціалізує функцію синтезу мовлення
 * @returns {function} Функція для програвання слова
 */
const speakWord = (() => {
    const synth = window.speechSynthesis;
    if (!synth) {
        console.warn('Speech synthesis is not supported in this browser.');
        return () => {};
    }

    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = 'en-GB';
    utterance.rate = SPEECH_RATE;

    const setVoice = () => {
        const voices = synth.getVoices();
        const maleVoice = voices.find(v => v.lang === 'en-GB' && (v.name === 'Дэниэл' || v.name.includes('Male'))) || voices.find(v => v.lang === 'en-GB');
        if (maleVoice) utterance.voice = maleVoice;
    };

    synth.onvoiceschanged = setVoice;
    setVoice();

    return (word) => {
        utterance.text = word;
        synth.speak(utterance);
    };
})();

/**
 * Асинхронно завантажує словникові дані з JSON-файлу
 * @param {string} vocab - Назва категорії
 */
async function loadVocabulary(vocab) {
    const jsonFile = `vocabulary/${vocab}.json`;
    try {
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error('Network response was not ok');
        state.VOCABULARY = await response.json();
    } catch (error) {
        console.error('Error loading vocabulary:', error);
        state.VOCABULARY = [{ word: 'error', transcription: '[ˈerər]', translation: 'помилка' }];
    }
}

/**
 * Завантажує список переглянутих слів із localStorage
 * @param {string} vocab - Назва категорії
 */
function loadViewedWords(vocab) {
    const storageKey = `viewedWords_${vocab}`;
    state.viewedWords = JSON.parse(localStorage.getItem(storageKey)) || [];
}

/**
 * Повертає випадкове слово з поточного словника
 * @returns {object} Випадковий об’єкт слова
 */
function getRandomVocabularyWord() {
    return state.VOCABULARY[utils.getRandomIndex(state.VOCABULARY.length)];
}

/**
 * Оновлює відображення слова, транскрипції та перекладу на сторінці
 * @param {object} wordObj - Об’єкт зі словом { word, transcription, translation }
 */
function updateWordDisplay({ word, transcription, translation }) {
    [SELECTORS.wordDisplay, SELECTORS.transcription, SELECTORS.translation]
        .map(selector => document.querySelector(selector))
        .forEach((el, i) => el.textContent = [word, transcription, translation][i]);
}

/**
 * Додає слово до списку переглянутих і оновлює історію
 * @param {object} wordObj - Об’єкт зі словом
 */
function addToViewedWords(wordObj) {
    if (!state.viewedWords.some(w => w.word === wordObj.word)) {
        state.viewedWords.push(wordObj);
        utils.saveToLocalStorage(`viewedWords_${state.currentVocab}`, state.viewedWords);
        updateWordHistory(state.currentFilter);
    }
}

/**
 * Оновлює список переглянутих слів із фільтрацією
 * @param {string} [filterText=''] - Текст для фільтрації
 */
function updateWordHistory(filterText = '') {
    const list = document.querySelector(SELECTORS.wordList);
    let wordsToShow = [...state.viewedWords];
    if (filterText) {
        wordsToShow = wordsToShow.filter(entry =>
            entry.word.toLowerCase().includes(filterText) ||
            entry.translation.toLowerCase().includes(filterText)
        );
    }

    wordsToShow.sort((a, b) => a.word.localeCompare(b.word));

    list.innerHTML = '';
    if (wordsToShow.length === 0) {
        list.innerHTML = filterText ? '<li>Нічого не знайдено</li>' : '<li>Список пустий</li>';
        return;
    }

    wordsToShow.forEach(entry => {
        const li = document.createElement('li');
        li.dataset.word = entry.word;
        li.innerHTML = `
            <div class="word-row">
                <span class="material-icons">volume_up</span>
                ${entry.word} ${entry.transcription}
            </div>
            <p>${entry.translation}</p>
        `;
        li.addEventListener('click', () => speakWord(entry.word));
        list.appendChild(li);
    });
}

/**
 * Перемикає видимість бічної панелі
 * @param {string} sidebarSelector - Селектор бічної панелі
 * @param {boolean} [shouldUpdateHistory=false] - Чи оновлювати історію слів
 */
function toggleSidebar(sidebarSelector, shouldUpdateHistory = false) {
    const sidebar = document.querySelector(sidebarSelector);
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        setTimeout(() => {
            if (!sidebar.classList.contains('open')) sidebar.style.visibility = 'hidden';
        }, SIDEBAR_TRANSITION_DURATION);
    } else {
        sidebar.style.visibility = 'visible';
        sidebar.classList.add('open');
        if (shouldUpdateHistory) updateWordHistory(state.currentFilter);
    }
}

/**
 * Закриває бічні панелі при кліку поза ними
 * @param {Event} event - Подія кліку
 */
function closeSidebarOnOutsideClick(event) {
    const { navSidebar, dictionarySidebar, menuIcon, dictionaryButton } = SELECTORS;
    if (document.querySelector(navSidebar).classList.contains('open') &&
        !document.querySelector(navSidebar).contains(event.target) &&
        event.target !== document.querySelector(menuIcon) &&
        !document.querySelector(menuIcon).contains(event.target)) {
        toggleSidebar(navSidebar);
    }
    if (document.querySelector(dictionarySidebar).classList.contains('open') &&
        !document.querySelector(dictionarySidebar).contains(event.target) &&
        event.target !== document.querySelector(dictionaryButton)) {
        toggleSidebar(dictionarySidebar);
    }
}

/**
 * Встановлює активну категорію та оновлює заголовок
 * @param {string} vocab - Назва категорії
 */
function setActiveVocab(vocab) {
    const navItems = document.querySelectorAll(SELECTORS.navItems);
    navItems.forEach(item => {
        const isActive = item.dataset.vocab === vocab;
        item.classList.toggle('active', isActive);
        if (isActive) {
            const categoryTitle = document.querySelector(SELECTORS.categoryTitle);
            const titleText = item.innerText;
            categoryTitle.textContent = titleText.replace(/ \(\d+\)$/, '').replace(/^[^\s]+\s/, '').trim() || 'Анатомія'; // Резервне значення
        }
    });
}

/**
 * Перемикає категорію та оновлює вміст
 * @param {string} vocab - Назва нової категорії
 */
async function switchVocabulary(vocab) {
    state.currentVocab = vocab;
    await loadVocabulary(vocab);
    loadViewedWords(vocab);
    const newWord = getRandomVocabularyWord();
    updateWordDisplay(newWord);
    addToViewedWords(newWord);
    updateWordHistory();
    toggleSidebar(SELECTORS.navSidebar);
    const card = document.querySelector(SELECTORS.card);
    card.classList.add('flip');
    setTimeout(() => card.classList.remove('flip'), 500);
}

/**
 * Ініціалізує додаток при завантаженні сторінки
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadVocabulary(state.currentVocab);
    loadViewedWords(state.currentVocab);
    const currentWord = getRandomVocabularyWord();
    updateWordDisplay(currentWord);
    addToViewedWords(currentWord);

    const checkDOMAndSetTitle = () => {
        const initialNavItem = document.querySelector(`[data-vocab="${state.currentVocab}"]`);
        if (initialNavItem) {
            const categoryTitle = document.querySelector(SELECTORS.categoryTitle);
            const titleText = initialNavItem.innerText;
            categoryTitle.textContent = titleText.replace(/ \(\d+\)$/, '').replace(/^[^\s]+\s/, '').trim() || 'Анатомія';
        } else {
            setTimeout(checkDOMAndSetTitle, 100);
        }
    };
    checkDOMAndSetTitle();

    document.querySelector(SELECTORS.knowButton).addEventListener('click', () => {
        const newWord = getRandomVocabularyWord();
        updateWordDisplay(newWord);
        addToViewedWords(newWord);
        const card = document.querySelector(SELECTORS.card);
        card.classList.add('flip');
        setTimeout(() => card.classList.remove('flip'), 500);
    });

    document.querySelector(SELECTORS.listenButton).addEventListener('click', () => {
        const word = document.querySelector(SELECTORS.wordDisplay).textContent;
        speakWord(word);
    });

    document.querySelector(SELECTORS.dictionaryButton).addEventListener('click', () =>
        toggleSidebar(SELECTORS.dictionarySidebar, true)
    );

    document.querySelector(SELECTORS.filterInput).addEventListener(
        'input',
        utils.debounce((e) => {
            state.currentFilter = e.target.value.toLowerCase();
            updateWordHistory(state.currentFilter);
        }, 300)
    );

    document.querySelector(SELECTORS.menuIcon).addEventListener('click', () =>
        toggleSidebar(SELECTORS.navSidebar)
    );

    document.querySelectorAll(SELECTORS.navItems).forEach(item =>
        item.addEventListener('click', () => {
            const vocab = item.dataset.vocab;
            if (vocab !== state.currentVocab) {
                switchVocabulary(vocab);
                setActiveVocab(vocab);
            } else {
                toggleSidebar(SELECTORS.navSidebar);
            }
        })
    );

    setActiveVocab(state.currentVocab);
    document.addEventListener('click', closeSidebarOnOutsideClick);
});