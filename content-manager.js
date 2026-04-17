(function () {
  const STORAGE_KEY = 'lolipop_admin_content_v1';

  function normalizeWhatsApp(input) {
    return String(input || '').replace(/\D/g, '');
  }

  function setText(el, value) {
    if (el && typeof value === 'string') {
      el.textContent = value;
    }
  }

  function setHtml(el, value) {
    if (el && typeof value === 'string') {
      el.innerHTML = value;
    }
  }

  function normalizeService(service) {
    const detailsItems = Array.isArray(service?.detailsItems)
      ? service.detailsItems.map((item) => String(item || '').trim()).filter(Boolean)
      : [];

    return {
      imageSrc: String(service?.imageSrc || '').trim(),
      imageAlt: String(service?.imageAlt || '').trim(),
      title: String(service?.title || '').trim(),
      description: String(service?.description || '').trim(),
      consultHref: String(service?.consultHref || '').trim(),
      consultText: String(service?.consultText || 'Consultar').trim() || 'Consultar',
      hasDetails: Boolean(service?.hasDetails || String(service?.detailsDescription || '').trim() || detailsItems.length),
      detailsDescription: String(service?.detailsDescription || '').trim(),
      detailsItems,
    };
  }

  function normalizeState(state) {
    return {
      hero: {
        title: String(state?.hero?.title || '').trim(),
        subtitle: String(state?.hero?.subtitle || '').trim(),
        buttonText: String(state?.hero?.buttonText || '').trim(),
        buttonHref: String(state?.hero?.buttonHref || '').trim(),
      },
      about: {
        html: typeof state?.about?.html === 'string' ? state.about.html : '',
      },
      footer: {
        copyright: String(state?.footer?.copyright || '').trim(),
      },
      whatsapp: {
        number: normalizeWhatsApp(state?.whatsapp?.number || ''),
      },
      services: Array.isArray(state?.services) ? state.services.map(normalizeService) : [],
    };
  }

  function getStateFromDom() {
    const heroTitle = document.querySelector('.hero h2');
    const heroSubtitle = document.querySelector('.hero p');
    const heroButton = document.querySelector('.hero .btn');
    const aboutText = document.querySelector('#nosotros .about-box p');
    const footerCopyright = document.querySelector('footer p:first-child');

    const cards = Array.from(document.querySelectorAll('#catalogo .card')).map((card) => {
      const image = card.querySelector('.main-img');
      const title = card.querySelector('.card-body h3');
      const mainDesc = card.querySelector('.card-body > div > .desc');
      const consultLink = card.querySelector('.btn-secondary');
      const details = card.querySelector('.card-details');
      const detailsDesc = details ? details.querySelector('.desc') : null;
      const detailsItems = details
        ? Array.from(details.querySelectorAll('.details-list li')).map((li) => li.textContent.trim())
        : [];

      return {
        imageSrc: image ? image.getAttribute('src') || '' : '',
        imageAlt: image ? image.getAttribute('alt') || '' : '',
        title: title ? title.textContent.trim() : '',
        description: mainDesc ? mainDesc.textContent.trim() : '',
        consultHref: consultLink ? consultLink.getAttribute('href') || '' : '',
        consultText: consultLink ? consultLink.textContent.trim() : 'Consultar',
        hasDetails: Boolean(details),
        detailsDescription: detailsDesc ? detailsDesc.textContent.trim() : '',
        detailsItems,
      };
    });

    const whatsappLinks = Array.from(document.querySelectorAll('a[href*="wa.me/"]'));
    const firstWa = whatsappLinks[0] ? whatsappLinks[0].getAttribute('href') || '' : '';
    const waNumber = normalizeWhatsApp(firstWa.replace(/^https?:\/\/wa\.me\//i, '').split('?')[0]);

    return normalizeState({
      hero: {
        title: heroTitle ? heroTitle.textContent.trim() : '',
        subtitle: heroSubtitle ? heroSubtitle.textContent.trim() : '',
        buttonText: heroButton ? heroButton.textContent.trim() : '',
        buttonHref: heroButton ? heroButton.getAttribute('href') || '' : '',
      },
      about: {
        html: aboutText ? aboutText.innerHTML : '',
      },
      footer: {
        copyright: footerCopyright ? footerCopyright.textContent.trim() : '',
      },
      whatsapp: {
        number: waNumber,
      },
      services: cards,
    });
  }

  function ensureCardBody(card) {
    let body = card.querySelector('.card-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'card-body';
      card.appendChild(body);
    }

    let contentWrap = body.querySelector(':scope > div');
    if (!contentWrap) {
      contentWrap = document.createElement('div');
      body.prepend(contentWrap);
    }

    let cta = body.querySelector(':scope > a.btn-secondary');
    if (!cta) {
      cta = document.createElement('a');
      cta.className = 'btn-secondary';
      body.appendChild(cta);
    }

    return { body, contentWrap, cta };
  }

  function buildDetailsBlock(service) {
    const details = document.createElement('div');
    details.className = 'card-details';

    const detailsDesc = document.createElement('p');
    detailsDesc.className = 'desc';
    detailsDesc.textContent = service.detailsDescription || '';
    details.appendChild(detailsDesc);

    const detailsList = document.createElement('ul');
    detailsList.className = 'details-list';
    service.detailsItems.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      detailsList.appendChild(li);
    });
    details.appendChild(detailsList);

    return details;
  }

  function updateCard(card, service) {
    const normalized = normalizeService(service);

    let image = card.querySelector('.main-img');
    if (!image) {
      image = document.createElement('img');
      image.className = 'main-img';
      card.prepend(image);
    }

    image.setAttribute('src', normalized.imageSrc);
    image.setAttribute('alt', normalized.imageAlt || normalized.title || 'Servicio');

    const { contentWrap, cta } = ensureCardBody(card);

    let title = contentWrap.querySelector('h3');
    if (!title) {
      title = document.createElement('h3');
      contentWrap.appendChild(title);
    }
    title.textContent = normalized.title;

    let mainDesc = contentWrap.querySelector(':scope > .desc');
    if (!mainDesc) {
      mainDesc = document.createElement('p');
      mainDesc.className = 'desc';
      contentWrap.appendChild(mainDesc);
    }
    mainDesc.textContent = normalized.description;

    let readMoreBtn = contentWrap.querySelector('.btn-read-more');
    let details = contentWrap.querySelector('.card-details');

    if (normalized.hasDetails) {
      if (!readMoreBtn) {
        readMoreBtn = document.createElement('button');
        readMoreBtn.className = 'btn-read-more';
        readMoreBtn.type = 'button';
        readMoreBtn.setAttribute('onclick', 'toggleDetails(this)');
        readMoreBtn.innerHTML = 'Leer mas <i>↓</i>';
        contentWrap.appendChild(readMoreBtn);
      }

      if (!details) {
        details = buildDetailsBlock(normalized);
        contentWrap.appendChild(details);
      } else {
        const detailsDesc = details.querySelector('.desc') || details.appendChild(document.createElement('p'));
        detailsDesc.className = 'desc';
        detailsDesc.textContent = normalized.detailsDescription || '';

        let detailsList = details.querySelector('.details-list');
        if (!detailsList) {
          detailsList = document.createElement('ul');
          detailsList.className = 'details-list';
          details.appendChild(detailsList);
        }

        detailsList.innerHTML = '';
        normalized.detailsItems.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          detailsList.appendChild(li);
        });
      }
    } else {
      if (readMoreBtn) readMoreBtn.remove();
      if (details) details.remove();
      card.classList.remove('expanded');
    }

    cta.setAttribute('href', normalized.consultHref || '#');
    cta.textContent = normalized.consultText || 'Consultar';
  }

  function createCardElement(service) {
    const card = document.createElement('div');
    card.className = 'card reveal active';
    updateCard(card, service);
    return card;
  }

  function applyState(inputState) {
    const state = normalizeState(inputState);

    const heroTitle = document.querySelector('.hero h2');
    const heroSubtitle = document.querySelector('.hero p');
    const heroButton = document.querySelector('.hero .btn');
    const aboutText = document.querySelector('#nosotros .about-box p');
    const footerCopyright = document.querySelector('footer p:first-child');

    setText(heroTitle, state.hero.title);
    setText(heroSubtitle, state.hero.subtitle);
    setText(heroButton, state.hero.buttonText);
    if (heroButton && state.hero.buttonHref) {
      heroButton.setAttribute('href', state.hero.buttonHref);
    }

    setHtml(aboutText, state.about.html);
    setText(footerCopyright, state.footer.copyright);

    if (state.whatsapp.number) {
      const whatsappLinks = Array.from(document.querySelectorAll('a[href*="wa.me/"]'));
      whatsappLinks.forEach((link) => {
        const current = link.getAttribute('href') || '';
        const queryIndex = current.indexOf('?');
        const suffix = queryIndex >= 0 ? current.slice(queryIndex) : '';
        link.setAttribute('href', 'https://wa.me/' + state.whatsapp.number + suffix);
      });
    }

    const grid = document.querySelector('#catalogo .grid');
    if (!grid) {
      return;
    }

    const cards = Array.from(grid.querySelectorAll(':scope > .card'));

    state.services.forEach((service, index) => {
      if (cards[index]) {
        cards[index].style.display = '';
        updateCard(cards[index], service);
      } else {
        grid.appendChild(createCardElement(service));
      }
    });

    if (state.services.length < cards.length) {
      for (let i = state.services.length; i < cards.length; i += 1) {
        cards[i].remove();
      }
    }
  }

  async function loadState() {
    try {
      if (window.CloudDB?.enabled) {
        const remote = await window.CloudDB.fetchContent();
        if (remote) {
          const normalized = normalizeState(remote);
          applyState(normalized);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = normalizeState(JSON.parse(raw));
      applyState(parsed);
      return parsed;
    } catch (error) {
      console.error('No se pudo cargar el contenido del panel admin.', error);
      return null;
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
  }

  function clearState() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.LolipopContentManager = {
    storageKey: STORAGE_KEY,
    normalizeState,
    getStateFromDom,
    applyState,
    loadState,
    saveState,
    clearState,
  };
})();
