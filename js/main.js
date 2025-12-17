// DOM
document.addEventListener('DOMContentLoaded', () => {
  initBikesSlider();
  initActiveMenu();
  initFaqAccordion();
  initCatalogFilters();
  initBooking();
  initBookingSuccess();
});


// Слайдер
function initBikesSlider() {
 
  if (typeof $ === 'undefined') return;

  const $slider = $('.bikes-slider');
  if (!$slider.length) return; 

  $slider.slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    dots: true,
    arrows: true,
    infinite: false,
    responsive: [
      {
        breakpoint: 900,
        settings: { slidesToShow: 2 }
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 1 }
      }
    ]
  });
}


// Подсветка в менюм
function initActiveMenu() {
  const currentPage = window.location.pathname.split('/').pop();
  const menuLinks = document.querySelectorAll('.nav_link');

  menuLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('nav_link-active');
    }
  });
}


// FAQ
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq_item');
  if (!items.length) return;

  items.forEach(item => {
    const question = item.querySelector('.faq_question');
    const answer = item.querySelector('.faq_answer');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      item.classList.toggle('active');

      if (item.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = null;
      }
    });
  });
}


// Применить фильтры к карточкам
function applyCatalogFilters() {
  // Берем только те карточки, у которых заданы data-атрибуты
  const cards = document.querySelectorAll('.catalog_grid .bike_card[data-type]');
  if (!cards.length) return;

  // Тип велосипеда
  const typeInput = document.querySelector('input[name="bike-type"]:checked');
  const selectedType = typeInput ? typeInput.value : 'all';

  // Цена
  const priceInput = document.getElementById('filter-price');
  const maxPrice = priceInput ? parseInt(priceInput.value, 10) : Infinity;

  // Что включено
  const helmetCheckbox = document.getElementById('filter-helmet');
  const lockCheckbox   = document.getElementById('filter-lock');
  const pumpCheckbox   = document.getElementById('filter-pump');

  const filterHelmet = helmetCheckbox ? helmetCheckbox.checked : false;
  const filterLock   = lockCheckbox   ? lockCheckbox.checked   : false;
  const filterPump   = pumpCheckbox   ? pumpCheckbox.checked   : false;

  cards.forEach(card => {
    const bikeType  = card.dataset.type || 'all';
    const bikePrice = parseInt(card.dataset.price || '0', 10);

    const hasHelmet = card.dataset.helmet === '1';
    const hasLock   = card.dataset.lock   === '1';
    const hasPump   = card.dataset.pump   === '1';

    const typeMatch   = (selectedType === 'all') || (bikeType === selectedType);
    const priceMatch  = bikePrice <= maxPrice;
    const helmetMatch = !filterHelmet || hasHelmet;
    const lockMatch   = !filterLock   || hasLock;
    const pumpMatch   = !filterPump   || hasPump;

    const finalMatch = typeMatch && priceMatch && helmetMatch && lockMatch && pumpMatch;

    // Карточки в сетке сделаны как flex колонки
    card.style.display = finalMatch ? 'flex' : 'none';
  });
}


// Инициализация фильтров каталога
function initCatalogFilters() {
  const priceInput = document.getElementById('filter-price');
  const priceLabel = document.getElementById('filter-price-label');
  const typeRadios = document.querySelectorAll('input[name="bike-type"]');

  if (!priceInput || !priceLabel || !typeRadios.length) return;

  const updatePriceLabel = () => {
    priceLabel.textContent = priceInput.value + ' ₽';
  };

  // Стартовые значения
  updatePriceLabel();
  applyCatalogFilters();

  // Смена типа
  typeRadios.forEach(r => {
    r.addEventListener('change', applyCatalogFilters);
  });

  // Слайдер цены
  priceInput.addEventListener('input', () => {
    updatePriceLabel();
    applyCatalogFilters();
  });

  ['filter-helmet', 'filter-lock', 'filter-pump'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyCatalogFilters);
  });
}


// Данные бронирования
let currentStep  = 1;
let basePrice    = 0;
let extrasPrice  = 0;

const bookingData = {
  model: '',
  date: '',
  time: '',
  durationHours: 0,
  durationText: '',
  count: 1,
  extras: [],
  name: '',
  phone: '',
  email: '',
  payment: 'cash',
  total: 0,
  orderId: null
};


// Шаги бронирования
function goToStep(step) {
  currentStep = step;

  document.querySelectorAll('.step-content').forEach(el => {
    el.style.display = 'none';
  });

  const currentBlock = document.getElementById('step' + step);
  if (currentBlock) currentBlock.style.display = 'block';

  updateStepIndicator(step);
}

function updateStepIndicator(step) {
  const header = document.getElementById('stepsHeader');
  if (!header) return;

  header.classList.remove('active-1', 'active-2', 'active-3');
  header.classList.add('active-' + step);

  header.querySelectorAll('.step').forEach(stepEl => {
    const s = Number(stepEl.dataset.step);
    stepEl.classList.toggle('active', s <= step);
  });
}


// ШАГ 1
function updateStep1Summary() {
  const modelSel    = document.getElementById('bike-model');
  const dateInput   = document.getElementById('date-start');
  const timeInput   = document.getElementById('time-start');
  const durationSel = document.getElementById('duration');
  const countInput  = document.getElementById('bike-count');

  if (!modelSel || !dateInput || !timeInput || !durationSel || !countInput) return;

  const date        = dateInput.value;
  const time        = timeInput.value;
  const durationVal = durationSel.value;
  const count       = Number(countInput.value || '1');

  const durationMap = {
    '1':  { text: '1 час',  hours: 1 },
    '3':  { text: '3 часа', hours: 3 },
    '24': { text: '1 день', hours: 24 }
  };

  const dur = durationMap[durationVal] || { text: '—', hours: 0 };
  const datetime = `${date || '—'} ${time || ''}`.trim();

  // Соответствие цен моделей
  const prices = {
    'City Comfort':    300,
    'City Pro':        400,
    'Mountain Trail':  400,
    'Mountain Extreme':450,
    'E-Bike City':     500,
    'Kids Bike':       200,
    'Kids Bike Pro':   250
  };

  const modelName = modelSel.value;
  const price     = prices[modelName] || 0;

  basePrice = price * dur.hours * count;

  // Сохраняем в объект бронирования
  bookingData.model        = modelName || '—';
  bookingData.date         = date;
  bookingData.time         = time;
  bookingData.durationText = dur.text;
  bookingData.durationHours= dur.hours;
  bookingData.count        = count;
  bookingData.total        = basePrice + extrasPrice;

  // Обновляем сводку шага 1
  setText('summary-model',     bookingData.model);
  setText('summary-datetime',  datetime);
  setText('summary-duration',  dur.text);
  setText('summary-count',     `${count} велосипед(ов)`);
  setText('summary-total',     bookingData.total + ' ₽');

  // Синхронизация шага 2 и 3
  setText('summary-model-2',    bookingData.model);
  setText('summary-datetime-2', datetime);
  setText('summary-duration-2', dur.text);
  setText('summary-count-2',    `${count} велосипед(ов)`);

  setText('summary-model-3',    bookingData.model);
  setText('summary-datetime-3', datetime);
  setText('summary-duration-3', dur.text);
  setText('summary-count-3',    `${count} велосипед(ов)`);
}


// ШАГ 2
function updateExtras() {
  const seat     = document.getElementById('extra-seat');
  const delivery = document.getElementById('extra-delivery');

  let extras = [];
  let extraSum = 0;

  // Шлем всегда включен
  extras.push('Шлем');

  if (seat && seat.checked) {
    extras.push('Детское сиденье (+ 50 ₽)');
    extraSum += 50;
  }

  if (delivery && delivery.checked) {
    extras.push('Доставка (+ 100 ₽)');
    extraSum += 100;
  }

  extrasPrice = extraSum;
  bookingData.extras = extras;
  bookingData.total  = basePrice + extrasPrice;

  // Обновляем сводку шаг 2 и 3
  setText('summary-extras-2', extras.join(', '));
  setText('summary-total-2',  bookingData.total + ' ₽');

  setText('summary-extras-3', extras.join(', '));
  setText('summary-total-3',  bookingData.total + ' ₽');
}

function updateContacts() {
  const nameEl  = document.getElementById('user-name');
  const phoneEl = document.getElementById('user-phone');
  const mailEl  = document.getElementById('user-email');

  bookingData.name  = nameEl  ? nameEl.value.trim()  : '';
  bookingData.phone = phoneEl ? phoneEl.value.trim() : '';
  bookingData.email = mailEl  ? mailEl.value.trim()  : '';
}


// ШАГ 3
function updatePayment() {
  const method = document.querySelector('input[name="payment"]:checked');
  bookingData.payment = method ? method.value : 'cash';
}


// Сохранение брони и переход на финал
function saveBooking() {
  updatePayment();
  updateContacts();
  localStorage.setItem('velo-booking', JSON.stringify(bookingData));
  window.location.href = 'reserve-success.html';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// 13. Инициализация бронирования (шаги + валидация)
function initBooking() {
  const step1Form = document.getElementById('step1-form');
  const step2Form = document.getElementById('step2-form');

  const step1NextBtn = document.querySelector('#step1 .booking_btn-next');
  const step2NextBtn = document.querySelector('#step2 .booking_btn-next');
  const step3NextBtn = document.querySelector('#step3 .booking_btn-next');

  
  if (!step1Form || !step1NextBtn) return;

  goToStep(1);

  // из ШАГ 1 в ШАГ 2 
  step1NextBtn.addEventListener('click', () => {
    if (!step1Form.reportValidity()) return; // HTML5 валидация

    updateStep1Summary();
    updateExtras();
    goToStep(2);
  });

  // Обновление доп.опций при изменении чекбоксов
  ['extra-seat', 'extra-delivery'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateExtras);
  });

  // По изменению полей шага 1 сразу обновляем сводку
  ['bike-model', 'date-start', 'time-start', 'duration', 'bike-count'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateStep1Summary);
  });

  // из ШАГ 2 в ШАГ 3
  if (step2Form && step2NextBtn) {
    step2NextBtn.addEventListener('click', () => {
      if (!step2Form.reportValidity()) return; 

      updateContacts();
      goToStep(3);
    });
  }

  // ШАГ 3
  if (step3NextBtn) {
    step3NextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveBooking();
    });
  }

  // Первичное заполнение сводки
  updateStep1Summary();
  updateExtras();
}



// Бронирование подтверждено
function initBookingSuccess() {
  // Проверяем, что это та страница
  const successBlock = document.querySelector('.booking-success');
  if (!successBlock) return;

  const raw = localStorage.getItem('velo-booking');
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return;
  }

  const rows = document.querySelectorAll('.success_row-value');
  if (!rows.length) return;

  const datetimeText      = `${data.date || '—'}<br>${data.time || ''}`;
  const modelDurationText = `${data.model || '—'}<br>${data.durationText || '—'}`;

  let paymentReadable = 'Оплата при получении';
  if (data.payment === 'online') paymentReadable = 'Онлайн оплата';

  const paymentText = `${data.total || 0} ₽<br>${paymentReadable}`;

  if (rows[0]) rows[0].innerHTML = datetimeText;
  if (rows[1]) rows[1].innerHTML = modelDurationText;
  // rows[2] статичный адрес
  if (rows[3]) rows[3].innerHTML = paymentText;

  // Номер заказа
  const orderEl = document.querySelector('.success_order-number span');
  if (orderEl) {
    if (data.orderId) {
      orderEl.textContent = data.orderId;
    } else {
      const rnd = Math.floor(Math.random() * 900 + 100);
      const id  = `ORD-${new Date().getFullYear()}-${rnd}`;
      orderEl.textContent = id;

      data.orderId = id;
      localStorage.setItem('velo-booking', JSON.stringify(data));
    }
  }
}

// Поп-ап
function initQuestionPopup() {
  const form = document.getElementById('question-form');
  const popup = document.getElementById('question-popup');
  const closeBtn = document.getElementById('question-popup-close');

  if (!form || !popup || !closeBtn) return;

  const openPopup = () => popup.classList.add('is-open');
  const closePopup = () => popup.classList.remove('is-open');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    form.reset();
    openPopup();
  });

  closeBtn.addEventListener('click', closePopup);

  popup.addEventListener('click', (e) => {
    if (e.target.classList.contains('popup_backdrop')) {
      closePopup();
    }
  });
}

document.addEventListener("DOMContentLoaded", initQuestionPopup);

// Запрет выбора прошедшей даты в бронировании
document.addEventListener("DOMContentLoaded", () => {
  const dateStart = document.getElementById("date-start");

  if (dateStart) {
    // Получаем сегодняшнюю дату в формате YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    // Устанавливаем ограничение
    dateStart.min = today;
  }
});