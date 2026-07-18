document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#vitalitaets-form");

    if (!form) {
        return;
    }

    begrenzeMotivationen(form);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const auswertung = sammleAntworten(form);

            speichereAuswertung(auswertung);

            erstellePdf(auswertung);

            window.location.href = "termin.html";
        } catch (error) {
            console.error("PDF konnte nicht erstellt werden:", error);

            alert(
                "Die Auswertung konnte leider nicht erstellt werden. " +
                "Bitte versuchen Sie es erneut."
            );
        }
    });
});


function begrenzeMotivationen(form) {
    const motivationsFelder = form.querySelectorAll(
        'input[name="motivation"]:not([type="hidden"])'
    );

    motivationsFelder.forEach((feld) => {
        feld.addEventListener("change", () => {
            const ausgewaehlt = form.querySelectorAll(
                'input[name="motivation"]:checked'
            );

            if (ausgewaehlt.length > 3) {
                feld.checked = false;

                alert(
                    "Bitte wählen Sie höchstens drei Motivationen aus."
                );
            }
        });
    });
}


function sammleAntworten(form) {
    const karten = form.querySelectorAll(
        ".question-card[data-pdf-title]"
    );

    const bereiche = [];

    karten.forEach((karte) => {
        const titel =
            karte.dataset.pdfTitle ||
            karte.querySelector("h2")?.textContent.trim() ||
            "Fragebereich";

        const ausgewaehlteFelder = karte.querySelectorAll(
            'input[type="checkbox"]:checked, ' +
            'input[type="radio"]:checked'
        );

        const textFelder = karte.querySelectorAll(
            'input[type="text"], ' +
            'input[type="number"], ' +
            'input[type="email"], ' +
            "textarea, select"
        );

        const antworten = [];

        ausgewaehlteFelder.forEach((feld) => {
            if (
                feld.name === "datenschutz" ||
                feld.dataset.excludePdf === "true"
            ) {
                return;
            }

            antworten.push(ermittleFeldText(feld));
        });

        textFelder.forEach((feld) => {
            const wert = feld.value.trim();

            if (!wert || feld.dataset.excludePdf === "true") {
                return;
            }

            const beschriftung = ermittleBeschriftung(feld);

            antworten.push(
                beschriftung
                    ? `${beschriftung}: ${wert}`
                    : wert
            );
        });

        bereiche.push({
            titel,
            antworten:
                antworten.length > 0
                    ? antworten
                    : ["Keine Angabe"]
        });
    });

    return {
        id: erstelleAuswertungsId(),
        erstelltAm: new Date().toISOString(),
        bereiche
    };
}


function ermittleFeldText(feld) {
    const label = feld.closest("label");

    if (label) {
        const labelKopie = label.cloneNode(true);

        labelKopie
            .querySelectorAll("input, textarea, select")
            .forEach((element) => element.remove());

        const text = labelKopie.textContent
            .replace(/\s+/g, " ")
            .trim();

        if (text) {
            return text;
        }
    }

    if (feld.value) {
        return feld.value;
    }

    return "Ausgewählt";
}


function ermittleBeschriftung(feld) {
    if (feld.id) {
        const label = document.querySelector(
            `label[for="${feld.id}"]`
        );

        if (label) {
            return label.textContent
                .replace(/\s+/g, " ")
                .trim();
        }
    }

    return (
        feld.getAttribute("aria-label") ||
        feld.placeholder ||
        feld.name ||
        ""
    );
}


function erstelleAuswertungsId() {
    const zufall = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const datum = new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    return `VC-${datum}-${zufall}`;
}


function speichereAuswertung(auswertung) {
    sessionStorage.setItem(
        "vitalitaetsAuswertung",
        JSON.stringify(auswertung)
    );
}


function erstellePdf(auswertung) {
    if (!window.jspdf) {
        throw new Error("jsPDF wurde nicht geladen.");
    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const seitenBreite = pdf.internal.pageSize.getWidth();
    const seitenHoehe = pdf.internal.pageSize.getHeight();

    const randLinks = 20;
    const randRechts = 20;
    const randOben = 20;
    const randUnten = 20;
    const textBreite =
        seitenBreite - randLinks - randRechts;

    let y = randOben;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    pdf.text(
        "Vitalitäts-Check",
        randLinks,
        y
    );

    y += 9;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    pdf.text(
        "Persönliche Auswertung der angegebenen Antworten",
        randLinks,
        y
    );

    y += 8;

    pdf.setFontSize(9);

    pdf.text(
        `Auswertungs-ID: ${auswertung.id}`,
        randLinks,
        y
    );

    y += 5;

    pdf.text(
        `Erstellt am: ${formatiereDatum(
            auswertung.erstelltAm
        )}`,
        randLinks,
        y
    );

    y += 10;

    pdf.setDrawColor(210);
    pdf.line(
        randLinks,
        y,
        seitenBreite - randRechts,
        y
    );

    y += 10;

    auswertung.bereiche.forEach((bereich) => {
        y = pruefeSeitenumbruch(
            pdf,
            y,
            25,
            randOben,
            randUnten,
            seitenHoehe
        );

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);

        const titelZeilen = pdf.splitTextToSize(
            bereich.titel,
            textBreite
        );

        pdf.text(titelZeilen, randLinks, y);

        y += titelZeilen.length * 6 + 2;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);

        bereich.antworten.forEach((antwort) => {
            const zeilen = pdf.splitTextToSize(
                `• ${antwort}`,
                textBreite - 5
            );

            const benoetigteHoehe =
                zeilen.length * 5 + 3;

            y = pruefeSeitenumbruch(
                pdf,
                y,
                benoetigteHoehe,
                randOben,
                randUnten,
                seitenHoehe
            );

            pdf.text(
                zeilen,
                randLinks + 3,
                y
            );

            y += zeilen.length * 5 + 3;
        });

        y += 5;
    });

    y = pruefeSeitenumbruch(
        pdf,
        y,
        35,
        randOben,
        randUnten,
        seitenHoehe
    );

    pdf.setDrawColor(210);
    pdf.line(
        randLinks,
        y,
        seitenBreite - randRechts,
        y
    );

    y += 8;

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);

    const hinweis = pdf.splitTextToSize(
        "Hinweis: Diese Zusammenfassung gibt ausschließlich die " +
        "im Vitalitäts-Check gemachten Angaben wieder. Sie ersetzt " +
        "keine ärztliche Beratung, Diagnose oder Behandlung.",
        textBreite
    );

    pdf.text(hinweis, randLinks, y);

    fuegeSeitenzahlenHinzu(pdf);

    const dateiname =
        `vitalitaets-check-${auswertung.id}.pdf`;

    const pdfDataUri = pdf.output("datauristring");

    sessionStorage.setItem(
        "vitalitaetsPdf",
        pdfDataUri
    );

    sessionStorage.setItem(
        "vitalitaetsPdfDateiname",
        dateiname
    );
}


function pruefeSeitenumbruch(
    pdf,
    aktuellePosition,
    benoetigteHoehe,
    randOben,
    randUnten,
    seitenHoehe
) {
    if (
        aktuellePosition + benoetigteHoehe >
        seitenHoehe - randUnten
    ) {
        pdf.addPage();
        return randOben;
    }

    return aktuellePosition;
}


function fuegeSeitenzahlenHinzu(pdf) {
    const seitenAnzahl =
        pdf.getNumberOfPages();

    for (
        let seite = 1;
        seite <= seitenAnzahl;
        seite++
    ) {
        pdf.setPage(seite);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);

        pdf.text(
            `Seite ${seite} von ${seitenAnzahl}`,
            pdf.internal.pageSize.getWidth() - 20,
            pdf.internal.pageSize.getHeight() - 10,
            {
                align: "right"
            }
        );
    }
}


function formatiereDatum(isoDatum) {
    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(isoDatum));
}