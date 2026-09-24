const PROFILE_API =
    "http://127.0.0.1:8000";

const PROFILE_TOKEN =
    localStorage.getItem("access_token");


async function loadProfile() {

    try {

        const response = await fetch(
            `${PROFILE_API}/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${PROFILE_TOKEN}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(data);

            return;
        }


        // Profile header

        document.getElementById(
            "profileName"
        ).textContent = data.name;


        document.getElementById(
            "profileEmail"
        ).textContent = data.email;


        document.getElementById(
            "profileRole"
        ).textContent = data.role;


        // Account details

        document.getElementById(
            "detailName"
        ).textContent = data.name;


        document.getElementById(
            "detailEmail"
        ).textContent = data.email;


        document.getElementById(
            "detailRole"
        ).textContent = data.role;


        // Avatar

        document.getElementById(
            "profileAvatar"
        ).textContent =
            data.name.charAt(0).toUpperCase();

    }

    catch (error) {

        console.error(
            "Profile error:",
            error
        );

    }
}


loadProfile();