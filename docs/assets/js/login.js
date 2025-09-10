document.addEventListener('DOMContentLoaded', () => {
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageContainer = document.getElementById('message-container');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Function to toggle between login and register forms
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'none';
        registerFormContainer.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.style.display = 'block';
        registerFormContainer.style.display = 'none';
    });

    // Function to display messages
    const showMessage = (message, type) => {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`; // 'success' or 'error'
    };

    // Handle Register Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!username || !email || !password) {
            showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message, 'success');
                setTimeout(() => {
                    // Switch to login form after successful registration
                    loginFormContainer.style.display = 'block';
                    registerFormContainer.style.display = 'none';
                    messageContainer.textContent = '';
                }, 2000);
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('Error al conectar con el servidor.', 'error');
        }
    });

    // Handle Login Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showMessage('Por favor, introduce email y contraseña.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save the token and redirect
                localStorage.setItem('authToken', data.token);
                window.location.href = '/admin.html'; // Redirect to the admin dashboard
            } else {
                showMessage(data.error, 'error');
            }
        } catch (error) {
            showMessage('Error al conectar con el servidor.', 'error');
        }
    });

    // Handle Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            // The logic is in auth.js, which is already loaded.
            // The button click will be handled by the event listener in auth.js
        });
    }
});