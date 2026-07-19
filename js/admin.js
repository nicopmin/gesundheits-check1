let datumAbsteigend = true;

async function pruefeLogin() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.replace("admin-login.html");
        return false;
    }

    return true;
}

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

aktualisiereStatistiken();


    
console.log("Status gespeichert:", data);
}
function aktualisiereStatistiken() {
    const statusPunkte = document.querySelectorAll(".status-dot");

    let neu = 0;
    let beratung = 0;
    let kunde = 0;
    let keinInteresse = 0;

    statusPunkte.forEach((punkt) => {
        if (punkt.classList.contains("status-neu")) neu++;
        if (punkt.classList.contains("status-beratung-erfolgt")) beratung++;
        if (punkt.classList.contains("status-kunde-geworden")) kunde++;
        if (punkt.classList.contains("status-kein-interesse")) keinInteresse++;
    });

    document.querySelector("#stat-neu").textContent = neu;
    document.querySelector("#stat-beratung").textContent = beratung;
    document.querySelector("#stat-kunde").textContent = kunde;
    document.querySelector("#stat-kein").textContent = keinInteresse;
}

function filtereTabelle() {
    console.log("Filter läuft");

    const suchtext = document
        .querySelector("#suche")
        .value
        .toLowerCase();

    const ausgewaehlterStatus =
        document.querySelector("#statusFilter").value;

    const zeilen = document.querySelectorAll(
        "#checksTable tbody tr"
    );

    let sichtbareZeilen = 0;

    zeilen.forEach((zeile) => {
        const zeilenText = zeile.textContent.toLowerCase();

        const statusSelect = zeile.querySelector("select");
        const status = statusSelect ? statusSelect.value : "";

        const passtZurSuche = zeilenText.includes(suchtext);

        const passtZumStatus =
            ausgewaehlterStatus === "Alle" ||
            status === ausgewaehlterStatus;

        const istSichtbar =
            passtZurSuche && passtZumStatus;

        zeile.style.display = istSichtbar
            ? ""
            : "none";

        if (istSichtbar) {
            sichtbareZeilen++;
        }
    });

    document.getElementById("tableInfo").textContent =
        `${zeilen.length} Datensätze • ${sichtbareZeilen} angezeigt`;
}

function sortiereNachDatum() {
    const tbody = document.querySelector("#checksTable tbody");

    const zeilen = Array.from(tbody.querySelectorAll("tr"));

    zeilen.sort((a, b) => {
        const datumA = new Date(a.dataset.createdAt);
        const datumB = new Date(b.dataset.createdAt);

        return datumAbsteigend
            ? datumB - datumA
            : datumA - datumB;
    });

    zeilen.forEach((zeile) => {
        tbody.appendChild(zeile);
    });
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

document.getElementById("tableInfo").textContent =
    `${data.data.length} Datensätze`;

console.log("PDF-Wert:", data.data[0]?.pdf_url);

const anzahlNeu = data.data.filter(
    check => (check.customer_status ?? "Neu") === "Neu"
).length;

const anzahlBeratung = data.data.filter(
    check => check.customer_status === "Beratung erfolgt"
).length;

const anzahlKunden = data.data.filter(
    check => check.customer_status === "Kunde geworden"
).length;

const anzahlKeinInteresse = data.data.filter(
    check => check.customer_status === "Kein Interesse"
).length;

document.querySelector("#stat-neu").textContent = anzahlNeu;
document.querySelector("#stat-beratung").textContent = anzahlBeratung;
document.querySelector("#stat-kunde").textContent = anzahlKunden;
document.querySelector("#stat-kein").textContent = anzahlKeinInteresse;

data.data.forEach((check) => {
    const row = document.createElement("tr");

    row.dataset.createdAt = check.created_at;

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

sortiereNachDatum();

}

async function init() {
    const istAngemeldet = await pruefeLogin();

    if (!istAngemeldet) {
        return;
    }

    await ladeVitalitaetsChecks();
}

init();

    document
        .querySelector("#suche")
        .addEventListener("input", filtereTabelle);

    document
        .querySelector("#statusFilter")
        .addEventListener("change", filtereTabelle);
    
    document
    .querySelector("#filterReset")
    .addEventListener("click", () => {

        document.querySelector("#suche").value = "";
        document.querySelector("#statusFilter").value = "Alle";

        filtereTabelle();
    });

    document
    .querySelector("#datumHeader")
    .addEventListener("click", () => {

        datumAbsteigend = !datumAbsteigend;

        document.querySelector("#datumHeader").textContent =
            datumAbsteigend
                ? "Datum ▼"
                : "Datum ▲";

        sortiereNachDatum();
    });