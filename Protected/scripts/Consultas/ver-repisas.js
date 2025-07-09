// /admin-resources/scripts/Consultas/ver-marcas.js

import { getAllShelves } from "/admin-resources/scripts/Database/ShelvesManager.js";

// Wait for the DOM to finish loading
document.addEventListener("DOMContentLoaded", () => {
  // Load brands when the button is clicked
  const loadBrandsBtn = document.getElementById("loadBrands");
  loadBrandsBtn.addEventListener("click", loadBrands);

  // Optionally, handle the button to create a new brand
  const gotoBrandFormBtn = document.getElementById("gotoBrandForm");
  gotoBrandFormBtn.addEventListener("click", () => {
    window.location.href = "/admin-resources/formularios/nueva-marca.html";
  });
});

/**
 * Fetch all brands from the server and display them in a DataTable
 */
async function loadBrands() {
  try {
    const shelves = await getAllShelves();

    // The container where we'll insert our HTML
    const shelvesListDiv = document.getElementById("shelvesList");

    // If we have brand data, build a table
    if (Array.isArray(shelves) && shelves.length > 0) {
      let html = `
        <table id="shelvesTable" class="table table-striped table-bordered">
          <thead class="table-dark">
            <tr>
              <th>Id </th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
      `;

      shelves.forEach(shelf => {
        html += `
          <tr>
            <td>${shelf.Shelf_Id}</td>
            <td>${shelf.Name}</td>
            <td>${shelf.Description || ''}</td>
            <td>
              <button type="button" class="btn btn-primary select-btn" data-id="${shelf.Shelf_Id}">
                Seleccionar
              </button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      shelvesListDiv.innerHTML = html;

      // Initialize DataTables
      $('#brandsTable').DataTable();

      // Handle the "Seleccionar" action (if needed)
      $('#brandsTable').on('click', '.select-btn', function() {
        const shelfId = $(this).data('id');
        console.log("Marca seleccionada:", shelfId);
        // Here, you could open a modal, redirect to a brand detail page, etc.
      });
    } else {
      brandsListDiv.innerHTML = `<p class="text-danger">No se encontraron marcas.</p>`;
    }
  } catch (error) {
    console.error("Error loading brands:", error);
    document.getElementById("brandsList").innerHTML = `<p class="text-danger">Error loading brands.</p>`;
  }
}
