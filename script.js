// Zachowanie LP: sygnały do dataLayer (wejście dla GTM) i demonstracyjny formularz.
// Sama tablica dataLayer niczego nie wysyła do Google ani Meta.
window.dataLayer = window.dataLayer || [];

const form = document.getElementById('lead-form');
const submitBtn = document.getElementById('lead-submit');
const statusBox = document.getElementById('lead-status');

// cta_click: raz na każde rzeczywiste kliknięcie CTA.
// Lokalizację bierzemy z data-cta-location, a nie z tekstu przycisku, bo tekst może się zmienić.
document.querySelectorAll('[data-cta-location]').forEach(function (cta) {
  cta.addEventListener('click', function (e) {
    if (!e.isTrusted) return; // wywołanie .click() z kodu nie jest kliknięciem użytkownika
    window.dataLayer.push({
      event: 'cta_click',
      cta_location: cta.dataset.ctaLocation
    });
  });
});

// form_start: pierwsza zmiana wartości dowolnego pola w tym wyświetleniu strony.
// Samo kliknięcie w pole (fokus) jeszcze nie jest rozpoczęciem formularza.
let formStarted = false;
function onFirstChange() {
  if (formStarted) return;
  formStarted = true;
  window.dataLayer.push({ event: 'form_start', form_id: form.id });
}
form.addEventListener('input', onFirstChange);
form.addEventListener('change', onFirstChange);

// Walidacja: każde pole ma własny komunikat pod spodem (aria-describedby).
const fields = [
  {
    input: document.getElementById('email'),
    check: function (v) {
      if (!v.trim()) return 'Podaj adres e-mail.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Wpisz adres w formacie nazwa@domena.pl.';
      return '';
    }
  },
  {
    input: document.getElementById('termin'),
    check: function (v) { return v ? '' : 'Wybierz porę konsultacji.'; }
  },
  {
    input: document.getElementById('poziom'),
    check: function (v) { return v ? '' : 'Wybierz, od czego zaczynasz.'; }
  }
];

function showError(field, msg) {
  const box = document.getElementById(field.input.id + '-error');
  box.textContent = msg;
  if (msg) field.input.setAttribute('aria-invalid', 'true');
  else field.input.removeAttribute('aria-invalid');
}

// Po pierwszej próbie wysłania błąd znika, gdy tylko pole zostanie poprawione.
fields.forEach(function (f) {
  f.input.addEventListener('change', function () {
    if (f.input.hasAttribute('aria-invalid')) showError(f, f.check(f.input.value));
  });
  f.input.addEventListener('input', function () {
    if (f.input.hasAttribute('aria-invalid')) showError(f, f.check(f.input.value));
  });
});

// lead_success: najwyżej raz na wyświetlenie strony, tylko po poprawnej walidacji.
let leadDone = false;

form.addEventListener('submit', function (e) {
  // Nie ma żądania do serwera: blokujemy domyślne wysłanie formularza.
  // Pola nie mają atrybutu name, więc nawet bez JS ich wartości nie trafią do adresu URL.
  e.preventDefault();
  if (leadDone) return;

  // 1. Walidacja
  let firstInvalid = null;
  fields.forEach(function (f) {
    const msg = f.check(f.input.value);
    showError(f, msg);
    if (msg && !firstInvalid) firstInvalid = f.input;
  });
  if (firstInvalid) {
    statusBox.className = 'form-status form-status--error';
    statusBox.textContent = 'Popraw zaznaczone pola. Zgłoszenie nie zostało zakończone.';
    firstInvalid.focus();
    return; // błąd = brak sukcesu i brak lead_success
  }

  // 2. Demonstracyjny sukces (w prawdziwym wdrożeniu dopiero po potwierdzeniu serwera)
  leadDone = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Zgłoszenie zakończone';
  statusBox.className = 'form-status form-status--ok';
  statusBox.textContent = 'Demonstracja zakończona — dane nie zostały wysłane.';

  // 3. Sygnał sukcesu: tylko identyfikator formularza, bez wartości pól.
  window.dataLayer.push({ event: 'lead_success', form_id: form.id });
});

// Link „Ustawienia cookies” w stopce: zmiana decyzji o zgodach.
// Do czasu podłączenia CMP (spotkanie 3) pokazuje tylko informację.
document.getElementById('cookie-settings').addEventListener('click', function (e) {
  e.preventDefault();
  if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
    window.Cookiebot.renew();
  } else {
    document.getElementById('cookie-note').textContent =
      'Na tej wersji strony nie działają jeszcze żadne narzędzia pomiarowe, więc nie ma zgód do zmiany.';
  }
});
