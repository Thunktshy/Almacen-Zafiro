import { tryLogin } from "../Database/authentication.js";
import { showError } from "../errorHandler.js"; //Para mostrar mensajes de error

document.getElementById("form-login").addEventListener("submit", async (event) => {
    event.preventDefault(); // Evita el envío predeterminado del formulario

    const user = document.getElementById("Usuario").value;
    const password = document.getElementById("Contraseña").value;
    const errorMessageElement = document.getElementById("error-message");

    try {
        const result = await tryLogin(user, password);
    
        // Verifica si recibimos un resultado válido
        if (result && result.success) {
            console.log("Login :", result);
            document.getElementById("form-login").reset(); // Restablece el formulario
    
            // Cierra el modal y redirige al usuario al almacén
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginmodal'));
            modal.hide();
            setTimeout(function() {
                window.location.href = 'admin';
            }, 500); // Ajusta el retraso
        } else if (result) {
            showError(result.message || "Inicio de sesión fallido. Verifique su usuario y contraseña.");
        } else {
            // Si result es indefinido, posiblemente por falta de conexión
            showError("No hay conexión con la base de datos");
        }
    } catch (error) {
        // Si el mensaje de error indica un error 404, muestra el mensaje de error de conexión a la base de datos
        if (error.message && error.message.includes("404")) {
            showError("No hay conexión con la base de datos");
        } else {
            showError("Error while trying to log in: " + error.message);
        }
    }
});


