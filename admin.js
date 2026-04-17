const SESSION_KEY = 'lolipop.admin.session';
const LEGACY_ADMIN_USER = 'Lucas';
const LEGACY_ADMIN_PASS = 'click24web';

const MAX_IMAGE_SIDE = 1200;
const JPG_QUALITY = 0.84;

const loginSection = document.getElementById('loginSection');
const panelSection = document.getElementById('panelSection');
const loginBtn = document.getElementById('loginBtn');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');

const sourceFrame = document.getElementById('sourceFrame');

const heroTitleInput = document.getElementById('heroTitle');
const heroSubtitleInput = document.getElementById('heroSubtitle');
const heroButtonTextInput = document.getElementById('heroButtonText');
const heroButtonHrefInput = document.getElementById('heroButtonHref');
const aboutHtmlInput = document.getElementById('aboutHtml');
const whatsappNumberInput = document.getElementById('whatsappNumber');
const footerCopyrightInput = document.getElementById('footerCopyright');
const saveGlobalBtn = document.getElementById('saveGlobalBtn');

const serviceForm = document.getElementById('serviceForm');
const serviceIndexInput = document.getElementById('serviceIndex');
const serviceTitleInput = document.getElementById('serviceTitle');
const serviceImageAltInput = document.getElementById('serviceImageAlt');
const serviceImageSrcInput = document.getElementById('serviceImageSrc');
const serviceConsultTextInput = document.getElementById('serviceConsultText');
const serviceConsultHrefInput = document.getElementById('serviceConsultHref');
const serviceDescriptionInput = document.getElementById('serviceDescription');
const serviceDetailsDescriptionInput = document.getElementById('serviceDetailsDescription');
const serviceDetailsItemsInput = document.getElementById('serviceDetailsItems');
const addServiceBtn = document.getElementById('addServiceBtn');

const serviceImageFileInput = document.getElementById('serviceImageFile');
const imageDropZone = document.getElementById('imageDropZone');
const pickImageBtn = document.getElementById('pickImageBtn');
const removeImageBtn = document.getElementById('removeImageBtn');
const imagePreview = document.getElementById('imagePreview');
const imageStatus = document.getElementById('imageStatus');

const adminSearchInput = document.getElementById('adminSearchInput');
const servicesTableBody = document.getElementById('servicesTableBody');

const cancelEditBtn = document.getElementById('cancelEditBtn');
const logoutBtn = document.getElementById('logoutBtn');

let contentManager = null;
let defaultState = null;
let state = null;
let uploadedImageData = '';
let existingImageValue = '';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeWhatsApp(input) {
  return String(input || '').replace(/\D/g, '');
}

function setLegacyAuthenticated(value) {
  if (value) sessionStorage.setItem(SESSION_KEY, 'ok');
  else sessionStorage.removeItem(SESSION_KEY);
}

async function isAuthenticated() {
  if (window.CloudDB?.enabled) {
    const cloudOk = await window.CloudDB.hasSession();
    if (cloudOk) return true;
  }
  return sessionStorage.getItem(SESSION_KEY) === 'ok';
}

function showPanel() {
  loginSection.classList.add('hidden');
  panelSection.classList.remove('hidden');
}

function showLogin() {
  panelSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setImageStatus(message) {
  imageStatus.textContent = message;
}

function showPreview(src) {
  if (!src) {
    imagePreview.classList.add('hidden');
    imagePreview.removeAttribute('src');
    return;
  }
  imagePreview.src = src;
  imagePreview.classList.remove('hidden');
}

function fillGlobalInputs() {
  heroTitleInput.value = state?.hero?.title || '';
  heroSubtitleInput.value = state?.hero?.subtitle || '';
  heroButtonTextInput.value = state?.hero?.buttonText || '';
  heroButtonHrefInput.value = state?.hero?.buttonHref || '';
  aboutHtmlInput.value = state?.about?.html || '';
  whatsappNumberInput.value = state?.whatsapp?.number || '';
  footerCopyrightInput.value = state?.footer?.copyright || '';
}

function applyGlobalInputsToState() {
  state.hero.title = heroTitleInput.value.trim();
  state.hero.subtitle = heroSubtitleInput.value.trim();
  state.hero.buttonText = heroButtonTextInput.value.trim();
  state.hero.buttonHref = heroButtonHrefInput.value.trim();
  state.about.html = aboutHtmlInput.value.trim();
  state.whatsapp.number = normalizeWhatsApp(whatsappNumberInput.value);
  state.footer.copyright = footerCopyrightInput.value.trim();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(MAX_IMAGE_SIDE / img.width, MAX_IMAGE_SIDE / img.height, 1);
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPG_QUALITY));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function processSelectedFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen valido.');
    return;
  }

  try {
    const rawDataUrl = await readFileAsDataUrl(file);
    uploadedImageData = await resizeImage(rawDataUrl);
    showPreview(uploadedImageData);
    setImageStatus(`Imagen lista: ${file.name}`);
  } catch {
    alert('No se pudo leer la imagen seleccionada.');
  }
}

function clearServiceForm() {
  serviceIndexInput.value = '';
  serviceTitleInput.value = '';
  serviceImageAltInput.value = '';
  serviceImageSrcInput.value = '';
  serviceConsultTextInput.value = 'Consultar';
  serviceConsultHrefInput.value = '';
  serviceDescriptionInput.value = '';
  serviceDetailsDescriptionInput.value = '';
  serviceDetailsItemsInput.value = '';
  serviceImageFileInput.value = '';
  uploadedImageData = '';
  existingImageValue = '';
  showPreview('');
  setImageStatus('No hay imagen seleccionada.');
}

async function persistState(options) {
  contentManager.saveState(state);

  if (window.CloudDB?.enabled) {
    const loggedInCloud = await window.CloudDB.hasSession();
    if (!loggedInCloud) {
      if (options?.silentIfNoCloud) return;
      throw new Error('Sesion cloud no activa');
    }
    await window.CloudDB.saveContent(state);
  }
}

function rowTemplate(service, index) {
  return `
    <tr>
      <td data-label="#">${index + 1}</td>
      <td data-label="Img"><img src="${escapeHtml(service.imageSrc || '')}" alt="${escapeHtml(service.imageAlt || '')}" /></td>
      <td data-label="Titulo">${escapeHtml(service.title || '')}</td>
      <td data-label="Descripcion">${escapeHtml(service.description || '')}</td>
      <td data-label="Acciones">
        <button class="admin-btn" type="button" onclick="editService(${index})">Editar</button>
        <button class="admin-btn" type="button" onclick="deleteService(${index})">Eliminar</button>
      </td>
    </tr>
  `;
}

function renderServicesTable() {
  const query = adminSearchInput.value.trim().toLowerCase();

  const filtered = state.services
    .map((service, index) => ({ service, index }))
    .filter(({ service }) => {
      if (!query) return true;
      const text = `${service.title || ''} ${service.description || ''} ${service.detailsDescription || ''}`.toLowerCase();
      return text.includes(query);
    });

  if (state.services.length === 0) {
    servicesTableBody.innerHTML = '<tr><td colspan="5">No hay servicios cargados.</td></tr>';
    return;
  }

  servicesTableBody.innerHTML = filtered.length
    ? filtered.map(({ service, index }) => rowTemplate(service, index)).join('')
    : '<tr><td colspan="5">No hay resultados para esa busqueda.</td></tr>';
}

function editService(index) {
  const service = state.services[index];
  if (!service) return;

  serviceIndexInput.value = String(index);
  serviceTitleInput.value = service.title || '';
  serviceImageAltInput.value = service.imageAlt || '';
  serviceImageSrcInput.value = service.imageSrc || '';
  serviceConsultTextInput.value = service.consultText || 'Consultar';
  serviceConsultHrefInput.value = service.consultHref || '';
  serviceDescriptionInput.value = service.description || '';
  serviceDetailsDescriptionInput.value = service.detailsDescription || '';
  serviceDetailsItemsInput.value = Array.isArray(service.detailsItems) ? service.detailsItems.join('\n') : '';

  serviceImageFileInput.value = '';
  uploadedImageData = '';
  existingImageValue = service.imageSrc || '';
  showPreview(existingImageValue);
  setImageStatus(existingImageValue ? 'Imagen actual cargada.' : 'No hay imagen seleccionada.');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteService(index) {
  const service = state.services[index];
  if (!service) return;

  const confirmed = window.confirm(`Seguro que queres eliminar "${service.title || 'este servicio'}"?`);
  if (!confirmed) return;

  state.services.splice(index, 1);
  try {
    await persistState();
    clearServiceForm();
    renderServicesTable();
  } catch (error) {
    console.error(error);
    alert('No se pudo borrar. Verifica que la sesion cloud siga activa.');
  }
}

function newServiceTemplate() {
  return {
    imageSrc: '',
    imageAlt: '',
    title: '',
    description: '',
    consultHref: '',
    consultText: 'Consultar',
    hasDetails: false,
    detailsDescription: '',
    detailsItems: [],
  };
}

async function initState() {
  const localRaw = localStorage.getItem(contentManager.storageKey);
  const localState = localRaw ? contentManager.normalizeState(JSON.parse(localRaw)) : null;

  if (window.CloudDB?.enabled) {
    try {
      const remote = await window.CloudDB.fetchContent();
      if (remote) {
        state = contentManager.normalizeState(remote);
        contentManager.saveState(state);
      } else if (localState) {
        state = localState;
      } else {
        state = contentManager.normalizeState(clone(defaultState));
      }
    } catch (error) {
      console.error('Fallo lectura cloud, uso local.', error);
      state = localState || contentManager.normalizeState(clone(defaultState));
    }
  } else {
    state = localState || contentManager.normalizeState(clone(defaultState));
  }

  if (!Array.isArray(state.services)) state.services = [];

  fillGlobalInputs();
  clearServiceForm();
  renderServicesTable();
}

async function bootstrap() {
  contentManager = window.LolipopContentManager;
  if (!contentManager) {
    alert('No se encontro content-manager.js');
    return;
  }

  await new Promise((resolve) => {
    if (sourceFrame.contentDocument?.readyState === 'complete') {
      resolve();
      return;
    }
    sourceFrame.addEventListener('load', resolve, { once: true });
  });

  const managerInFrame = sourceFrame.contentWindow?.LolipopContentManager;
  if (!managerInFrame) {
    alert('No se pudo leer index.html para tomar contenido base.');
    return;
  }

  defaultState = managerInFrame.getStateFromDom();
  await initState();

  const ok = await isAuthenticated();
  if (ok) showPanel();
  else showLogin();
}

async function handleLogin() {
  const user = loginUser.value.trim();
  const pass = loginPass.value;

  if (window.CloudDB?.enabled && user && pass) {
    try {
      await window.CloudDB.signIn(user, pass);
      showPanel();
      return;
    } catch (error) {
      console.error(error);
      if (!(user === LEGACY_ADMIN_USER && pass === LEGACY_ADMIN_PASS)) {
        alert('No se pudo iniciar sesion cloud. Revisa email y contrasena.');
        return;
      }
    }
  }

  if (user === LEGACY_ADMIN_USER && pass === LEGACY_ADMIN_PASS) {
    setLegacyAuthenticated(true);
    showPanel();
    return;
  }

  alert('Usuario o contrasena incorrectos.');
}

loginBtn.addEventListener('click', handleLogin);
loginPass.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleLogin();
  }
});

saveGlobalBtn.addEventListener('click', async () => {
  try {
    applyGlobalInputsToState();
    await persistState();
    alert('Contenido global guardado.');
  } catch (error) {
    console.error(error);
    alert('No se pudo guardar en nube. Verifica la sesion y vuelve a intentar.');
  }
});

pickImageBtn.addEventListener('click', () => serviceImageFileInput.click());
serviceImageFileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (file) await processSelectedFile(file);
});

removeImageBtn.addEventListener('click', () => {
  uploadedImageData = '';
  serviceImageFileInput.value = '';
  const preview = serviceImageSrcInput.value.trim() || existingImageValue;
  showPreview(preview);
  setImageStatus(preview ? 'Preview por ruta manual.' : 'Imagen subida removida.');
});

['dragenter', 'dragover'].forEach((eventName) => {
  imageDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    imageDropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  imageDropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    imageDropZone.classList.remove('dragover');
  });
});

imageDropZone.addEventListener('drop', async (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (file) await processSelectedFile(file);
});

imageDropZone.addEventListener('click', () => serviceImageFileInput.click());
imageDropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    serviceImageFileInput.click();
  }
});

serviceImageSrcInput.addEventListener('input', () => {
  if (uploadedImageData) return;
  const preview = serviceImageSrcInput.value.trim() || existingImageValue;
  showPreview(preview);
  setImageStatus(preview ? 'Preview por ruta manual.' : 'No hay imagen seleccionada.');
});

adminSearchInput.addEventListener('input', renderServicesTable);

addServiceBtn.addEventListener('click', async () => {
  const title = serviceTitleInput.value.trim();
  const imageAlt = serviceImageAltInput.value.trim();
  const imageSrc = uploadedImageData || serviceImageSrcInput.value.trim();
  const consultText = serviceConsultTextInput.value.trim() || 'Consultar';
  const consultHref = serviceConsultHrefInput.value.trim();
  const description = serviceDescriptionInput.value.trim();
  const detailsDescription = serviceDetailsDescriptionInput.value.trim();
  const detailsItems = serviceDetailsItemsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title || !imageAlt || !imageSrc || !consultHref || !description) {
    alert('Para agregar, completa titulo, imagen, boton y descripcion.');
    return;
  }

  applyGlobalInputsToState();

  const newService = {
    ...newServiceTemplate(),
    title,
    imageAlt,
    imageSrc,
    consultText,
    consultHref,
    description,
    detailsDescription,
    detailsItems,
    hasDetails: Boolean(detailsDescription || detailsItems.length),
  };

  state.services.push(newService);

  try {
    await persistState();
    clearServiceForm();
    renderServicesTable();
    alert('Servicio agregado.');
  } catch (error) {
    console.error(error);
    state.services.pop();
    alert('No se pudo agregar. Verifica la sesion cloud.');
  }
});

serviceForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  applyGlobalInputsToState();

  const rawIndex = serviceIndexInput.value.trim();
  const title = serviceTitleInput.value.trim();
  const imageAlt = serviceImageAltInput.value.trim();
  const imageSrc = uploadedImageData || serviceImageSrcInput.value.trim() || existingImageValue;
  const consultText = serviceConsultTextInput.value.trim() || 'Consultar';
  const consultHref = serviceConsultHrefInput.value.trim();
  const description = serviceDescriptionInput.value.trim();
  const detailsDescription = serviceDetailsDescriptionInput.value.trim();
  const detailsItems = serviceDetailsItemsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title || !imageAlt || !imageSrc || !consultHref || !description) {
    alert('Completa los campos obligatorios del servicio.');
    return;
  }

  const payload = {
    title,
    imageAlt,
    imageSrc,
    consultText,
    consultHref,
    description,
    detailsDescription,
    detailsItems,
    hasDetails: Boolean(detailsDescription || detailsItems.length),
  };

  let rollback = null;

  if (rawIndex === '') {
    state.services.push({ ...newServiceTemplate(), ...payload });
    rollback = () => state.services.pop();
  } else {
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0 || index >= state.services.length) {
      alert('El servicio seleccionado no es valido.');
      return;
    }
    const oldValue = { ...state.services[index] };
    state.services[index] = { ...state.services[index], ...payload };
    rollback = () => {
      state.services[index] = oldValue;
    };
  }

  try {
    await persistState();
    clearServiceForm();
    renderServicesTable();
    alert('Servicio guardado.');
  } catch (error) {
    console.error(error);
    if (rollback) rollback();
    alert('No se pudo guardar. Verifica la sesion cloud.');
  }
});

cancelEditBtn.addEventListener('click', clearServiceForm);

logoutBtn.addEventListener('click', async () => {
  if (window.CloudDB?.enabled) {
    try {
      await window.CloudDB.signOut();
    } catch (error) {
      console.error(error);
    }
  }
  setLegacyAuthenticated(false);
  showLogin();
});

window.editService = editService;
window.deleteService = deleteService;

bootstrap();
