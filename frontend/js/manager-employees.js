console.log("NEW manager-employees.js loaded");

let selectedEmployeeId = null;




async function loadEmployees() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "../login.html";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/manager/employees`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const employees = await response.json();

        if (!response.ok) {
            throw new Error(
                employees.detail || "Failed to load employees"
            );
        }

        const tableBody =
            document.getElementById("employeeTableBody");

        tableBody.innerHTML = "";

        if (employees.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No employees found.
                    </td>
                </tr>
            `;

            return;
        }

        employees.forEach(employee => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${employee.name}</td>

                <td>${employee.email}</td>

                <td>
                    ${employee.is_active ? "Active" : "Inactive"}
                </td>

                <td>
                    <button
                        class="view-btn employee-view-button"
                        data-id="${employee.id}"
                        data-name="${employee.name}"
                        data-email="${employee.email}"
                    >
                        View
                    </button>
                </td>
            `;

            tableBody.appendChild(row);

        });


        // Add click events safely
        document
            .querySelectorAll(".employee-view-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        viewEmployee(
                            Number(this.dataset.id),
                            this.dataset.name,
                            this.dataset.email
                        );

                    }
                );

            });


    } catch (error) {

        console.error(
            "Load employees error:",
            error
        );

        document.getElementById(
            "employeeTableBody"
        ).innerHTML = `
            <tr>
                <td colspan="4">
                    Failed to load employees.
                </td>
            </tr>
        `;
    }
}




function viewEmployee(id, name, email) {

    console.log(
        "Selected employee:",
        id,
        name,
        email
    );

    selectedEmployeeId = id;


    document.getElementById(
        "selectedEmployeeName"
    ).textContent = name;


    document.getElementById(
        "selectedEmployeeEmail"
    ).textContent = email;


    document.getElementById(
        "employeeOverview"
    ).style.display = "block";


    initializeYearDropdown();


    const currentDate = new Date();


    document.getElementById(
        "monthSelect"
    ).value =
        currentDate.getMonth() + 1;


    document.getElementById(
        "yearSelect"
    ).value =
        currentDate.getFullYear();


    document.getElementById(
        "viewType"
    ).value = "month";


    handleViewChange();


    loadSelectedOverview();
}




function initializeYearDropdown() {

    const yearSelect =
        document.getElementById("yearSelect");

    if (!yearSelect) {

        console.error(
            "yearSelect element not found"
        );

        return;
    }


    yearSelect.innerHTML = "";


    const currentYear =
        new Date().getFullYear();


    for (
        let year = currentYear - 5;
        year <= currentYear + 5;
        year++
    ) {

        const option =
            document.createElement("option");

        option.value = year;

        option.textContent = year;

        yearSelect.appendChild(option);
    }


    console.log(
        "Year dropdown initialized"
    );
}




function handleViewChange() {

    const viewType =
        document.getElementById(
            "viewType"
        ).value;


    const monthSelect =
        document.getElementById(
            "monthSelect"
        );


    if (viewType === "year") {

        monthSelect.style.display = "none";

    } else {

        monthSelect.style.display = "inline-block";
    }
}




async function loadSelectedOverview() {

    if (!selectedEmployeeId) {

        alert(
            "Please select an employee first."
        );

        return;
    }


    const token =
        localStorage.getItem("access_token");


    const viewType =
        document.getElementById(
            "viewType"
        ).value;


    const month =
        document.getElementById(
            "monthSelect"
        ).value;


    const year =
        document.getElementById(
            "yearSelect"
        ).value;


    let url =
        `${API_URL}/manager/employee/` +
        `${selectedEmployeeId}/leave-overview`;


    if (viewType === "month") {

        url +=
            `?view=month` +
            `&month=${month}` +
            `&year=${year}`;

    } else {

        url +=
            `?view=year` +
            `&year=${year}`;
    }


    console.log(
        "Loading employee overview:",
        url
    );


    try {

        const response =
            await fetch(
                url,
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


        console.log(
            "Employee overview response:",
            data
        );


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to load employee overview."
            );

            return;
        }


        

        document.getElementById(
            "totalDays"
        ).textContent =
            data.summary.total_leave_days;


        document.getElementById(
            "approvedDays"
        ).textContent =
            data.summary.approved_days;


        document.getElementById(
            "pendingDays"
        ).textContent =
            data.summary.pending_days;


        document.getElementById(
            "rejectedDays"
        ).textContent =
            data.summary.rejected_days;


        

        const tableBody =
            document.getElementById(
                "employeeLeaveTableBody"
            );


        if (!tableBody) {

            console.error(
                "employeeLeaveTableBody not found"
            );

            return;
        }


        tableBody.innerHTML = "";


        const leaveRequests =
            data.leave_requests || [];


        console.log(
            "Leave requests:",
            leaveRequests
        );


        if (leaveRequests.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No leave records found
                        for the selected period.
                    </td>
                </tr>
            `;

            return;
        }


        leaveRequests.forEach(leave => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${leave.leave_type}
                </td>

                <td>
                    ${leave.start_date}
                </td>

                <td>
                    ${leave.end_date}
                </td>

                <td>
                    ${leave.days}
                </td>

                <td>
                    ${leave.days_in_period}
                </td>

                <td>
                    ${leave.reason}
                </td>

                <td>
                    <span class="status-badge ${leave.status}">
                        ${leave.status}
                    </span>
                </td>

            `;


            tableBody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Employee overview error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}



document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Employee page loaded"
        );

        initializeYearDropdown();

        handleViewChange();

        loadEmployees();

    }
);