const API_URL = "https://leaveflow-backend-sauc.onrender.com";

const token = localStorage.getItem("access_token");
const user = JSON.parse(localStorage.getItem("user"));




if (!token || !user) {
    window.location.href = "../login.html";
}




const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage) {

    welcomeMessage.textContent =
        `Welcome back, ${user.name}!`;

}




async function loadDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/leave/dashboard`,
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


        // Total leaves
        document.getElementById(
            "totalLeaves"
        ).textContent =
            data.total_leaves;


        // Used leaves
        document.getElementById(
            "usedLeaves"
        ).textContent =
            data.used_leaves;


        // Remaining leaves
        document.getElementById(
            "remainingLeaves"
        ).textContent =
            data.remaining_leaves;


        // Pending requests
        document.getElementById(
            "pendingRequests"
        ).textContent =
            data.pending_requests;


        // Approved requests
        document.getElementById(
            "approvedRequests"
        ).textContent =
            data.approved_requests;


        // Pending requests bottom
        document.getElementById(
            "pendingRequestsBottom"
        ).textContent =
            data.pending_requests;


        // Rejected requests
        document.getElementById(
            "rejectedRequests"
        ).textContent =
            data.rejected_requests;

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}




async function loadLeaveBalances() {

    try {

        const response = await fetch(
            `${API_URL}/leave/balances`,
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


        data.forEach(balance => {

            const type =
                balance.leave_type.toLowerCase();


            

            if (type === "casual") {

                const remaining =
                    document.getElementById(
                        "casualRemaining"
                    );

                const details =
                    document.getElementById(
                        "casualDetails"
                    );


                if (remaining) {

                    remaining.textContent =
                        balance.remaining_days;

                }


                if (details) {

                    details.textContent =
                        `${balance.used_days} / ${balance.total_days} used`;

                }

            }


            

            if (type === "sick") {

                const remaining =
                    document.getElementById(
                        "sickRemaining"
                    );

                const details =
                    document.getElementById(
                        "sickDetails"
                    );


                if (remaining) {

                    remaining.textContent =
                        balance.remaining_days;

                }


                if (details) {

                    details.textContent =
                        `${balance.used_days} / ${balance.total_days} used`;

                }

            }


            // ==================================
            // EARNED LEAVE
            // ==================================

            if (type === "earned") {

                const remaining =
                    document.getElementById(
                        "earnedRemaining"
                    );

                const details =
                    document.getElementById(
                        "earnedDetails"
                    );


                if (remaining) {

                    remaining.textContent =
                        balance.remaining_days;

                }


                if (details) {

                    details.textContent =
                        `${balance.used_days} / ${balance.total_days} used`;

                }

            }

        });

    }

    catch (error) {

        console.error(
            "Leave balance error:",
            error
        );

    }

}




function logout() {

    localStorage.removeItem("access_token");

    localStorage.removeItem("user");

    window.location.href =
        "../login.html";
}




if (
    document.getElementById("totalLeaves")
) {

    loadDashboard();

    loadLeaveBalances();

}




const leaveForm =
    document.getElementById("leaveForm");

const leaveMessage =
    document.getElementById("leaveMessage");


if (leaveForm) {

    leaveForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // Get form values

            const leaveType =
                document.getElementById(
                    "leaveType"
                ).value;

            const startDate =
                document.getElementById(
                    "startDate"
                ).value;

            const endDate =
                document.getElementById(
                    "endDate"
                ).value;

            const reason =
                document.getElementById(
                    "reason"
                ).value;


            // Clear previous message

            leaveMessage.textContent = "";

            leaveMessage.style.color =
                "#dc2626";


            

            if (endDate < startDate) {

                leaveMessage.textContent =
                    "End date cannot be before start date.";

                return;
            }


            

            try {

                const response = await fetch(
                    `${API_URL}/leave/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({

                            leave_type:
                                leaveType,

                            start_date:
                                startDate,

                            end_date:
                                endDate,

                            reason:
                                reason

                        })
                    }
                );


                const data =
                    await response.json();


                

                if (!response.ok) {

                    leaveMessage.textContent =
                        data.detail ||
                        "Unable to submit leave request.";

                    return;
                }


             
                leaveMessage.style.color =
                    "#15803d";

                leaveMessage.textContent =
                    "Leave request submitted successfully!";


                leaveForm.reset();

            }


            catch (error) {

                console.error(
                    "Apply leave error:",
                    error
                );


                leaveMessage.style.color =
                    "#dc2626";

                leaveMessage.textContent =
                    "Unable to connect to the server.";

            }

        }
    );

}