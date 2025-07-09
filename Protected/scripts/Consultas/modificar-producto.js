// First, import the lookup and product-management functions.
// (Currently, these functions are exported from productManager.js; you'll later rename that module to productmanager.js.)
import { getAllCategories } from "/admin-resources/scripts/Database/CategoriesManager.js";
import { getAllBrands } from "/admin-resources/scripts/Database/BrandsManager.js";
import { getAllShelves } from "/admin-resources/scripts/Database/ShelvesManager.js";
import { getAllUnits } from "/admin-resources/scripts/Database/UnitsManager.js";
import { getAllDimensions } from "/admin-resources/scripts/Database/DimensionsManager.js";
import { getProductById, submitUpdatedProductForm } from "/admin-resources/scripts/Database/productManager.js";

// When the DOM is loaded, execute the code below.
document.addEventListener("DOMContentLoaded", () => {
  // Load lookup fields from the database.
  loadCategories();
  loadBrands();
  loadShelves();
  loadUnits();
  loadDimensions();
  console.log("Formulario Actualizado: Campos de lookup cargados.");

  // Setup toggle logic for dimension input fields.
  const toggleDimension = document.getElementById("toggleDimension");
  const dimensionContainer = document.querySelector(".form-grid-container.dimension");
  toggleDimension.addEventListener("change", () => {
    if (toggleDimension.checked) {
      dimensionContainer.style.display = "block";
    } else {
      dimensionContainer.style.display = "none";
      document.getElementById("DimensionValue").value = "0";
      document.getElementById("DimensionId").value = "1";
    }
  });

  // Setup toggle logic for weight input fields.
  const toggleWeight = document.getElementById("toggleWeight");
  const weightContainer = document.querySelector(".form-grid-container.weight");
  toggleWeight.addEventListener("change", () => {
    if (toggleWeight.checked) {
      weightContainer.style.display = "block";
    } else {
      weightContainer.style.display = "none";
      document.getElementById("WeightValue").value = "0";
      document.getElementById("UnidadId").value = "1";
    }
  });

  // Extract the product id from the URL's query string.
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");
  console.log("Product ID received:", productId);
  if (productId) {
    // Load the product details into the form.
    loadProductById(productId);
  } else {
    console.error("No product id provided in the URL.");
  }

  // Get a reference to the product form.
  const form = document.getElementById("productForm");

  // On form submission, gather and submit the updated data.
  form.addEventListener("submit", async event => {
    event.preventDefault();
  
    // Build FormData
    const formData = new FormData();
    formData.append("productId",       document.getElementById("productId").value);
    formData.append("ImagePath",       document.getElementById("currentImagePath").value);
    formData.append("Name",            document.getElementById("productName").value.trim());
    formData.append("Description",     document.getElementById("productDescription").value.trim());
    formData.append("Category_Id",     document.getElementById("CategoriaId").value);
    formData.append("Shelf_Id",        document.getElementById("ShelfId").value);
    formData.append("Price",           document.getElementById("productPrice").value.trim());
    formData.append("Brand_Id",        document.getElementById("BrandId").value);
  
    // Unit & dimension logic (only if toggled on)
    formData.append("Dimension_Value", toggleDimension.checked
      ? document.getElementById("DimensionValue").value.trim()
      : "0");
    formData.append("Dimension_Id",    toggleDimension.checked
      ? document.getElementById("DimensionId").value
      : "1");
  
    formData.append("Unit_Value",      toggleWeight.checked
      ? document.getElementById("WeightValue").value.trim()
      : "0");
    formData.append("Unit_Id",         toggleWeight.checked
      ? document.getElementById("UnidadId").value
      : "1");
  
    formData.append("stock_Quantity",  document.getElementById("productStock").value.trim());
  
    // File‐size check + append
    const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
    const fileInput = document.getElementById("productImageFile");
    const file = fileInput.files[0];
    if (file) {
      if (file.size > MAX_BYTES) {
        alert(`Imagen demasiado grande (máx ${MAX_BYTES/1024/1024} MB).`);
        return;
      }
      formData.append("productImageFile", file);
    }
  
    // Submit via your helper
    try {
      const result = await submitUpdatedProductForm(formData, formData.get("productId"));
      alert(result.message);
      // maybe redirect back to list instead of reset
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  });
  
  
});

/**
 * Loads product details into the form by fetching the product with the specified id.
 * @param {string} id - The product id.
 */
async function loadProductById(id) {
  try {
    const product = await getProductById(id);
    
    // Populate form fields with fetched product data.
    document.getElementById("productId").value = product.Id;
    document.getElementById("productName").value = product.Name;
    document.getElementById("productDescription").value = product.Description;
    document.getElementById("BrandId").value = product.Brand_Id;
    document.getElementById("CategoriaId").value = product.Category_Id;
    document.getElementById("ShelfId").value = product.Shelf_Id;
    document.getElementById("productPrice").value = product.Price;
    document.getElementById("productStock").value = product.Stock_Quantity;
    // Optionally, you can set additional fields if needed.
  } catch (error) {
    console.error("Error fetching product details:", error);
  }
}

/* --------------------
   Lookup loading functions:
   -------------------- */

async function loadCategories() {
  try {
    const categories = await getAllCategories();
    const categorySelect = document.getElementById("CategoriaId");

    if (Array.isArray(categories) && categories.length > 0) {
      categorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.Category_Id;
        option.textContent = category.Name;
        categorySelect.appendChild(option);
      });
    } else {
      categorySelect.innerHTML = `<option value="">No se encontraron categorías</option>`;
    }
  } catch (error) {
    console.error("Error cargando categorías:", error);
    document.getElementById("CategoriaId").innerHTML = `<option value="">Error cargando categorías</option>`;
  }
}

async function loadBrands() {
  try {
    const brands = await getAllBrands();
    const brandSelect = document.getElementById("BrandId");

    if (Array.isArray(brands) && brands.length > 0) {
      brandSelect.innerHTML = '<option value="">Seleccione una Marca</option>';
      brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.Brand_Id;
        option.textContent = brand.Name;
        brandSelect.appendChild(option);
      });
    } else {
      brandSelect.innerHTML = `<option value="">No se encontraron marcas</option>`;
    }
  } catch (error) {
    console.error("Error cargando marcas:", error);
    document.getElementById("BrandId").innerHTML = `<option value="">Error cargando marcas</option>`;
  }
}

async function loadShelves() {
  try {
    const shelves = await getAllShelves();
    const shelfSelect = document.getElementById("ShelfId");

    if (Array.isArray(shelves) && shelves.length > 0) {
      shelfSelect.innerHTML = '<option value="">Seleccione una Estantería</option>';
      shelves.forEach(shelf => {
        const option = document.createElement('option');
        option.value = shelf.Shelf_Id;
        option.textContent = shelf.Name;
        shelfSelect.appendChild(option);
      });
    } else {
      shelfSelect.innerHTML = `<option value="">No se encontraron estanterías</option>`;
    }
  } catch (error) {
    console.error("Error cargando estanterías:", error);
    document.getElementById("ShelfId").innerHTML = `<option value="">Error cargando estanterías</option>`;
  }
}

async function loadUnits() {
  try {
    const units = await getAllUnits();
    const unitSelect = document.getElementById("UnidadId");

    if (Array.isArray(units) && units.length > 0) {
      unitSelect.innerHTML = '<option value="">Seleccione una unidad de medida</option>';
      units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.Unit_Id;
        option.textContent = unit.Name;
        unitSelect.appendChild(option);
      });
    } else {
      unitSelect.innerHTML = `<option value="">No se encontraron unidades</option>`;
    }
  } catch (error) {
    console.error("Error cargando unidades:", error);
    document.getElementById("UnidadId").innerHTML = `<option value="">Error cargando unidades</option>`;
  }
}

async function loadDimensions() {
  try {
    const dimensions = await getAllDimensions();
    const dimensionSelect = document.getElementById("DimensionId");

    if (Array.isArray(dimensions) && dimensions.length > 0) {
      dimensionSelect.innerHTML = '<option value="">Seleccione una unidad de tamaño</option>';
      dimensions.forEach(dimension => {
        const option = document.createElement('option');
        option.value = dimension.Dimension_Id;
        option.textContent = dimension.Name;
        dimensionSelect.appendChild(option);
      });
    } else {
      dimensionSelect.innerHTML = `<option value="">No se encontraron dimensiones</option>`;
    }
  } catch (error) {
    console.error("Error cargando dimensiones:", error);
    document.getElementById("DimensionId").innerHTML = `<option value="">Error cargando dimensiones</option>`;
  }
}
