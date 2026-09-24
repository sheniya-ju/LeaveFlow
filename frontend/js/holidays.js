const HOLIDAY_API = "https://leaveflow-backend-sauc.onrender.com";

const holidayToken =
    localStorage.getItem("access_token");

const holidayName =
    document.getElementById("holidayName");

const holidayDate =
    document.getElementById("holidayDate");

const addHolidayButton =
    document.getElementById("addHolidayButton");

const holidayMessage =
    document.getElementById("holidayMessage");

const holidayTableBody =
    document.getElementById("holidayTableBody");




async function loadHolidays() {

    try {

        const response = await fetch(
            `${HOLIDAY_API}/admin/holidays/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${holidayToken}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            holidayTableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        ${data.detail || "Unable to load holidays."}
                    </td>
                </tr>
            `;

            return;
        }


        if (data.length === 0) {

            holidayTableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No holidays added yet.
                    </td>
                </tr>
            `;

            return;
        }


        holidayTableBody.innerHTML = "";


        data.forEach(holiday => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${holiday.name}
                </td>

                <td>
                    ${holiday.date}
                </td>

                <td>

                    <button
                        class="reject-button"
                        onclick="deleteHoliday(${holiday.id})"
                    >
                        Delete
                    </button>

                </td>

            `;


            holidayTableBody.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Holiday loading error:",
            error
        );

        holidayTableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Unable to connect to the server.
                </td>
            </tr>
        `;
    }
}




addHolidayButton.addEventListener(
    "click",
    async function () {

        const name =
            holidayName.value.trim();

        const date =
            holidayDate.value;


        holidayMessage.textContent = "";

        holidayMessage.style.color =
            "#dc2626";


        if (!name) {

            holidayMessage.textContent =
                "Please enter a holiday name.";

            return;
        }


        if (!date) {

            holidayMessage.textContent =
                "Please select a date.";

            return;
        }


        try {

            const response = await fetch(
                `${HOLIDAY_API}/admin/holidays/?name=${encodeURIComponent(name)}&holiday_date=${date}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${holidayToken}`
                    }
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                holidayMessage.textContent =
                    data.detail ||
                    "Unable to add holiday.";

                return;
            }


            holidayMessage.style.color =
                "#15803d";

            holidayMessage.textContent =
                "Holiday added successfully!";


            holidayName.value = "";

            holidayDate.value = "";


            loadHolidays();

        }

        catch (error) {

            console.error(
                "Add holiday error:",
                error
            );

            holidayMessage.textContent =
                "Unable to connect to the server.";
        }

    }
);




async function deleteHoliday(holidayId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this holiday?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${HOLIDAY_API}/admin/holidays/${holidayId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${holidayToken}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to delete holiday."
            );

            return;
        }


        alert(
            "Holiday deleted successfully!"
        );


        loadHolidays();

    }

    catch (error) {

        console.error(
            "Delete holiday error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}




loadHolidays();