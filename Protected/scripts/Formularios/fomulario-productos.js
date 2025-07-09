//FormularioProductos.js
console.log("CargandoScriptFomulario");

import { getAllCategories } from "/admin-resources/scripts/Database/CategoriesManager.js";
import { getAllBrands } from "/admin-resources/scripts/Database/BrandsManager.js";
import { getAllShelves } from "/admin-resources/scripts/Database/ShelvesManager.js";
import { getAllUnits } from "/admin-resources/scripts/Database/UnitsManager.js";
import { getAllDimensions } from "/admin-resources/scripts/Database/DimensionsManager.js";
import { submitProductForm } from '/admin-resources/scripts/Database/productManager.js';
import { getProductCode } from '/admin-resources/scripts/Database/productManager.js';

// Cargar Categorías (principales y secundarias)
async function loadCategories() {
  try {
    const categories = await getAllCategories(); 
    const placeholders = {
      CategoriaId:       'Seleccione categoría principal',
      SegundaCategoriaId:'Seleccione categoría secundaria',
      TerceraCategoriaId:'Seleccione subcategoría'
    };

    // Llenar los tres select con todas las categorías disponibles
    ['CategoriaId','SegundaCategoriaId','TerceraCategoriaId']
      .forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = `<option value="">${placeholders[id]}</option>`; // Placeholder inicial

        categories.forEach(cat => {
          sel.add(new Option(cat.Name, cat.Category_Id)); // Añadir opción
        });

        sel.disabled = categories.length === 0; // Desactivar si está vacío
      });

  } catch (err) {
    console.error('Error cargando categorías:', err);

    // Si ocurre un error, mostrar mensaje en los tres campos
    ['CategoriaId','SegundaCategoriaId','TerceraCategoriaId']
      .forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = `<option value="">Error cargando categorías</option>`;
        sel.disabled = true;
      });
  }
}

// Cargar Marcas
async function loadBrands() {
  try {
    const brands = await getAllBrands();
    console.log(brands);
    const brandSelect = document.getElementById("BrandId");

    if (Array.isArray(brands) && brands.length > 0) {
      brandSelect.innerHTML = '<option value="">Seleccione una Marca</option>'; // Resetear

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
    brandSelect.innerHTML = `<option value="">Error cargando marcas</option>`;
  }
}

// Cargar Estanterías
async function loadShelves() {
  try {
    const shelves = await getAllShelves();
    console.log(shelves);
    const shelfSelect = document.getElementById("ShelfId");

    if (Array.isArray(shelves) && shelves.length > 0) {
      shelfSelect.innerHTML = '<option value="">Seleccione una Estantería</option>'; // Resetear

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
    shelfSelect.innerHTML = `<option value="">Error cargando estanterías</option>`;
  }
}

// Cargar Unidades de medida (peso y stock)
async function loadUnits() {
  try {
    const units = await getAllUnits();
    console.log(units);

    const unitSelect = document.getElementById("UnidadId");
    const stockUnitSelect = document.getElementById("Stock_Unit");

    // Resetear ambos campos
    unitSelect.innerHTML = '<option value="">Seleccione una unidad de medida</option>';
    stockUnitSelect.innerHTML = '<option value="">Seleccione una unidad</option>';

    if (Array.isArray(units) && units.length > 0) {
      units.forEach(unit => {
        const option1 = document.createElement('option');
        option1.value = unit.Unit_Id;
        option1.textContent = unit.Name;
        unitSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = unit.Unit_Id;
        option2.textContent = unit.Name;
        stockUnitSelect.appendChild(option2);
      });
    } else {
      unitSelect.innerHTML = `<option value="">No se encontraron unidades</option>`;
      stockUnitSelect.innerHTML = `<option value="">No se encontraron unidades</option>`;
    }
  } catch (error) {
    console.error("Error cargando unidades:", error);
    document.getElementById("UnidadId").innerHTML = `<option value="">Error cargando unidades</option>`;
    document.getElementById("Stock_Unit").innerHTML = `<option value="">Error cargando unidades</option>`;
  }
}

// Cargar Unidades de tamaño (dimensiones)
async function loadDimensions() {
  try {
    const dimensions = await getAllDimensions();
    console.log(dimensions);
    const dimensionSelect = document.getElementById("DimensionId");

    if (Array.isArray(dimensions) && dimensions.length > 0) {
      dimensionSelect.innerHTML = '<option value="">Seleccione una unidad de tamaño</option>'; // Resetear

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
    dimensionSelect.innerHTML = `<option value="">Error cargando dimensiones</option>`;
  }
}


// Cargar todos los datos necesarios para los campos desplegables del formulario
async function loadCurrentData() {
  await Promise.all([
    loadCategories(),   // Cargar categorías principales y subcategorías
    loadBrands(),       // Cargar marcas
    loadShelves(),      // Cargar estanterías
    loadUnits(),        // Cargar unidades de peso
    loadDimensions()    // Cargar unidades de tamaño
  ]);
}


// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    loadCurrentData(); // Cargar datos iniciales en los campos desplegables
    console.log("Formulario Actualizado");

    // Referencias al formulario y al botón de envío
    const form = document.getElementById('productForm');
    const submitButton = document.getElementById('submitProductForm');

    // Lógica del interruptor para mostrar/ocultar la sección "unidad de tamaño"
    const toggleDimension = document.getElementById("toggleDimension");
    const dimensionContainer = document.querySelector(".grid-dimension");

    toggleDimension.addEventListener("change", () => {
        if (toggleDimension.checked) {
            // Mostrar campos de unidad de tamaño
            dimensionContainer.classList.remove("hidden");
        } else {
            // Ocultar campos y restablecer valores por defecto
            dimensionContainer.classList.add("hidden");
            document.getElementById("DimensionValue").value = "0";
            document.getElementById("DimensionId").value = "1";
        }
    });


    // Lógica del interruptor para mostrar/ocultar la sección "unidad de peso"
    const toggleWeight = document.getElementById("toggleWeight");
    const weightContainer = document.querySelector(".grid-weight");

    toggleWeight.addEventListener("change", () => {
        if (toggleWeight.checked) {
            // Mostrar campos de unidad de peso
            weightContainer.classList.remove("hidden");
        } else {
            // Ocultar campos y restablecer valores por defecto
            weightContainer.classList.add("hidden");
            document.getElementById("WeightValue").value = "0";
            document.getElementById("UnidadId").value = "1";
        }
    });


    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevenir formularios vacíos
        submitButton.disabled = true; // Deshabilitar el botón para evitar envíos repetidos

        const productCodeInput = document.getElementById("productCode");
        let code = productCodeInput.value.trim();

        // Generar un código automáticamente si no se ingresó uno
        if (!code) {
            code = await getProductCode();
            if (!code) {
                alert("No se pudo generar un código de producto.");
                submitButton.disabled = false;
                return;
            }
            productCodeInput.value = code;
        }

        // Construir el objeto con las entradas del formulario para enviarlas a la base de datos
        const productData = {
            Name: document.getElementById("productName").value.trim(),
            Code: code,
            Description: document.getElementById("productDescription").value.trim(),
            Category_Id: document.getElementById("CategoriaId").value,
            Sub_Category_Id: document.getElementById("SegundaCategoriaId").value || 1,
            Sub_Category2: document.getElementById("TerceraCategoriaId").value || 1,
            Shelf_Id: document.getElementById("ShelfId").value,
            Price: document.getElementById("productPrice").value.trim(),
            Brand_Id: document.getElementById("BrandId").value,
            Unit_Id: toggleWeight.checked ? document.getElementById("UnidadId").value : "1",
            Unit_Value: toggleWeight.checked ? document.getElementById("WeightValue").value : "0.00",
            Dimension_Value: toggleDimension.checked ? document.getElementById("DimensionValue").value.trim() : "0",
            Dimension_Id: toggleDimension.checked ? document.getElementById("DimensionId").value : "1",
            stock_Quantity: document.getElementById("productStock").value.trim(),
            Stock_Unit: document.getElementById("Stock_Unit").value || 1,
            ImagePath: "default.jpg" // Valor por defecto si no se ingresa una imagen
        };

        // Añadir texto del formulario al objeto FormData
        const formData = new FormData();
        for (const key in productData) {
            formData.append(key, productData[key]);
        }

        // Verificación del tamaño máximo de la imagen ingresada
        const MAX_BYTES = 10 * 1024 * 1024; // Establecer el tamaño máximo aceptado (10MB)
        const fileInput = document.getElementById("productImageFile");
        const file = fileInput.files[0];
        if (file) {
            if (file.size > MAX_BYTES) {
                alert(`Imagen demasiado grande. Tamaño máximo: ${MAX_BYTES / 1024 / 1024}MB.`);
                submitButton.disabled = false;
                return;
            }
            formData.append("productImageFile", file);
        }

        // Prevenir el envío si hay campos obligatorios vacíos
        const isEmpty = Array.from(formData.values()).some(
            v => v === null || v === "" || v === undefined
        );
        if (isEmpty) {
            alert("Por favor, complete todos los campos requeridos.");
            submitButton.disabled = false;
            return;
        }

        // Intentar enviar el formulario al servidor
        try {
            const result = await submitProductForm(formData);
            alert("Producto enviado con éxito: " + result.message);

            // Recuperar las opciones más recientes de los campos desplegables
            try {
                await loadCurrentData();
            } catch (loadError) {
                console.warn("Error cargando campos actualizados:", loadError);
                alert("Producto guardado, pero ocurrió un error obteniendo campos actualizados.");
            }

            // Restablecer el formulario y rehabilitar el botón de envío
            document.getElementById("productForm").reset();
            weightContainer.classList.add("hidden");
            dimensionContainer.classList.add("hidden");
            document.getElementById("WeightValue").value = "0";
            document.getElementById("UnidadId").value = "1";

        } catch (error) {
            alert("Error al enviar el producto: " + error.message);
        } finally {
            submitButton.disabled = false; // Habilitar el botón al final
        }
    });
      
});

