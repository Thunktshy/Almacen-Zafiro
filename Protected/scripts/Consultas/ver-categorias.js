// /admin-resources/scripts/Consultas/ver-marcas.js

import { getAllCategories } from "/admin-resources/scripts/Database/CategoriesManager.js";

// Wait for the DOM to finish loading
document.addEventListener("DOMContentLoaded", () => {
  // Load categories when the button is clicked
  const loadcategoriesBtn = document.getElementById("loadcategories");
  loadcategoriesBtn.addEventListener("click", loadcategories);

  // Optionally, handle the button to create a new category
  //const gotocategoryFormBtn = document.getElementById("gotocategoryForm");
  //gotocategoryFormBtn.addEventListener("click", () => {
    //window.location.href = "/admin-resources/formularios/nueva-marca.html";
 // });
});

/**
 * Fetch all categories from the server and display them in a DataTable
 */
async function loadcategories() {
  try {
    const categories = await getAllCategories();

    // The container where we'll insert our HTML
    const categoriesListDiv = document.getElementById("categoriesList");

    // If we have category data, build a table
    if (Array.isArray(categories) && categories.length > 0) {
      let html = `
        <table id="categoriesTable" class="table table-striped table-bordered">
          <thead class="table-dark">
            <tr>
              <th>category Id</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
      `;

      categories.forEach(category => {
        html += `
          <tr>
            <td>${category.Category_Id}</td>
            <td>${category.Name}</td>
            <td>${category.Description || ''}</td>
            <td>
              <button type="button" class="btn btn-primary select-btn" data-id="${category.category_Id}">
                Seleccionar
              </button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      categoriesListDiv.innerHTML = html;

      // Initialize DataTables
      $('#categoriesTable').DataTable();

      // Handle the "Seleccionar" action (if needed)
      $('#categoriesTable').on('click', '.select-btn', function() {
        const categoryId = $(this).data('id');
        console.log("Marca seleccionada:", categoryId);
        // Here, you could open a modal, redirect to a category detail page, etc.
      });
    } else {
      categoriesListDiv.innerHTML = `<p class="text-danger">No se encontraron marcas.</p>`;
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    document.getElementById("categoriesList").innerHTML = `<p class="text-danger">Error loading categories.</p>`;
  }
}
