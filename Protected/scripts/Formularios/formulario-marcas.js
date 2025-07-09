import { insertNewBrand } from '../Database/BrandsManager.js';

document.getElementById("marcaForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  // Build the new category object. Note that the server expects "Name" and "Description".
  const newBrand = {
    Name: document.getElementById("marcaNombre").value,
  };

  try {
    const result = await insertNewBrand(newBrand);
    alert("Marca registrada con éxito :", result);
    document.getElementById("marcaForm").reset();

  } catch (error) {
    alert("Error insertando la marca:", error);
    //notify the user of the error.
  }
});