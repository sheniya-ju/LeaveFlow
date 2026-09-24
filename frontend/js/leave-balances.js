const BALANCE_API =
    "http://127.0.0.1:8000";

const BALANCE_TOKEN =
    localStorage.getItem("access_token");

const employeeSelect =
    document.getElementById("employeeSelect");

const leaveType =
    document.getElementById("leaveType");

const totalDays =
    document.getElementById("totalDays");

const updateButton =
    document.getElementById("updateBalanceButton");

const balanceMessage =
    document.getElementById("balanceMessage");




async function loadEmployees() {

    try {

        const response = await fetch(
            `${BALANCE_API}/admin/employees`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${BALANCE_TOKEN}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(data);

            return;
        }


        data.forEach(employee => {

            const option =
                document.createElement("option");

            option.value = employee.id;

            option.textContent =
                `${employee.name} - ${employee.email}`;

            employeeSelect.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Employee loading error:",
            error
        );

    }
}




updateButton.addEventListener(
    "click",
    async function () {

        const employeeId =
            employeeSelect.value;

        const selectedLeaveType =
            leaveType.value;

        const days =
            totalDays.value;


        balanceMessage.textContent = "";

        balanceMessage.style.color =
            "#dc2626";


        if (!employeeId) {

            balanceMessage.textContent =
                "Please select an employee.";

            return;
        }


        if (days === "" || Number(days) < 0) {

            balanceMessage.textContent =
                "Please enter a valid number of days.";

            return;
        }


        try {

            const response = await fetch(
                `${BALANCE_API}/admin/employees/${employeeId}/leave-balance?leave_type=${encodeURIComponent(selectedLeaveType)}&total_days=${Number(days)}`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${BALANCE_TOKEN}`
                    }
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                balanceMessage.textContent =
                    data.detail ||
                    "Unable to update leave balance.";

                return;
            }


            balanceMessage.style.color =
                "#15803d";

            balanceMessage.textContent =
                "Leave balance updated successfully!";

        }

        catch (error) {

            console.error(
                "Balance update error:",
                error
            );

            balanceMessage.textContent =
                "Unable to connect to the server.";
        }

    }
);



loadEmployees();