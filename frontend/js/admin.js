const API_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user"));




if (!token || !user) {
    window.location.href = "../login.html";
}




if (user && user.role !== "admin") {

    alert("Access denied.");

    window.location.href = "../login.html";
}



const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage) {

    welcomeMessage.textContent =
        `Welcome back, ${user.name}!`;

}


function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "../login.html";
}



async function loadEmployees() {

    const tableBody =
        document.getElementById("employeeTableBody");

    if (!tableBody) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/admin/employees`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        ${data.detail || "Unable to load employees."}
                    </td>
                </tr>
            `;

            return;
        }


        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No employees found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        data.forEach(employee => {

            const row =
                document.createElement("tr");


            const status =
                employee.is_active
                    ? "Active"
                    : "Inactive";


            row.innerHTML = `

                <td>
                    ${employee.name}
                </td>

                <td>
                    ${employee.email}
                </td>

                <td>
                    <span class="status ${
                        employee.is_active
                            ? "approved"
                            : "rejected"
                    }">
                        ${status}
                    </span>
                </td>

                <td>

                    <button
                        class="approve-button"
                        onclick="
                            updateEmployeeStatus(
                                ${employee.id},
                                ${!employee.is_active}
                            )
                        "
                    >
                        ${
                            employee.is_active
                                ? "Deactivate"
                                : "Activate"
                        }
                    </button>

                </td>
            `;


            tableBody.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Employees error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}



async function updateEmployeeStatus(
    employeeId,
    isActive
) {

    const action =
        isActive
            ? "activate"
            : "deactivate";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} this employee?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/admin/employees/${employeeId}/status?is_active=${isActive}`,
            {
                method: "PUT",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to update employee."
            );

            return;
        }


        alert(
            "Employee status updated successfully!"
        );


        loadEmployees();

    }

    catch (error) {

        console.error(
            "Employee status error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}


loadEmployees();