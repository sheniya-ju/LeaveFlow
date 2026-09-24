const ADMIN_EMPLOYEE_API = "https://leaveflow-backend-sauc.onrender.com";

let selectedUserId = null;


// ==========================================
// GET ADMIN TOKEN
// ==========================================

function getAdminToken() {
    return localStorage.getItem("access_token");
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    initializeYearDropdown();

    loadAdminUsers();

});


// ==========================================
// INITIALIZE YEAR DROPDOWN
// ==========================================

function initializeYearDropdown() {

    const yearSelect =
        document.getElementById("yearSelect");

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


// ==========================================
// LOAD EMPLOYEES + MANAGERS
// ==========================================

async function loadAdminUsers() {

    const tableBody =
        document.getElementById("userTableBody");

    if (!tableBody) {
        return;
    }

    try {

        const response = await fetch(
            `${ADMIN_EMPLOYEE_API}/admin/employees`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${getAdminToken()}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load users"
            );
        }

        tableBody.innerHTML = "";

        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No employees or managers found.
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(user => {

            const row =
                document.createElement("tr");


            // ==========================================
            // USER ROW
            // ==========================================

            row.innerHTML = `

                <td>
                    ${escapeHtml(user.name)}
                </td>

                <td>
                    ${escapeHtml(user.email)}
                </td>

                <td>
                    <span class="status-badge">
                        ${capitalize(user.role)}
                    </span>
                </td>

                <td>

                    <span class="status-badge ${
                        user.is_active
                            ? "approved"
                            : "cancelled"
                    }">

                        ${
                            user.is_active
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </td>

                <td>

                    <button
                        class="view-btn"
                        data-user-id="${user.id}"
                    >
                        View
                    </button>

                    <button
                        class="status-toggle-btn ${
                            user.is_active
                                ? "deactivate-btn"
                                : "activate-btn"
                        }"
                        data-user-id="${user.id}"
                    >
                        ${
                            user.is_active
                                ? "Deactivate"
                                : "Activate"
                        }
                    </button>

                </td>
            `;


            // ==========================================
            // VIEW BUTTON
            // ==========================================

            const viewButton =
                row.querySelector(".view-btn");

            viewButton.addEventListener(
                "click",
                () => {

                    viewAdminUser(user);

                }
            );


            // ==========================================
            // ACTIVATE / DEACTIVATE BUTTON
            // ==========================================

            const statusButton =
                row.querySelector(
                    ".status-toggle-btn"
                );

            statusButton.addEventListener(
                "click",
                () => {

                    toggleUserStatus(user);

                }
            );


            tableBody.appendChild(row);

        });

    }
    catch (error) {

        console.error(
            "Admin users error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Failed to load users.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// ACTIVATE / DEACTIVATE USER
// ==========================================

async function toggleUserStatus(user) {

    const action =
        user.is_active
            ? "deactivate"
            : "activate";


    const confirmation =
        confirm(
            `Are you sure you want to ${action} ${user.name}?`
        );


    if (!confirmation) {
        return;
    }


    try {

        // New status
        const newStatus =
            !user.is_active;


        // ==========================================
        // IMPORTANT:
        // is_active is sent as QUERY PARAMETER
        // because FastAPI expects:
        //
        // /status?is_active=true
        // /status?is_active=false
        // ==========================================

        const response =
            await fetch(
                `${ADMIN_EMPLOYEE_API}` +
                `/admin/employee/${user.id}/status` +
                `?is_active=${newStatus}`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminToken()}`
                    }
                }
            );


        const data =
            await response.json();


        // ==========================================
        // HANDLE ERROR
        // ==========================================

        if (!response.ok) {

            console.error(
                "Status update error:",
                data
            );

            let errorMessage =
                `Failed to ${action} user`;

            if (data.detail) {

                if (
                    typeof data.detail ===
                    "string"
                ) {

                    errorMessage =
                        data.detail;

                }
                else {

                    errorMessage =
                        JSON.stringify(
                            data.detail
                        );
                }
            }

            throw new Error(
                errorMessage
            );
        }


        // ==========================================
        // SUCCESS MESSAGE
        // ==========================================

        alert(
            data.message ||
            `${user.name} has been ${action}d successfully.`
        );


        // Update local user object
        user.is_active =
            newStatus;


        // ==========================================
        // UPDATE SELECTED USER STATUS
        // ==========================================

        if (
            selectedUserId === user.id
        ) {

            const selectedStatus =
                document.getElementById(
                    "selectedUserStatus"
                );

            if (selectedStatus) {

                selectedStatus.textContent =
                    newStatus
                        ? "Active"
                        : "Inactive";
            }
        }


        // ==========================================
        // RELOAD TABLE
        // ==========================================

        await loadAdminUsers();

    }
    catch (error) {

        console.error(
            "User status update error:",
            error
        );

        alert(
            error.message ||
            "Failed to update user status."
        );
    }
}


// ==========================================
// VIEW SELECTED USER
// ==========================================

function viewAdminUser(user) {

    selectedUserId =
        user.id;


    const detailsSection =
        document.getElementById(
            "userDetails"
        );


    if (!detailsSection) {
        return;
    }


    detailsSection.style.display =
        "block";


    // ==========================================
    // USER NAME
    // ==========================================

    document.getElementById(
        "selectedUserName"
    ).textContent =
        user.name;


    // ==========================================
    // USER EMAIL
    // ==========================================

    document.getElementById(
        "selectedUserEmail"
    ).textContent =
        user.email;


    // ==========================================
    // USER ROLE
    // ==========================================

    document.getElementById(
        "selectedUserRole"
    ).textContent =
        capitalize(
            user.role
        );


    // ==========================================
    // USER STATUS
    // ==========================================

    document.getElementById(
        "selectedUserStatus"
    ).textContent =
        user.is_active
            ? "Active"
            : "Inactive";


    // ==========================================
    // RESET OVERVIEW
    // ==========================================

    document.getElementById(
        "totalDays"
    ).textContent =
        "0";

    document.getElementById(
        "approvedDays"
    ).textContent =
        "0";

    document.getElementById(
        "pendingDays"
    ).textContent =
        "0";

    document.getElementById(
        "rejectedDays"
    ).textContent =
        "0";

    document.getElementById(
        "cancelledDays"
    ).textContent =
        "0";


    // ==========================================
    // LOAD USER INFORMATION
    // ==========================================

    loadAdminOverview();

    loadLeaveHistory();

    loadBalances();


    // ==========================================
    // SCROLL TO DETAILS
    // ==========================================

    detailsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==========================================
// HANDLE VIEW CHANGE
// ==========================================

function handleAdminViewChange() {

    const viewType =
        document.getElementById(
            "viewType"
        ).value;


    const monthSelect =
        document.getElementById(
            "monthSelect"
        );


    if (
        viewType === "year"
    ) {

        monthSelect.disabled =
            true;

    }
    else {

        monthSelect.disabled =
            false;

    }


    if (selectedUserId) {

        loadAdminOverview();

    }
}


// ==========================================
// LOAD ADMIN LEAVE OVERVIEW
// ==========================================

async function loadAdminOverview() {

    if (!selectedUserId) {
        return;
    }


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
        `${ADMIN_EMPLOYEE_API}` +
        `/admin/employee/${selectedUserId}` +
        `/leave-overview` +
        `?view=${viewType}` +
        `&year=${year}`;


    if (
        viewType === "month"
    ) {

        url +=
            `&month=${month}`;

    }


    try {

        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load leave overview"
            );

        }


        const summary =
            data.summary || {};


        document.getElementById(
            "totalDays"
        ).textContent =
            summary.total_leave_days ??
            summary.total_days ??
            0;


        document.getElementById(
            "approvedDays"
        ).textContent =
            summary.approved_days ??
            0;


        document.getElementById(
            "pendingDays"
        ).textContent =
            summary.pending_days ??
            0;


        document.getElementById(
            "rejectedDays"
        ).textContent =
            summary.rejected_days ??
            0;


        document.getElementById(
            "cancelledDays"
        ).textContent =
            summary.cancelled_days ??
            0;

    }
    catch (error) {

        console.error(
            "Admin overview error:",
            error
        );


        document.getElementById(
            "totalDays"
        ).textContent =
            "0";


        document.getElementById(
            "approvedDays"
        ).textContent =
            "0";


        document.getElementById(
            "pendingDays"
        ).textContent =
            "0";


        document.getElementById(
            "rejectedDays"
        ).textContent =
            "0";


        document.getElementById(
            "cancelledDays"
        ).textContent =
            "0";
    }
}


// ==========================================
// LOAD COMPLETE LEAVE HISTORY
// ==========================================

async function loadLeaveHistory() {

    if (!selectedUserId) {
        return;
    }


    const tableBody =
        document.getElementById(
            "leaveHistoryBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Loading leave history...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${ADMIN_EMPLOYEE_API}` +
                `/admin/employee/${selectedUserId}` +
                `/leave-history`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load leave history"
            );

        }


        tableBody.innerHTML =
            "";


        if (
            data.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No leave records found.
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(
            leave => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${escapeHtml(
                            leave.leave_type
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            leave.start_date
                        )}
                    </td>

                    <td>
                        ${formatDate(
                            leave.end_date
                        )}
                    </td>

                    <td>
                        ${leave.days}
                    </td>

                    <td>
                        ${escapeHtml(
                            leave.reason
                        )}
                    </td>

                    <td>
                        <span
                            class="status-badge ${leave.status}"
                        >
                            ${capitalize(
                                leave.status
                            )}
                        </span>
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }
    catch (error) {

        console.error(
            "Leave history error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Failed to load leave history.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// LOAD LEAVE BALANCES
// ==========================================

async function loadBalances() {

    if (!selectedUserId) {
        return;
    }


    const tableBody =
        document.getElementById(
            "balanceBody"
        );


    if (!tableBody) {
        return;
    }


    const year =
        document.getElementById(
            "yearSelect"
        ).value;


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
                `${ADMIN_EMPLOYEE_API}` +
                `/admin/employee/${selectedUserId}` +
                `/balances?year=${year}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminToken()}`
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


        tableBody.innerHTML =
            "";


        if (
            data.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No leave balance records found for ${year}.
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(
            balance => {

                const row =
                    document.createElement(
                        "tr"
                    );


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
                        ${balance.year}
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }
    catch (error) {

        console.error(
            "Balance error:",
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


// ==========================================
// YEAR CHANGE
// ==========================================

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id ===
            "yearSelect"
        ) {

            if (selectedUserId) {

                loadAdminOverview();

                loadBalances();

            }
        }
    }
);


// ==========================================
// MONTH CHANGE
// ==========================================

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id ===
            "monthSelect"
        ) {

            if (selectedUserId) {

                loadAdminOverview();

            }
        }
    }
);


// ==========================================
// CAPITALIZE
// ==========================================

function capitalize(value) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ==========================================
// ESCAPE HTML
// ==========================================

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