const historyAPI =
    "https://leaveflow-backend-sauc.onrender.com";

const historyToken =
    localStorage.getItem("access_token");

const tableBody =
    document.getElementById("leaveTableBody");




async function loadLeaveHistory() {

    try {

        const response = await fetch(
            `${historyAPI}/leave/history`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${historyToken}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Unable to load leave history.
                    </td>
                </tr>
            `;

            return;
        }


        if (data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No leave requests found.
                    </td>
                </tr>
            `;

            return;
        }


        tableBody.innerHTML = "";


        data.forEach(leave => {

            const row =
                document.createElement("tr");


            let action = "";


            // Show Cancel only for pending leaves

            if (leave.status === "pending") {

                action = `
                    <button
                        class="cancel-leave-button"
                        onclick="cancelLeave(${leave.id})">
                        Cancel
                    </button>
                `;

            } else {

                action = "-";

            }


            row.innerHTML = `

                <td>${leave.leave_type}</td>

                <td>${leave.start_date}</td>

                <td>${leave.end_date}</td>

                <td>${leave.days}</td>

                <td>${leave.reason}</td>

                <td>
                    <span class="status ${leave.status}">
                        ${leave.status}
                    </span>
                </td>

                <td>
                    ${action}
                </td>

            `;


            tableBody.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Leave history error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to connect to the server.
                </td>
            </tr>
        `;

    }

}



async function cancelLeave(leaveId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this leave request?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${historyAPI}/leave/cancel/${leaveId}`,
            {
                method: "PUT",

                headers: {
                    "Authorization":
                        `Bearer ${historyToken}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to cancel leave."
            );

            return;
        }


        alert(
            "Leave cancelled successfully!"
        );


        // Reload history

        loadLeaveHistory();

    }

    catch (error) {

        console.error(
            "Cancel leave error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );

    }

}



loadLeaveHistory();