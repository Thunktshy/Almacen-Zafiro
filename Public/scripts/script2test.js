const nav = document.querySelector('.navigation-primary');

// Al desplazar la página, si se ha hecho scroll más de 50px, añade o quita la clase 'scrolled'
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

const heroSection = document.querySelector('.hero-section');
const totalImages = 40; // Cambia este número según la cantidad que tengas

const images = [];
for (let i = 1; i <= totalImages; i++) {
  images.push(`./images/silder-images/hero-background (${i}).jpg`);
}

let currentIndex = 0;

// Cambia la imagen de fondo de la sección “hero” cada 5 segundos
function changeHeroBackground() {
  currentIndex = (currentIndex + 1) % images.length;
  heroSection.style.backgroundImage = `url('${images[currentIndex]}')`;
}

setInterval(changeHeroBackground, 5000);

function copyEmail() {
  const emailText = document.querySelector('.email-text').textContent;
  navigator.clipboard.writeText(emailText)
    .then(() => {
      const tooltip = document.querySelector('.copy-tooltip');
      tooltip.textContent = '¡Copiado!';
      setTimeout(() => {
        tooltip.textContent = 'Haz clic para copiar';
      }, 2000);
    })
    .catch(err => {
      console.error('Error al copiar: ', err);
    });
}

function showError(message) {
  const errorMessageElement = document.getElementById("error-message");
  errorMessageElement.textContent = message;
  // Añade clases para mostrar la alerta con estilo de Bootstrap
  errorMessageElement.classList.add('alert', 'alert-danger', 'active');

  // Elimina la clase 'fade-out' si existe (por si se llamó varias veces)
  errorMessageElement.classList.remove('fade-out');

  // Muestra la alerta durante 5 segundos y luego comienza el desvanecimiento
  setTimeout(() => {
      // Inicia el desvanecimiento
      errorMessageElement.classList.add('fade-out');
      setTimeout(() => {
          // Oculta la alerta después del desvanecimiento
          errorMessageElement.classList.remove('active', 'fade-out');
      }, 500); // Debe coincidir con la duración de la transición en CSS
  }, 5000); // Mantener visible durante 5 segundos
}

function scrollToFooter(event) {
  // Prevenir el comportamiento predeterminado del enlace
  event.preventDefault();
  const footer = document.getElementById('contacto');
  if (footer) {
    // Scroll suave hasta el footer
    footer.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToServicios(event) {
  // Prevenir el comportamiento predeterminado del enlace
  event.preventDefault();
  const section = document.getElementById('servicios');
  if (section){
    // Scroll suave hasta la sección de servicios
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function toggleExperienceFocus(event, card) {
  const experienceSection = document.querySelector('.experience-section');
  const isFocused = card.classList.contains('focused-card');

  // Si ya está enfocado, sólo permitir cerrar si el evento viene del botón de alternar
  if (isFocused && !event.target.classList.contains('toggle-btn')) {
    return;
  }

  if (!isFocused) {
    // Oculta todas las demás tarjetas
    document.querySelectorAll('.experience-card').forEach(c => {
      c.classList.remove('focused-card', 'active');
      c.style.display = 'none';
    });

    // Activa el modo foco en la tarjeta clicada
    experienceSection.classList.add('focus-mode');
    card.classList.add('focused-card', 'active');
    card.style.display = 'block';

    // Cambia el texto del botón a un icono de cierre
    const toggleBtn = card.querySelector('.toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = '&times;';
      toggleBtn.classList.add('close-focus');
    }

    // Muestra la sección de detalles
    const details = card.querySelector('.experience-details');
    if (details) {
      details.style.display = 'block';
    }
  } else {
    exitExperienceFocusMode();
  }
}

function exitExperienceFocusMode() {
  document.querySelectorAll('.experience-card').forEach(c => {
    c.classList.remove('focused-card', 'active');
    c.style.display = 'block';

    // Restaura el texto del botón
    const toggleBtn = c.querySelector('.toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = 'Ver Detalles';
      toggleBtn.classList.remove('close-focus');
    }

    // Oculta la sección de detalles
    const details = c.querySelector('.experience-details');
    if (details) {
      details.style.display = 'none';
    }
  });

  document.querySelector('.experience-section').classList.remove('focus-mode');
}
