const SPEECH_RATE = 1;
const ANIMATION_DURATION = 500;

const SELECTORS = {
    wordDisplay: '.word-display',
    transcription: '.transcription',
    translation: '.translation',
    wordList: '.word-list',
    navSidebar: '#navSidebar',
    dictionaryModal: '#dictionaryModal',
    menuIcon: '.navbar-toggler',
    dictionaryButton: '.dictionary-button',
    knowButton: '.know-button',
    listenButton: '.listen-button',
    filterInput: '.filter-input',
    navItems: '.nav-item',
    card: '.card',
    categoryTitle: '.category-title',
    progressBar: '.progress-bar',
    progressText: '.progress-text',
};

let state = {
    viewedWords: [],
    currentFilter: '',
    VOCABULARY: [],
    currentVocab: 'anatomy',
    currentWord: null,
};

const utils = {
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    },
    getRandomIndex(max) {
        return Math.floor(Math.random() * max);
    },
    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
};

const speakWord = (() => {
    const synth = window.speechSynthesis;
    if (!synth) return () => {};

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
        if (synth.speaking) synth.cancel(); // Зупиняємо попереднє програвання, якщо є
        utterance.text = word;
        synth.speak(utterance);
    };
})();

async function loadVocabulary(vocab) {
    const jsonFile = `vocabulary/${vocab}.json`;
    try {
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        state.VOCABULARY = Array.isArray(data) ? data : [];
        updateProgressBar();
    } catch (error) {
        console.error('Error loading vocabulary:', error);
        state.VOCABULARY = [{ word: 'error', transcription: '[ˈerər]', translation: 'помилка' }];
        updateProgressBar();
    }
}

async function updateAllCategoryCounts() {
    const navItems = document.querySelectorAll(SELECTORS.navItems);
    for (const item of navItems) {
        const vocab = item.dataset.vocab;
        try {
            const response = await fetch(`vocabulary/${vocab}.json`);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : 0;
            const link = item.querySelector('.nav-link');
            const iconElement = link.querySelector('.material-icons');
            const iconName = iconElement ? iconElement.textContent : '';
            const pureText = link.textContent.replace(iconName, '').replace(/\(\d+\)$/, '').trim();
            link.innerHTML = `<span class="material-icons align-middle me-2">${iconName}</span>${pureText} (${count})`;
        } catch (error) {
            console.error(`Error loading ${vocab}.json:`, error);
            const link = item.querySelector('.nav-link');
            const iconElement = link.querySelector('.material-icons');
            const iconName = iconElement ? iconElement.textContent : '';
            const pureText = link.textContent.replace(iconName, '').replace(/\(\d+\)$/, '').trim();
            link.innerHTML = `<span class="material-icons align-middle me-2">${iconName}</span>${pureText} (0)`;
        }
    }
}

function loadViewedWords(vocab) {
    const storageKey = `viewedWords_${vocab}`;
    state.viewedWords = JSON.parse(localStorage.getItem(storageKey)) || [];
}

function getRandomVocabularyWord() {
    if (state.VOCABULARY.length === 0) return { word: 'No words', transcription: '', translation: 'Немає слів для відображення' };
    const randomIndex = utils.getRandomIndex(state.VOCABULARY.length);
    return state.VOCABULARY[randomIndex];
}

function updateWordDisplay({ word, transcription, translation }) {
    document.querySelector(SELECTORS.wordDisplay).textContent = word;
    document.querySelector(SELECTORS.transcription).textContent = transcription;
    document.querySelector(SELECTORS.translation).textContent = translation;
    state.currentWord = { word, transcription, translation };
    updateProgressBar();
}

function addToViewedWords(wordObj) {
    if (!state.viewedWords.some(w => w.word === wordObj.word)) {
        state.viewedWords.push(wordObj);
        utils.saveToLocalStorage(`viewedWords_${state.currentVocab}`, state.viewedWords);
        updateWordHistory(state.currentFilter);
    }
}

function updateProgressBar() {
    const totalWords = state.VOCABULARY.length;
    const viewedWordsCount = state.viewedWords.length;
    const progress = (viewedWordsCount / totalWords) * 100 || 0;
    const progressBar = document.querySelector(SELECTORS.progressBar);
    const progressText = document.querySelector(SELECTORS.progressText);
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    progressText.textContent = `${viewedWordsCount}/${totalWords || 1} вивчених`;
}

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
        list.innerHTML = filterText ? '<li class="list-group-item">Нічого не знайдено</li>' : '<li class="list-group-item">Список пустий</li>';
        return;
    }
    wordsToShow.forEach(entry => {
        const li = document.createElement('li');
        li.dataset.word = entry.word;
        li.classList.add('list-group-item', 'd-flex', 'flex-column', 'cursor-pointer');
        li.innerHTML = `
            <div class="d-flex align-items-center w-100">
                <span class="material-icons" style="color: #4C51BF; margin-right: 8px;">volume_up</span>
                ${entry.word} <small class="text-muted ms-1">${entry.transcription}</small>
            </div>
            <p class="mt-1 ms-0">${entry.translation}</p>
        `;
        li.addEventListener('click', () => speakWord(entry.word));
        list.appendChild(li);
    });
}

async function switchVocabulary(vocab) {
    state.currentVocab = vocab;
    await loadVocabulary(vocab);
    loadViewedWords(vocab);
    const newWord = getRandomVocabularyWord();
    updateWordDisplay(newWord);
    updateWordHistory('');
    const card = document.querySelector(SELECTORS.card);
    card.classList.add('flip');
    setTimeout(() => card.classList.remove('flip'), ANIMATION_DURATION);
    bootstrap.Offcanvas.getInstance(document.querySelector(SELECTORS.navSidebar))?.hide();
    setActiveVocab(vocab);
}

function setActiveVocab(vocab) {
    const navItems = document.querySelectorAll(SELECTORS.navItems);
    navItems.forEach(item => {
        const isActive = item.dataset.vocab === vocab;
        item.classList.toggle('active', isActive);
        if (isActive) {
            const categoryTitle = document.querySelector(SELECTORS.categoryTitle);
            const link = item.querySelector('.nav-link');
            const iconElement = link.querySelector('.material-icons');
            const iconName = iconElement ? iconElement.textContent : '';
            const fullText = link.textContent.replace(iconName, '').replace(/\(\d+\)$/, '').trim().split('(')[0].trim();
            categoryTitle.textContent = fullText || 'Анатомія';
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await updateAllCategoryCounts();
    await loadVocabulary(state.currentVocab);
    loadViewedWords(state.currentVocab);
    const currentWord = getRandomVocabularyWord();
    updateWordDisplay(currentWord);
    updateWordHistory('');
    updateProgressBar();
    document.querySelector(SELECTORS.knowButton).addEventListener('click', () => {
        if (state.currentWord) {
            addToViewedWords(state.currentWord);
            const newWord = getRandomVocabularyWord();
            updateWordDisplay(newWord);
            const card = document.querySelector(SELECTORS.card);
            card.classList.add('flip');
            setTimeout(() => card.classList.remove('flip'), ANIMATION_DURATION);
        }
    });
    document.querySelector(SELECTORS.listenButton).addEventListener('click', () => {
        const word = document.querySelector(SELECTORS.wordDisplay).textContent;
        speakWord(word);
    });
    document.querySelector(SELECTORS.filterInput).addEventListener(
        'input',
        utils.debounce((e) => {
            state.currentFilter = e.target.value.toLowerCase();
            updateWordHistory(state.currentFilter);
        }, 300)
    );
    document.querySelector(SELECTORS.dictionaryButton).addEventListener('click', () => {
        updateWordHistory(state.currentFilter);
    });
    document.querySelectorAll(SELECTORS.navItems).forEach(item =>
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const vocab = item.dataset.vocab;
            if (vocab !== state.currentVocab) switchVocabulary(vocab);
        })
    );
    document.querySelector('.navbar-toggler').addEventListener('click', function () {
        this.classList.toggle('active');
        const offcanvas = document.getElementById('navSidebar');
        offcanvas.addEventListener('hidden.bs.offcanvas', () => {
            this.classList.remove('active');
        }, { once: true });
    });
    setActiveVocab(state.currentVocab);
});
