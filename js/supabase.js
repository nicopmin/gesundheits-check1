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
                "vitalitaetsAuswertung"
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
        !data ||
        data.success !== true ||
        !data.checkId
    ) {
        console.error(
            "Ungültige Antwort der Speicherfunktion:",
            data
        );

        return {
            success: false,
            error:
                data && data.error
                    ? data.error
                    : "Check-ID fehlt"
        };
    }

    sessionStorage.setItem(
        "vitalitaetsCheckId",
        data.checkId
    );

    console.log(
        "Check-ID gespeichert:",
        data.checkId
    );

    console.log(
        "PDF-Daten vor Upload:",
        {
            checkId:
                sessionStorage.getItem(
                    "vitalitaetsCheckId"
                ),

            filename:
                sessionStorage.getItem(
                    "vitalitaetsPdfDateiname"
                ),

            pdfVorhanden:
                Boolean(
                    sessionStorage.getItem(
                        "vitalitaetsPdf"
                    )
                ),

            uploadFunktion:
                typeof uploadVitalitaetsPdf
        }
    );

    const pdfUploadResult =
        await uploadVitalitaetsPdf();

    if (!pdfUploadResult.success) {
        console.error(
            "Der Check wurde gespeichert, aber die PDF konnte nicht hochgeladen werden:",
            pdfUploadResult.error
        );

        return {
            success: true,
            data: data,
            pdfUploaded: false,
            pdfError:
                pdfUploadResult.error
        };
    }

    console.log(
        "Check und PDF erfolgreich gespeichert."
    );

    return {
        success: true,
        data: data,
        pdfUploaded: true,
        pdfData:
            pdfUploadResult.data
    };
}
async function uploadVitalitaetsPdf() {
        const checkId = sessionStorage.getItem(
        "vitalitaetsCheckId"
    );

    const filename = sessionStorage.getItem(
        "vitalitaetsPdfDateiname"
    );

    const pdfDataUri = sessionStorage.getItem(
        "vitalitaetsPdf"
    );
        if (!checkId) {
        console.error(
            "PDF-Upload nicht möglich: Check-ID fehlt."
        );

        return {
            success: false,
            error: "Check-ID fehlt"
        };
    }
        if (!filename || !pdfDataUri) {
        console.error(
            "PDF-Upload nicht möglich: PDF-Daten fehlen."
        );

        return {
            success: false,
            error: "PDF-Daten fehlen"
        };
    }
        const base64Marker = "base64,";
    const markerPosition =
        pdfDataUri.indexOf(base64Marker);

    if (markerPosition === -1) {
        console.error(
            "Ungültiges PDF-Data-URI-Format."
        );

        return {
            success: false,
            error: "Ungültiges PDF-Format"
        };
    }

    const pdfBase64 = pdfDataUri.substring(
        markerPosition + base64Marker.length
    );
        console.log(
        "PDF-Upload gestartet:",
        {
            checkId: checkId,
            filename: filename
        }
    );

    const { data, error } =
        await supabaseClient.functions.invoke(
            "upload-vitalitaets-pdf",
            {
                body: {
                    checkId: checkId,
                    filename: filename,
                    pdfBase64: pdfBase64
                }
            }
        );
            if (error) {
        console.error(
            "Fehler beim PDF-Upload:",
            error
        );

        return {
            success: false,
            error: error
        };
    }

    console.log(
        "PDF-Upload erfolgreich:",
        data
    );
        if (!data || data.success !== true) {
        return {
            success: false,
            error:
                data && data.error
                    ? data.error
                    : "PDF-Upload fehlgeschlagen"
        };
    }

    sessionStorage.removeItem(
    "vitalitaetsPdfSignedUrl"
);

    sessionStorage.setItem(
    "vitalitaetsPdfSignedUrl",
    data.signedUrl
);
    return {
        success: true,
        data: data
    };
}
async function updateVitalitaetsBooking(bookingData) {
    const checkId = sessionStorage.getItem(
        "vitalitaetsCheckId"
    );

    if (!checkId) {
        console.error(
            "Keine vitalitaetsCheckId im sessionStorage gefunden."
        );

        return {
            success: false,
            error: "Check-ID fehlt"
        };
    }

    if (
        !bookingData ||
        !bookingData.uid ||
        !bookingData.startTime
    ) {
        console.error(
            "Cal.com Buchungsdaten sind unvollständig:",
            bookingData
        );

        return {
            success: false,
            error: "Buchungsdaten fehlen"
        };
    }
        console.log(
        "Buchungsaktualisierung gestartet:",
        {
            checkId: checkId,
            bookingUid: bookingData.uid,
            bookingStartTime:
                bookingData.startTime
        }
    );

    const { data, error } =
        await supabaseClient.functions.invoke(
            "update-vitalitaets-booking",
            {
                body: {
                    checkId: checkId,
                    bookingUid:
                        bookingData.uid,
                    bookingStartTime:
                        bookingData.startTime
                }
            }
        );
            if (error) {
        console.error(
            "Fehler bei der Buchungsaktualisierung:",
            error
        );

        return {
            success: false,
            error: error
        };
    }

    console.log(
        "Buchungsaktualisierung erfolgreich:",
        data
    );

    return {
        success: true,
        data: data
    };
}