//CategoriesManager.js
/**
 * Fetches all categories from the server.
 * Calls the /categories route in server.js
 */
export async function getAllCategories() {
    try {
      const response = await fetch(`/categories/getAll`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo las categorias:", error);
      throw error;
    }
}

//CategoriesManager.js
/**
 * Fetches all categories from the server.
 * Calls the /categories route in server.js
 */
export async function SearchCategories() {
  try {
    const response = await fetch(`/categories/Search`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo las categorias:", error);
    throw error;
  }
}


/**
 * Fetches all categories from the server.
 * Calls the /categories route in server.js
 */
export async function UpdateCategories() {
  try {
    const response = await fetch(`/categories/Update`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo las categorias:", error);
    throw error;
  }
}

// CategoriesManager.js
export async function insertNewCategory(categoryData) {
  const response = await fetch('/submit-Category-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Status ${response.status}: ${text}`);
  }
  return response.json();
}
