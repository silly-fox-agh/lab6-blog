import './style.css';
import dayjs from 'dayjs';

// ---- PODMIEŃ TUTAJ SWOJE WARTOŚCI Z SUPABASE ---- //
const SUPABASE_URL = 'https://jshphxutugzwhlbzgumy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaHBoeHV0dWd6d2hsYnpndW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTg0MTMsImV4cCI6MjA5NzYzNDQxM30.H_prP1e4dQXpzG1qEzryJILT9RDCYHDIHpzqN3s9G0g';

// Inicjalizujemy odniesienia do naszych kontenerów w HTML
const articlesContainer = document.getElementById('articles-container');
const sortSelect = document.getElementById('sort-select');
const addForm = document.getElementById('add-article-form');

/**
 * Funkcja do asynchronicznego pobierania i sortowania z API za pomocą GET.
 */
const fetchArticles = async () => {
  try {
    // Odczytujemy aktualną wartość selecta i rozdzielamy ją, np. z "created_at.desc" uzyskujemy kolumnę (created_at) i kierunek sortowania (desc)
    const sortValue = sortSelect.value;
    const [column, order] = sortValue.split('.');

    // Wykonanie zapytania GET do API z parametrami select=* (pobierz wszystko) oraz warunkiem sortowania
    const response = await fetch(`${SUPABASE_URL}/rest/v1/article?select=*&order=${column}.${order}`, {
      method: 'GET',
      headers: {
        apiKey: SUPABASE_KEY, // To hasło mówi Supabase: "Masz tu mój token, daj mi dane"
      },
    });

    if (!response.ok) {
      throw new Error(`Wystąpił błąd HTTP podczas zapytania GET. Otrzymany status to: ${response.status}`);
    }
    
    // Przekonwertowanie odpowiedzi na strukturę obiektu (JSON), ułatwi to przetwarzanie w JS.
    const data = await response.json();
    renderArticles(data); 
  } catch (error) {
    console.error('Fetch error:', error);
    articlesContainer.innerHTML = '<p class="text-red-600 text-center">Błąd krytyczny komunikacji z API. Proszę sprawdzić połączenie sieciowe i odświeżyć witrynę lub poprawność konfiguracji tokenu i adresu Supabase URL.</p>';
  }
};

/**
 * Funkcja wstawiająca uzyskane dane do kodu. Tworzy blok div, stylowany, i doczepia jako węzeł potomny do DOM dla każdego wpisu z naszej tablicy.
 */
const renderArticles = (articles) => {
  articlesContainer.innerHTML = '';
  
  if (articles.length === 0) {
    articlesContainer.innerHTML = '<p class="text-gray-500 text-center">Baza danych jest pusta. Dodaj swój pierwszy wpis.</p>';
    return;
  }

  articles.forEach(article => {
    // Sformatowanie daty z użyciem zewnętrznej biblioteki day.js do pożądanego przez wytyczne formatu.
    const formattedDate = dayjs(article.created_at).format('DD-MM-YYYY');
    
    // Obsługa wbudowanych tagów w format array
    const tagsHtml = article.tags && Array.isArray(article.tags) 
      ? article.tags.map(tag => `<span class="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-2 mt-2 inline-block">#${tag.trim()}</span>`).join('') 
      : '';

    const articleEl = document.createElement('div');
    articleEl.className = 'bg-white p-6 rounded shadow border-l-4 border-blue-500';
    
    articleEl.innerHTML = `
      <h3 class="text-2xl font-bold text-gray-900">${article.title}</h3>
      ${article.subtitle ? `<h4 class="text-lg text-gray-600 mb-2 font-medium">${article.subtitle}</h4>` : ''}
      <div class="text-sm text-gray-400 font-medium mb-4 mt-2 flex flex-wrap gap-4">
        <span class="flex items-center gap-1">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
           ${article.author || 'Anonim'}
        </span>
        <span class="flex items-center gap-1">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
           ${formattedDate}
        </span>
      </div>
      <div class="mb-4">
         ${tagsHtml}
      </div>
      <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">${article.content}</p>
    `;
    
    articlesContainer.appendChild(articleEl);
  });
};

/**
 * Zdarzenie słuchacza reagujące na kliknięcie guzika w formularzu. Wysyła metodę typu POST w ujednoliconym obiekcie.
 */
addForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Zapobiega przeładowaniu witryny w momencie przyciśnięcia wyślij.

  // Zamiana stringa pochodzącego od z pola wprowadzania tekstu na typowaną tablicę z podziałem ze znakiem spacji lub samej komy. 
  const tagsInput = document.getElementById('tags').value;
  const parsedTags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

  const newArticle = {
    title: document.getElementById('title').value,
    subtitle: document.getElementById('subtitle').value,
    author: document.getElementById('author').value,
    content: document.getElementById('content').value,
    created_at: document.getElementById('created_at').value, // Zbieranie zdefiniowanej daty i konwersja na zgodny standard
    is_published: true, // Zgodne z zadaniem dodatkowym, defaultem jest FALSE w DB ale ustawiamy je tutaj natywnie na TRUE. 
    tags: parsedTags
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/article`, {
      method: 'POST',
      headers: {
        apiKey: SUPABASE_KEY,
        'Content-Type': 'application/json' // Deklaracja nagłówka, że przekazujemy format obiektu 
      },
      body: JSON.stringify(newArticle) // Pakujemy utworzony model wyżej zmiennej "newArticle"
    });

    if (response.status !== 201) {
      throw new Error(`Błąd HTTP z API od serwera bazy, w odpowiedzi na próbę modyfikacji/publikacji status usterki to: ${response.status}`);
    }

    addForm.reset();
    fetchArticles();
    alert('Twój wpis trafił pomyślnie do bazy. Po wyczyszczeniu formularza i ponownym żądaniu (GET), jest już dostępny do obejrzenia.');

  } catch (error) {
    console.error('Błąd przy tworzeniu:', error);
    alert('Błąd podczas próby utworzenia żądania w tablicy (Brak rekordu), sprawdź poprawność wpisów. Pole "title" jako unikalne wymaga unikalnej nazwy!');
  }
});

// Podpięcie opcji przeładowywania fetch'a po wywołaniu zdarzenia w "Select".
sortSelect.addEventListener('change', fetchArticles);

// Kiedy wszystko w skrypcie się wyrenderuje wykonujemy na zakończenie komendę żądania dla zaciągnięcia inicjalnego bazy danych dla strony po wejściu 
fetchArticles();