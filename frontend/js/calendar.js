const CALENDAR_API = "http://127.0.0.1:8000";

const CALENDAR_TOKEN =
    localStorage.getItem("access_token");

let currentDate = new Date();

let leaveData = [];
let holidayData = [];



// LOAD LEAVES


async function loadCalendarLeaves() {

    try {

        const response = await fetch(
            `${CALENDAR_API}/leave/calendar`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${CALENDAR_TOKEN}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(data);

            return;
        }

        leaveData = data;

        renderCalendar();

    }

    catch (error) {

        console.error(
            "Calendar leave error:",
            error
        );

    }
}



// LOAD HOLIDAYS


async function loadCalendarHolidays() {

    try {

        const response = await fetch(
            `${CALENDAR_API}/holidays/`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${CALENDAR_TOKEN}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "Holiday API error:",
                data
            );

            holidayData = [];

            return;
        }

        holidayData = data;

        renderCalendar();

    }

    catch (error) {

        console.error(
            "Holiday error:",
            error
        );

    }
}



// RENDER CALENDAR


function renderCalendar() {

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


    
    // EMPTY CELLS
   

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


   
    // CALENDAR DAYS
   

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
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


       
        // FIND LEAVE
       

        const leave =
            leaveData.find(
                item =>
                    dateString >= item.start &&
                    dateString <= item.end
            );


       
        // FIND HOLIDAY
       

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


        
        // DISPLAY LEAVE
        

        if (leave) {

            dayElement.classList.add(
                leave.status
            );

            dayElement.innerHTML += `
                <small class="calendar-leave ${leave.status}">
                    ${escapeHtml(
                        leave.title || ""
                    )}
                </small>
            `;

        }


       
        // DISPLAY HOLIDAY
        

        if (holiday) {

            dayElement.classList.add(
                "holiday"
            );

            dayElement.innerHTML += `
                <small class="calendar-holiday">
                    🎉 ${escapeHtml(
                        holiday.name
                    )}
                </small>
            `;

            dayElement.title =
                holiday.name;
        }


        calendarDays.appendChild(
            dayElement
        );

    }

}



// PREVIOUS MONTH


document
    .getElementById("previousMonth")
    .addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );

            renderCalendar();

        }
    );



// NEXT MONTH


document
    .getElementById("nextMonth")
    .addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );

            renderCalendar();

        }
    );



// ESCAPE HTML


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


loadCalendarLeaves();

loadCalendarHolidays();