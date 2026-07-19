async function pdfOeffnen(pdfPath) {
    const { data, error } =
        await supabaseClient.functions.invoke(
            "get-pdf-signed-url",
            {
                body: {
                    pdfPath
                }
            }
        );

    if (error) {
        console.error(error);
        return;
    }

    window.open(
        data.signedUrl,
        "_blank"
    );
}async function ladeVitalitaetsChecks() {
    const { data, error } =
        await supabaseClient.functions.invoke(
            "get-vitalitaets-checks"
        );

    if (error) {
        console.error(error);
        return;
    }

    const tbody = document.querySelector(
    "#checksTable tbody"
);

tbody.innerHTML = "";

console.log("PDF-Wert:", data.data[0]?.pdf_url);

data.data.forEach((check) => {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${new Date(check.created_at).toLocaleString("de-DE")}</td>
        <td>${check.first_name ?? ""} ${check.last_name ?? ""}</td>
        <td>${check.email ?? ""}</td>
        <td>${check.booking_status ?? ""}</td>
        <td>
    ${
        check.pdf_url
            ? `<button type="button" onclick="pdfOeffnen('${check.pdf_url}')">
                   PDF öffnen
               </button>`
            : ""
    }
</td>
    `;

    tbody.appendChild(row);
});
}

ladeVitalitaetsChecks();