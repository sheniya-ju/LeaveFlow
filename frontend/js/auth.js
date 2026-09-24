const API_URL = "http://127.0.0.1:8000";


// EMAIL VALIDATION 

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}


// LOGIN 

const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        errorMessage.textContent = "";

        // Email validation
        if (!isValidEmail(email)) {
            errorMessage.textContent =
                "Please enter a valid email address.";
            return;
        }

        // Password validation
        if (!password) {
            errorMessage.textContent =
                "Please enter your password.";
            return;
        }

        try {

            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {

                errorMessage.textContent =
                    data.detail || "Invalid email or password";

                return;
            }

            localStorage.setItem(
                "access_token",
                data.access_token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            // Role-based redirection

            if (data.user.role === "employee") {

                window.location.href =
                    "employee/dashboard.html";

            } else if (data.user.role === "manager") {

                window.location.href =
                    "manager/dashboard.html";

            } else if (data.user.role === "admin") {

                window.location.href =
                    "admin/dashboard.html";
            }

        } catch (error) {

            console.error("Login error:", error);

            errorMessage.textContent =
                "Unable to connect to the server.";
        }
    });
}



// REGISTER 

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;


        registerMessage.textContent = "";


        // Name validation

        if (!name) {

            registerMessage.textContent =
                "Please enter your name.";

            return;
        }


        // Email validation

        if (!isValidEmail(email)) {

            registerMessage.textContent =
                "Please enter a valid email address.";

            return;
        }


        // Password validation

        if (!password) {

            registerMessage.textContent =
                "Please enter a password.";

            return;
        }


        try {

            const response = await fetch(
                `${API_URL}/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                registerMessage.textContent =
                    data.detail || "Registration failed";

                return;
            }


            alert("Account created successfully!");

            window.location.href = "login.html";


        } catch (error) {

            console.error("Registration error:", error);

            registerMessage.textContent =
                "Unable to connect to the server.";
        }

    });

}