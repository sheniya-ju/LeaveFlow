const ADMIN_HOLIDAY_API = "https://leaveflow-backend-sauc.onrender.com";


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadHolidays();

});


// ==========================================
// GET TOKEN
// ==========================================

function getAdminHolidayToken() {

    return localStorage.getItem("access_token");

}


// ==========================================
// LOAD HOLIDAYS
// ==========================================

async function loadHolidays() {

    const tableBody =
        document.getElementById(
            "holidayTableBody"
        );


    tableBody.innerHTML = `
        <tr>
            <td colspan="3">
                Loading holidays...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                `${ADMIN_HOLIDAY_API}/admin/holidays`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminHolidayToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load holidays"
            );
        }


        tableBody.innerHTML = "";


        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No holidays added yet.
                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(holiday => {

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        holiday.name
                    )}
                </td>

                <td>
                    ${formatDate(
                        holiday.date
                    )}
                </td>

                <td>

                    <button
                        class="view-btn"
                        data-holiday-id="${holiday.id}"
                    >
                        Delete
                    </button>

                </td>
            `;


            const deleteButton =
                row.querySelector(
                    ".view-btn"
                );


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteHoliday(
                        holiday.id,
                        holiday.name
                    );

                }
            );


            tableBody.appendChild(row);

        });

    }
    catch (error) {

        console.error(
            "Holiday loading error:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Failed to load holidays.
                </td>
            </tr>
        `;
    }
}


// ==========================================
// ADD HOLIDAY
// ==========================================

async function addHoliday() {

    const nameInput =
        document.getElementById(
            "holidayName"
        );


    const dateInput =
        document.getElementById(
            "holidayDate"
        );


    const name =
        nameInput.value.trim();


    const date =
        dateInput.value;


    // Validate holiday name

    if (!name) {

        alert(
            "Please enter the holiday name."
        );

        nameInput.focus();

        return;
    }


    // Validate date

    if (!date) {

        alert(
            "Please select a holiday date."
        );

        dateInput.focus();

        return;
    }


    try {

        const response =
            await fetch(
                `${ADMIN_HOLIDAY_API}/admin/holidays`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${getAdminHolidayToken()}`
                    },

                    body: JSON.stringify({
                        name: name,
                        date: date
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to add holiday"
            );
        }


        alert(
            "Holiday added successfully."
        );


        // Clear form

        nameInput.value = "";

        dateInput.value = "";


        // Reload holiday list

        await loadHolidays();

    }
    catch (error) {

        console.error(
            "Add holiday error:",
            error
        );


        alert(
            error.message ||
            "Failed to add holiday."
        );
    }
}


// ==========================================
// DELETE HOLIDAY
// ==========================================

async function deleteHoliday(
    holidayId,
    holidayName
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete "${holidayName}"?`
        );


    if (!confirmed) {

        return;
    }


    try {

        const response =
            await fetch(
                `${ADMIN_HOLIDAY_API}/admin/holidays/${holidayId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${getAdminHolidayToken()}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to delete holiday"
            );
        }


        alert(
            "Holiday deleted successfully."
        );


        await loadHolidays();

    }
    catch (error) {

        console.error(
            "Delete holiday error:",
            error
        );


        alert(
            error.message ||
            "Failed to delete holiday."
        );
    }
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