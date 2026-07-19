const SUPABASE_URL =
    "https://hdvjxevyrgfrbznashkl.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhkdmp4ZXZ5cmdmcmJ6bmFzaGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDI3MjcsImV4cCI6MjA5OTk3ODcyN30.DJUa4fZhEdh2o7JblUXqWdf8fFl3eNmhuvu7ewdH5ho";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

console.log("✅ Supabase verbunden");


async function saveVitalitaetsCheck(contactData) {
    console.log(
        "Speicherung gestartet:",
        contactData
    );

    let answers = {};

    try {
        answers = JSON.parse(
            sessionStorage.getItem(
                "vitalitaetsAnswers"
            ) || "{}"
        );
    } catch (error) {
        console.error(
            "Antworten konnten nicht gelesen werden:",
            error
        );
    }

    const pdfFilename =
        sessionStorage.getItem(
            "vitalitaetsPdfDateiname"
        ) || "";

    const { data, error } =
        await supabaseClient.functions.invoke(
            "save-vitalitaets-check",
            {
                body: {
                    firstName:
                        contactData.firstName,

                    lastName:
                        contactData.lastName,

                    email:
                        contactData.email,

                    phone:
                        contactData.phone,

                    answers:
                        answers,

                    pdfFilename:
                        pdfFilename,

                    consentStorage:
                        true
                }
            }
        );

    if (error) {
        console.error(
            "Supabase-Fehler:",
            error
        );

        return {
            success: false,
            error: error
        };
    }

    console.log(
        "Supabase-Antwort:",
        data
    );

    if (
        data &&
        data.checkId
    ) {
        sessionStorage.setItem(
            "vitalitaetsCheckId",
            data.checkId
        );
    }

    return {
        success: true,
        data: data
    };
}