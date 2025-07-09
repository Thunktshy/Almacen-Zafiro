// productManager.js

/**
 * Submits a new product form (with image) to the server.
 * Expects a FormData instance containing all fields + the file.
 */
export async function submitProductForm(formData) {
  try {
    const response = await fetch('/submit-Product-form', {
      method: 'POST',
      // no headers: let the browser set multipart/form-data
      body: formData
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result; 
  } catch (error) {
    console.error("Error submitting new product:", error);
    throw error;
  }
}

/**
 * Fetches all active products from the server.
 * Calls the /active-products route in server.js
 */
export async function getAllProducts() {
  try {
    const response = await fetch(`/active-products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export async function getAllActiveProducts() {
  try {
    const response = await fetch(`/products/active`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}



/**
 * Fetches a single product by its ID.
 * Uses a query parameter instead of a path param.
 */
export async function getProductById(id) {
  try {
    const response = await fetch(`/productwithId?id=${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching product by id:", error);
    throw error;
  }
}

/**
 * Submits an updated product form to the server.
 * Expects a FormData instance containing all fields + the file (if changed).
 */
export async function submitUpdatedProductForm(formData, productId) {
  try {
    const response = await fetch(`/update-product-form/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      // Don't set headers—let the browser add multipart/form-data with boundary
      body: formData
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    return result; // e.g. { success: true, message: "Producto actualizado" }
  } catch (error) {
    console.error("Error submitting updated product:", error);
    throw error;
  }
}

/**
 * Disables (soft‑deletes) a product.
 */
export async function disableProduct(productId) {
  try {
    const response = await fetch("/disable-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ productId })
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || "Error disabling product");
    }

    return await response.json();
  } catch (error) {
    console.error("Error disabling product:", error);
    throw error;
  }
}



// Fallback to just a timestamp if /count fails or returns bad data
/**
 * Fetches the current product count from /count and
 * returns a unique string code in the form "<count><timestamp>".
 * Falls back to just the timestamp string on any error.
 */
export async function getProductCode() {
  try {
    const res = await fetch("/count");
    if (!res.ok) {
      throw new Error(`Unexpected response status: ${res.status}`);
    }

    const { success, total } = await res.json();
    if (success && (typeof total === "number" || typeof total === "bigint" || typeof total === "string")) {
      // Ensure total is a string
      const countStr = total.toString();
      // Millisecond‐precision timestamp
      const ts = Date.now().toString();
      // e.g. "1161716912345678"
      return countStr + ts;
    } else {
      console.warn("Invalid /count payload, falling back to timestamp");
    }
  } catch (err) {
    console.error("Error fetching product count:", err);
  }

  // Ultimate fallback: just use the timestamp string
  return Date.now().toString();
}