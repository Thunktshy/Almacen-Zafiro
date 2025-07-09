import { insertNewCategory } from '../Database/CategoriesManager.js';

const form = document.getElementById('categoryForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 1) Grab the single input value
  const nameInput = document.getElementById('categoryName').value.trim();
  if (!nameInput) {
    return alert('Por favor ingresa un nombre de categoría.');
  }

  try {
    // 2) Send plain object, which our helper turns into JSON
    const result = await insertNewCategory({ Name: nameInput });
    alert('Categoría creada con éxito.');
    form.reset();
  } catch (err) {
    console.error(err);
    alert('Error creando categoría: ' + err.message);
  }
});