const ADMIN_BALANCE_API = "http://127.0.0.1:8000";

let selectedEmployeeId = null;



document.addEventListener("DOMContentLoaded", () => {

    initializeBalanceYear();

    loadEmployees();

});



function getAdminBalanceToken() {

    return localStorage.getItem("access_token");

}



function initializeBalanceYear() {

    const yearSelect =
        document.getElementById("balanceYear");

    if (!yearSelect) {
        return;
    }

    const currentYear =
        new Date().getFullYear();

    yearSelect.innerHTML = "";

    for (
        let year = currentYear - 5;
        year <= currentYear + 1;
        year++
    ) {

        const option =
            document.createElement("option");

        option.value = year;

        option.textContent = year;

        if (year === currentYear) {
            option.selected = true;
        }

        yearSelect.appendChild(option);
    }
}



async function loadEmployees() {

    const tableBody =
        document.getElementById(
            "employeeTableBody"
        );

    try {

        const response =
            await fetch(
                `${ADMIN_BALANCE_API}/admin/employees`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminBalanceToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load employees"
            );
        }


        tableBody.innerHTML = "";



        const employees =
            data.filter(
                user =>
                    user.role === "employee"
            );


        if (employees.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No employees found.
                    </td>
                </tr>
            `;

            return;
        }


        employees.forEach(employee => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${escapeHtml(employee.name)}
                </td>

                <td>
                    ${escapeHtml(employee.email)}
                </td>

                <td>
                    ${capitalize(employee.role)}
                </td>

                <td>
                    <span class="status-badge ${
                        employee.is_active
                            ? "approved"
                            : "cancelled"
                    }">
                        ${
                            employee.is_active
                                ? "Active"
                                : "Inactive"
                        }
                    </span>
                </td>

                <td>
                    <button
                        class="view-btn"
                        data-employee-id="${employee.id}"
                    >
                        Manage
                    </button>
                </td>
            `;


            const button =
                row.querySelector(
                    ".view-btn"
                );


            button.addEventListener(
                "click",
                () => {
                    selectEmployee(employee);
                }
            );


            tableBody.appendChild(row);

        });

    }
    catch (error) {

        console.error(
            "Employee loading error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Failed to load employees.
                </td>
            </tr>
        `;
    }
}



function selectEmployee(employee) {

    selectedEmployeeId =
        employee.id;


    const balanceSection =
        document.getElementById(
            "balanceSection"
        );


    balanceSection.style.display =
        "block";


    document.getElementById(
        "selectedEmployeeName"
    ).textContent =
        employee.name;


    document.getElementById(
        "selectedEmployeeEmail"
    ).textContent =
        employee.email;


    document.getElementById(
        "totalDaysInput"
    ).value = "";


    loadEmployeeBalances();


    balanceSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}



async function loadEmployeeBalances() {

    if (!selectedEmployeeId) {

        return;
    }


    const year =
        document.getElementById(
            "balanceYear"
        ).value;


    const tableBody =
        document.getElementById(
            "balanceTableBody"
        );


    tableBody.innerHTML = `
        <tr>
            <td colspan="5">
                Loading balances...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${ADMIN_BALANCE_API}` +
                `/admin/employee/${selectedEmployeeId}` +
                `/balances?year=${year}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminBalanceToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load balances"
            );
        }


        tableBody.innerHTML = "";


        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No leave balance records found for ${year}.
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(balance => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        balance.leave_type
                    )}
                </td>

                <td>
                    ${balance.total_days}
                </td>

                <td>
                    ${balance.used_days}
                </td>

                <td>
                    ${balance.remaining_days}
                </td>

                <td>
                    <button
                        class="view-btn"
                        data-leave-type="${escapeHtml(
                            balance.leave_type
                        )}"
                        data-total-days="${balance.total_days}"
                    >
                        Edit
                    </button>
                </td>
            `;


            const editButton =
                row.querySelector(
                    ".view-btn"
                );


            editButton.addEventListener(
                "click",
                () => {

                    document.getElementById(
                        "leaveType"
                    ).value =
                        balance.leave_type;


                    document.getElementById(
                        "totalDaysInput"
                    ).value =
                        balance.total_days;

                }
            );


            tableBody.appendChild(row);

        });

    }
    catch (error) {

        console.error(
            "Balance loading error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Failed to load leave balances.
                </td>
            </tr>
        `;
    }
}



async function updateLeaveBalance() {

    if (!selectedEmployeeId) {

        alert(
            "Please select an employee first."
        );

        return;
    }


    const leaveType =
        document.getElementById(
            "leaveType"
        ).value;


    const totalDaysValue =
        document.getElementById(
            "totalDaysInput"
        ).value;


    if (totalDaysValue === "") {

        alert(
            "Please enter the total number of days."
        );

        return;
    }


    const totalDays =
        Number(totalDaysValue);


    if (
        !Number.isInteger(totalDays) ||
        totalDays < 0
    ) {

        alert(
            "Total days must be a valid non-negative integer."
        );

        return;
    }


    const year =
        document.getElementById(
            "balanceYear"
        ).value;


    try {

        const url =
            `${ADMIN_BALANCE_API}` +
            `/admin/employees/${selectedEmployeeId}` +
            `/leave-balance` +
            `?leave_type=${encodeURIComponent(
                leaveType
            )}` +
            `&total_days=${totalDays}`;


        const response =
            await fetch(
                url,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminBalanceToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to update leave balance"
            );
        }


        alert(
            "Leave balance updated successfully."
        );


        document.getElementById(
            "totalDaysInput"
        ).value = "";


        await loadEmployeeBalances();

    }
    catch (error) {

        console.error(
            "Update balance error:",
            error
        );


        alert(
            error.message ||
            "Failed to update leave balance."
        );
    }
}


document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id ===
            "balanceYear"
        ) {

            if (selectedEmployeeId) {

                loadEmployeeBalances();

            }

        }

    }
);


function capitalize(value) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}



function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}