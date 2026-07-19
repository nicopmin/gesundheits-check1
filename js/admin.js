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
    
}
async function statusSpeichern(id, neuerStatus) {
    const { data, error } =
        await supabaseClient.functions.invoke(
            "update-customer-status",
            {
                body: {
                    id,
                    customerStatus: neuerStatus
                }
            }
        );

    if (error) {
        console.error(error);
        return;
    }

    const statusKlasse = neuerStatus
        .toLowerCase()
        .replaceAll(" ", "-")
        .replaceAll("ä", "ae")
        .replaceAll("ö", "oe")
        .replaceAll("ü", "ue");

    const statusPunkt = document.querySelector(`#status-dot-${id}`);

    if (statusPunkt) {
        statusPunkt.className = `status-dot status-${statusKlasse}`;
    }

    console.log("Status gespeichert:", data);
}
async function ladeVitalitaetsChecks() {
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
    <td>
    <span class="status-dot status-${(check.customer_status ?? "Neu")
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
}" id="status-dot-${check.id}"></span>
</td>

<td>${new Date(check.created_at).toLocaleString("de-DE")}</td>
    <td>${check.first_name ?? ""} ${check.last_name ?? ""}</td>
    <td>${check.email ?? ""}</td>
    <td>
        ${
            check.booking_start_time
                ? new Date(check.booking_start_time).toLocaleString("de-DE")
                : check.booking_status ?? ""
        }
    </td>
    <td>
        ${
            check.pdf_url
                ? `<button type="button" onclick="pdfOeffnen('${check.pdf_url}')">
                       PDF öffnen
                   </button>`
                : ""
        }
    </td>
    <td>
    <select onchange="statusSpeichern('${check.id}', this.value)">
        <option ${
            (check.customer_status ?? "Neu") === "Neu"
                ? "selected"
                : ""
        }>Neu</option>

        <option ${
            check.customer_status === "Beratung erfolgt"
                ? "selected"
                : ""
        }>Beratung erfolgt</option>

        <option ${
            check.customer_status === "Kunde geworden"
                ? "selected"
                : ""
        }>Kunde geworden</option>

        <option ${
            check.customer_status === "Kein Interesse"
                ? "selected"
                : ""
        }>Kein Interesse</option>
    </select>
</td>
`;

    tbody.appendChild(row);
});
}

ladeVitalitaetsChecks();
const suchfeld = document.getElementById("suche");

suchfeld.addEventListener("input", () => {
    const suchtext = suchfeld.value.toLowerCase();
    const zeilen = document.querySelectorAll(
        "#checksTable tbody tr"
    );

    zeilen.forEach((zeile) => {
        const inhalt = zeile.textContent.toLowerCase();

        zeile.style.display = inhalt.includes(suchtext)
            ? ""
            : "none";
    });
});
