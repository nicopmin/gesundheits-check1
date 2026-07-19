document
    .querySelector("#adminLoginForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.querySelector("#adminEmail").value;

        const passwort =
            document.querySelector("#adminPasswort").value;

        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password: passwort
            });

        if (error) {
            document.querySelector("#loginFehler").textContent =
                "E-Mail oder Passwort ist falsch.";

            return;
        }

        window.location.href = "admin.html";
    });