const API_URL = "https://leaveflow-backend-sauc.onrender.com";

const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user"));



if (!token || !user) {
    window.location.href = "../login.html";
}



if (user && user.role !== "manager") {

    alert("Access denied.");

    window.location.href = "../login.html";
}




function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "../login.html";
}




const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage) {

    welcomeMessage.textContent =
        `Welcome back, ${user.name}!`;
}




async function loadManagerDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/manager/dashboard`,
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

            console.error(data);

            return;
        }


        document.getElementById("totalRequests").textContent =
            data.total_requests;

        document.getElementById("pendingRequests").textContent =
            data.pending_requests;

        document.getElementById("approvedRequests").textContent =
            data.approved_requests;

        document.getElementById("rejectedRequests").textContent =
            data.rejected_requests;

        document.getElementById("cancelledRequests").textContent =
            data.cancelled_requests;


        document.getElementById("pendingSummary").textContent =
            data.pending_requests;

        document.getElementById("approvedSummary").textContent =
            data.approved_requests;

        document.getElementById("rejectedSummary").textContent =
            data.rejected_requests;

    }

    catch (error) {

        console.error(
            "Manager dashboard error:",
            error
        );

    }
}




async function loadPendingRequests() {

    const tableBody =
        document.getElementById("requestTableBody");

    

    if (!tableBody) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/manager/pending`,
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
            "Pending requests:",
            data
        );


        if (!response.ok) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        ${data.detail || "Unable to load requests."}
                    </td>
                </tr>
            `;

            return;
        }


        // No pending requests

        if (!Array.isArray(data) || data.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No pending leave requests.
                    </td>
                </tr>
            `;

            return;
        }


        // Clear loading message

        tableBody.innerHTML = "";


        // Add each request

        data.forEach(function (request) {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${request.employee_name}
                </td>

                <td>
                    ${request.leave_type}
                </td>

                <td>
                    ${request.start_date}
                </td>

                <td>
                    ${request.end_date}
                </td>

                <td>
                    ${request.days}
                </td>

                <td>
                    ${request.reason}
                </td>

                <td>

                    <button
                        class="approve-button"
                        onclick="approveLeave(${request.id})">
                        Approve
                    </button>

                    <button
                        class="reject-button"
                        onclick="rejectLeave(${request.id})">
                        Reject
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Pending requests error:",
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




async function approveLeave(leaveId) {

    const confirmed =
        confirm(
            "Are you sure you want to approve this leave?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/manager/approve/${leaveId}`,
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
                "Unable to approve leave."
            );

            return;
        }


        alert(
            "Leave request approved successfully!"
        );


        loadPendingRequests();

    }

    catch (error) {

        console.error(
            "Approve error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}




async function rejectLeave(leaveId) {

    const confirmed =
        confirm(
            "Are you sure you want to reject this leave?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/manager/reject/${leaveId}`,
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
                "Unable to reject leave."
            );

            return;
        }


        alert(
            "Leave request rejected successfully!"
        );


        loadPendingRequests();

    }

    catch (error) {

        console.error(
            "Reject error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}



// Manager dashboard
if (document.getElementById("totalRequests")) {

    loadManagerDashboard();

}


// Manager leave requests
if (document.getElementById("requestTableBody")) {

    loadPendingRequests();

}