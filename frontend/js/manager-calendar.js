const MANAGER_CALENDAR_API =
    "http://127.0.0.1:8000";

const MANAGER_CALENDAR_TOKEN =
    localStorage.getItem("access_token");

let currentDate = new Date();

let leaveData = [];

let holidayData = [];



async function loadManagerCalendar() {

    try {

        const response = await fetch(
            `${MANAGER_CALENDAR_API}/manager/calendar`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${MANAGER_CALENDAR_TOKEN}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(data);

            return;
        }


        leaveData = data;


        await loadManagerHolidays();


        renderManagerCalendar();

    }

    catch (error) {

        console.error(
            "Manager calendar error:",
            error
        );

    }
}



async function loadManagerHolidays() {

    try {

        const response = await fetch(
            `${MANAGER_CALENDAR_API}/holidays/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${MANAGER_CALENDAR_TOKEN}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Holiday loading error:",
                data
            );

            holidayData = [];

            return;
        }


        holidayData = data;

        console.log(
            "Manager holidays:",
            holidayData
        );

    }

    catch (error) {

        console.error(
            "Holiday loading error:",
            error
        );

        holidayData = [];
    }
}




function renderManagerCalendar() {

    const calendarDays =
        document.getElementById(
            "calendarDays"
        );


    const currentMonth =
        document.getElementById(
            "currentMonth"
        );


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    const monthName =
        currentDate.toLocaleString(
            "default",
            {
                month: "long"
            }
        );


    currentMonth.textContent =
        `${monthName} ${year}`;


    calendarDays.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


   

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const emptyDay =
            document.createElement("div");


        emptyDay.className =
            "calendar-day empty";


        calendarDays.appendChild(
            emptyDay
        );

    }


    

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayElement =
            document.createElement("div");


        dayElement.className =
            "calendar-day";


        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


       

        const leaves =
            leaveData.filter(
                item =>
                    dateString >= item.start &&
                    dateString <= item.end
            );


        

        const holiday =
            holidayData.find(
                item =>
                    item.date === dateString
            );


       

        dayElement.innerHTML = `

            <span class="calendar-date">
                ${day}
            </span>

        `;


      

        if (holiday) {

            dayElement.classList.add(
                "holiday"
            );


            const holidayElement =
                document.createElement(
                    "small"
                );


            holidayElement.className =
                "calendar-holiday";


            holidayElement.textContent =
                `🎉 ${holiday.name}`;


            holidayElement.title =
                holiday.name;


            dayElement.appendChild(
                holidayElement
            );

        }


      

        leaves.forEach(
            leave => {

                const leaveElement =
                    document.createElement(
                        "small"
                    );


                leaveElement.className =
                    `calendar-leave ${leave.status}`;


                leaveElement.textContent =
                    `${leave.employee_name} - ${leave.leave_type}`;


                leaveElement.title =
                    leave.reason;


                dayElement.appendChild(
                    leaveElement
                );

            }
        );


      
        dayElement.addEventListener(
            "click",
            function () {

                showDateDetails(
                    dateString,
                    leaves
                );

            }
        );


        calendarDays.appendChild(
            dayElement
        );

    }

}




function showDateDetails(
    dateString,
    leaves
) {

    const selectedDateText =
        document.getElementById(
            "selectedDateText"
        );


    const selectedDateLeaves =
        document.getElementById(
            "selectedDateLeaves"
        );


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    const formattedDate =
        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    selectedDateText.textContent =
        `Leave requests for ${formattedDate}`;


    selectedDateLeaves.innerHTML = "";


   

    if (leaves.length === 0) {

        selectedDateLeaves.innerHTML = `

            <tr>

                <td colspan="7">

                    No employee leave
                    on this date.

                </td>

            </tr>

        `;

        return;
    }


 
    leaves.forEach(
        leave => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${leave.employee_name}
                </td>

                <td>
                    ${leave.leave_type}
                </td>

                <td>
                    ${leave.start}
                </td>

                <td>
                    ${leave.end}
                </td>

                <td>
                    ${leave.days}
                </td>

                <td>

                    <span
                        class="status-badge ${leave.status}"
                    >
                        ${leave.status}
                    </span>

                </td>

                <td>
                    ${leave.reason}
                </td>

            `;


            selectedDateLeaves.appendChild(
                row
            );

        }
    );

}



document
    .getElementById("previousMonth")
    .addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );


            renderManagerCalendar();

        }
    );




document
    .getElementById("nextMonth")
    .addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );


            renderManagerCalendar();

        }
    );




document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadManagerCalendar();

    }
);