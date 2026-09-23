/**
 * ExecutiveReportPdfService
 *
 * Compact landscape executive briefing for the Hospital Readiness
 * Executive Assessment Report.
 *
 * The service formats an already-calculated report payload. It does not
 * calculate or modify Hospital Readiness scores.
 */

import PDFDocument from "pdfkit";

import type {
    ExecutiveReportListItem,
    ExecutiveReportPayload
}
from "../types/ExecutiveReportPayload.js";

const PAGE_MARGIN = 28;
const BRAND_DARK = "#172033";
const BRAND_MUTED = "#5F6B7A";
const BORDER = "#D8DEE8";
const LIGHT_BACKGROUND = "#F4F6F9";
const WHITE = "#FFFFFF";
const DANGER = "#B42318";

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CONTENT_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN;

export async function createExecutiveReportPdf(
    report:ExecutiveReportPayload
):Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {

        const document = new PDFDocument({
            size:"LETTER",
            layout:"landscape",
            margins:{
                top:PAGE_MARGIN,
                right:PAGE_MARGIN,
                bottom:PAGE_MARGIN,
                left:PAGE_MARGIN
            },
            info:{
                Title:"Hospital Readiness Executive Assessment Report",
                Subject:"Hospital Readiness Executive Assessment Report",
                Author:"Hospital Readiness"
            }
        });

        const chunks:Buffer[] = [];

        document.on("data", (chunk:Buffer) => chunks.push(chunk));
        document.on("end", () => resolve(Buffer.concat(chunks)));
        document.on("error", reject);

        try {
            renderReport(document, report);
            document.end();
        }
        catch(error){
            reject(error);
        }
    });
}

function renderReport(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    renderCompactHeader(document, report);
    renderStatusStrip(document, report);
    renderDomainRow(document, report);
    renderCompactTrend(document, report);
    renderConditionsAndAcuity(document, report);

    const lowerStartY = document.y + 5;
    const lowerAvailableHeight = CONTENT_BOTTOM - lowerStartY - 58;
    const listHeight = Math.max(
        measureCompactList(document, report.drivers, CONTENT_WIDTH / 2 - 8),
        measureCompactList(document, report.recommendations, CONTENT_WIDTH / 2 - 8)
    );

    if(listHeight <= lowerAvailableHeight){
        renderSideBySideLists(
            document,
            report,
            lowerStartY,
            lowerAvailableHeight
        );

        document.y = lowerStartY + Math.max(74, listHeight) + 8;
        renderCompactOutlook(document, report);
        renderFooter(document);
        return;
    }

    // Long-content fallback: keep the executive operational picture intact
    // on page 1 and intentionally move detailed drivers/actions to page 2.
    renderPageOneContinuationNote(document);
    renderFooter(document);

    document.addPage({
        size:"LETTER",
        layout:"landscape",
        margins:{
            top:PAGE_MARGIN,
            right:PAGE_MARGIN,
            bottom:PAGE_MARGIN,
            left:PAGE_MARGIN
        }
    });

    renderDetailPageHeader(document, report);
    const detailStartY = document.y + 8;

    renderSideBySideLists(
        document,
        report,
        detailStartY,
        CONTENT_BOTTOM - detailStartY - 72
    );

    document.y = Math.min(
        CONTENT_BOTTOM - 66,
        detailStartY + Math.max(
            measureCompactList(document, report.drivers, CONTENT_WIDTH / 2 - 8),
            measureCompactList(document, report.recommendations, CONTENT_WIDTH / 2 - 8)
        ) + 12
    );

    renderCompactOutlook(document, report);
    renderFooter(document);
}

function renderCompactHeader(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    const y = PAGE_MARGIN;

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(7)
        .text("HOSPITAL READINESS INDEX", PAGE_MARGIN, y, {
            width:240
        });

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("Executive Assessment Report", PAGE_MARGIN, y + 11, {
            width:330
        });

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica")
        .fontSize(7.2)
        .text(
            `Assessment ${formatDateTime(report.assessmentTimestamp)}`,
            PAGE_WIDTH - PAGE_MARGIN - 285,
            y + 4,
            { width:285, align:"right" }
        )
        .text(
            `Generated ${formatDateTime(report.generatedTimestamp)}`,
            PAGE_WIDTH - PAGE_MARGIN - 285,
            y + 17,
            { width:285, align:"right" }
        );

    document.y = y + 38;
}

function renderDetailPageHeader(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(7)
        .text("HOSPITAL READINESS INDEX");

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("Executive Assessment Report — Operational Detail");

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica")
        .fontSize(7.2)
        .text(
            `${formatDateTime(report.assessmentTimestamp)} · HRI ${Math.round(report.hriScore)} · ${report.operationalLevel}`
        );

    document.y += 4;
}

function renderStatusStrip(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    const y = document.y;
    const height = 78;

    document
        .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, height, 7)
        .fillAndStroke(LIGHT_BACKGROUND, BORDER);

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Overall Hospital Readiness", PAGE_MARGIN + 16, y + 11, { width:260 });

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica")
        .fontSize(7.2)
        .text(
            "The Hospital Readiness Index (HRI) reflects current operational pressure across the emergency department and inpatient capacity.",
            PAGE_MARGIN + 16,
            y + 28,
            { width:280, lineGap:1 }
        );

    renderHriGauge(document, report, PAGE_MARGIN + 315, y + 5, 185, 68);
    renderSurgeStatus(document, report, PAGE_WIDTH - PAGE_MARGIN - 185, y + 7, 172, 64);

    document.y = y + height + 7;
}


function renderSurgeStatus(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload,
    x:number,
    y:number,
    width:number,
    height:number
):void {

    const color = getSurgeStatusColor(report.operationalLevel);

    document
        .roundedRect(x, y, width, height, 6)
        .lineWidth(1.4)
        .fillAndStroke(WHITE, color);

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text("CURRENT SURGE STATUS", x + 8, y + 10, { width:width - 16, align:"center" });

    document
        .fillColor(color)
        .font("Helvetica-Bold")
        .fontSize(19)
        .text(report.operationalLevel.toUpperCase(), x + 8, y + 25, { width:width - 16, align:"center", ellipsis:true });
}


function getSurgeStatusColor(level:string):string {
    switch(level.trim().toLowerCase()){
        case "echo": return "#111111";
        case "delta": return "#D64545";
        case "charlie": return "#F28C28";
        case "bravo": return "#C69A00";
        default: return "#2E7D32";
    }
}


function renderHriGauge(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload,
    x:number,
    y:number,
    width:number,
    height:number
):void {

    const score = Math.max(0, Math.min(100, report.hriScore));
    const centerX = x + width / 2;
    const centerY = y + height - 12;
    const radius = Math.min(width / 2 - 14, height - 18);
    const lineWidth = 11;

    const segments = [
        {start:180, end:144, color:"#2E7D32"},
        {start:144, end:108, color:"#F9C74F"},
        {start:108, end:72, color:"#F28C28"},
        {start:72, end:36, color:"#D64545"},
        {start:36, end:0, color:"#111111"}
    ];

    for(const segment of segments){
        document
            .path(createArcPath(centerX, centerY, radius, segment.start, segment.end))
            .lineWidth(lineWidth)
            .strokeColor(segment.color)
            .stroke();
    }

    const needleAngle = 180 - score * 1.8;
    const needleRadians = needleAngle * Math.PI / 180;
    const needleLength = radius - 8;
    const needleX = centerX + Math.cos(needleRadians) * needleLength;
    const needleY = centerY - Math.sin(needleRadians) * needleLength;

    document
        .moveTo(centerX, centerY)
        .lineTo(needleX, needleY)
        .lineWidth(1.8)
        .strokeColor(BRAND_DARK)
        .stroke();

    document.circle(centerX, centerY, 2.5).fillColor(BRAND_DARK).fill();

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(String(Math.round(score)), centerX - 30, centerY - 24, { width:60, align:"center" });

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text("HRI", centerX - 25, centerY - 5, { width:50, align:"center" });
}


function createArcPath(
    centerX:number,
    centerY:number,
    radius:number,
    startDegrees:number,
    endDegrees:number
):string {
    const point = (degrees:number) => {
        const radians = degrees * Math.PI / 180;
        return {
            x:centerX + radius * Math.cos(radians),
            y:centerY - radius * Math.sin(radians)
        };
    };

    const start = point(startDegrees);
    const end = point(endDegrees);
    const largeArc = Math.abs(startDegrees - endDegrees) > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}


function renderDomainRow(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    renderCompactSectionLabel(document, "Hospital Readiness Domains");

    const y = document.y;
    const gap = 8;
    const width = (CONTENT_WIDTH - gap * 2) / 3;
    const height = 47;

    const domains = [
        {
            label:"ED Operational Pressure",
            value:report.domains.edOperationalPressure,
            weight:"45% weight"
        },
        {
            label:"Projected Acute-Care Capacity",
            value:report.domains.projectedAcuteCareCapacity,
            weight:"35% weight"
        },
        {
            label:"Critical-Care Capacity",
            value:report.domains.criticalCareCapacity,
            weight:"20% weight"
        }
    ];

    domains.forEach((domain, index) => {
        const x = PAGE_MARGIN + index * (width + gap);

        document
            .roundedRect(x, y, width, height, 6)
            .fillAndStroke(WHITE, BORDER);

        document
            .fillColor(BRAND_MUTED)
            .font("Helvetica-Bold")
            .fontSize(6.5)
            .text(domain.label, x + 9, y + 7, {
                width:width - 70,
                ellipsis:true
            });

        document
            .fillColor(BRAND_DARK)
            .font("Helvetica-Bold")
            .fontSize(15)
            .text(`${formatNumber(domain.value)} / 100`, x + 9, y + 21, {
                width:100
            });

        document
            .fillColor(BRAND_MUTED)
            .font("Helvetica")
            .fontSize(6.5)
            .text(domain.weight, x + width - 72, y + 25, {
                width:62,
                align:"right"
            });
    });

    document.y = y + height + 6;
}

function renderCompactTrend(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    const points = Array.isArray(report.trend)
        ? report.trend.slice(-12)
        : [];

    renderCompactSectionLabel(document, "Recent Hospital Readiness Index (HRI)");

    const y = document.y;
    const height = 86;

    document
        .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, height, 6)
        .fillAndStroke(WHITE, BORDER);

    if(points.length === 0){
        document.fillColor(BRAND_MUTED).font("Helvetica").fontSize(7.5)
            .text("No saved historical assessments are available.", PAGE_MARGIN + 10, y + 32);
        document.y = y + height + 6;
        return;
    }

    const plotLeft = PAGE_MARGIN + 30;
    const plotRight = PAGE_WIDTH - PAGE_MARGIN - 18;
    const plotTop = y + 10;
    const plotBottom = y + 52;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    for(const value of [100, 75, 50, 25, 0]){
        const lineY = plotTop + (100 - value) / 100 * plotHeight;
        document.moveTo(plotLeft, lineY).lineTo(plotRight, lineY)
            .strokeColor(BORDER).lineWidth(0.35).stroke();
        document.fillColor(BRAND_MUTED).font("Helvetica").fontSize(5.3)
            .text(String(value), PAGE_MARGIN + 5, lineY - 3, {width:20, align:"right"});
    }

    points.forEach((point, index) => {
        const score = Math.max(0, Math.min(100, point.score));
        const x = points.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + index / (points.length - 1) * plotWidth;
        const pointY = plotTop + (100 - score) / 100 * plotHeight;

        if(index > 0){
            const previous = Math.max(0, Math.min(100, points[index - 1].score));
            const previousX = plotLeft + (index - 1) / (points.length - 1) * plotWidth;
            const previousY = plotTop + (100 - previous) / 100 * plotHeight;
            document.moveTo(previousX, previousY).lineTo(x, pointY)
                .strokeColor("#1565C0").lineWidth(1.4).stroke();
        }

        document.circle(x, pointY, 1.8).fillColor("#1565C0").fill();
        document.fillColor(BRAND_DARK).font("Helvetica-Bold").fontSize(5.4)
            .text(String(Math.round(score)), x - 12, pointY - 10, {width:24, align:"center"});
        document.fillColor(BRAND_MUTED).font("Helvetica").fontSize(4.7)
            .text(formatPdfTrendTimestamp(point.timestamp), x - 27, plotBottom + 5, {width:54, align:"center"});
    });

    document.y = y + height + 6;
}


function renderConditionsAndAcuity(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    const y = document.y;
    const gap = 10;
    const leftWidth = 236;
    const centerWidth = 310;
    const rightWidth = CONTENT_WIDTH - leftWidth - centerWidth - gap * 2;
    const height = 91;

    renderCompactInfoPanel(
        document,
        PAGE_MARGIN,
        y,
        leftWidth,
        height,
        "Emergency Department",
        [
            ["ED Volume", `${formatNumber(report.capacity.totalEDVolume)} (${formatNumber(report.capacity.edCapacityPercent)}%)`],
            ["Boarding", `${formatNumber(report.capacity.boardedPatients)} (${formatNumber(report.capacity.boardingSharePercent)}%)`],
            ["Acute Beds", `${formatNumber(report.capacity.occupiedAcuteCareBeds)} / ${formatNumber(report.capacity.staffedAcuteCareBeds)}`],
            ["Critical Beds", `${formatNumber(report.capacity.occupiedCriticalCareBeds)} / ${formatNumber(report.capacity.staffedCriticalCareBeds)}`]
        ]
    );

    renderCompactInfoPanel(
        document,
        PAGE_MARGIN + leftWidth + gap,
        y,
        centerWidth,
        height,
        "Four-Hour Capacity Forecast",
        [
            ["Direct Admissions", formatNumber(report.capacity.knownDirectAdmissions4h)],
            ["Surgical / Procedural", formatNumber(report.capacity.knownSurgicalAdmissions4h)],
            ["Expected ED Admissions", formatNumber(report.capacity.expectedAdditionalEDAdmissions4h)],
            ["Expected Departures", formatNumber(report.capacity.expectedInpatientDepartures4h)],
            ["Projected Available", formatBedAvailability(report.capacity.projectedAvailableAcuteCareBeds)]
        ],
        report.capacity.projectedAvailableAcuteCareBeds < 0
            ? DANGER
            : BRAND_DARK
    );

    renderCompactInfoPanel(
        document,
        PAGE_MARGIN + leftWidth + gap + centerWidth + gap,
        y,
        rightWidth,
        height,
        "Clinical Acuity",
        [
            ["ESI 1", formatNumber(report.acuity.esi1)],
            ["ESI 2", formatNumber(report.acuity.esi2)],
            ["ESI 3–5", formatNumber(report.acuity.esi3to5)],
            ["High Acuity", `${formatNumber(report.acuity.highAcuityCount)} (${formatNumber(report.acuity.highAcuityPercent)}%)`]
        ]
    );

    document.y = y + height + 4;
}

function renderCompactInfoPanel(
    document:PDFKit.PDFDocument,
    x:number,
    y:number,
    width:number,
    height:number,
    heading:string,
    rows:Array<[string, string]>,
    finalValueColor:string = BRAND_DARK
):void {

    document
        .roundedRect(x, y, width, height, 6)
        .fillAndStroke(LIGHT_BACKGROUND, BORDER);

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(heading, x + 9, y + 7, {
            width:width - 18
        });

    const startY = y + 23;
    const rowHeight = Math.min(13, (height - 29) / rows.length);

    rows.forEach((row, index) => {
        const rowY = startY + index * rowHeight;

        document
            .fillColor(BRAND_MUTED)
            .font("Helvetica")
            .fontSize(6.4)
            .text(row[0], x + 9, rowY, {
                width:width * 0.58 - 10,
                ellipsis:true
            });

        document
            .fillColor(index === rows.length - 1 ? finalValueColor : BRAND_DARK)
            .font("Helvetica-Bold")
            .fontSize(6.7)
            .text(row[1], x + width * 0.58, rowY, {
                width:width * 0.42 - 9,
                align:"right",
                ellipsis:true
            });
    });
}

function renderSideBySideLists(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload,
    y:number,
    availableHeight:number
):void {

    const gap = 12;
    const width = (CONTENT_WIDTH - gap) / 2;

    renderCompactListColumn(
        document,
        PAGE_MARGIN,
        y,
        width,
        availableHeight,
        "Primary Drivers",
        report.drivers,
        "No dominant Hospital Readiness drivers were identified."
    );

    renderCompactListColumn(
        document,
        PAGE_MARGIN + width + gap,
        y,
        width,
        availableHeight,
        "Recommended Actions",
        report.recommendations,
        "No operational intervention is currently recommended."
    );
}

function renderCompactListColumn(
    document:PDFKit.PDFDocument,
    x:number,
    y:number,
    width:number,
    availableHeight:number,
    heading:string,
    items:ExecutiveReportListItem[],
    emptyMessage:string
):void {

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(6.2)
        .text(heading.toUpperCase(), x, y, { width });

    let cursorY = y + 12;

    if(items.length === 0){
        document
            .fillColor(BRAND_MUTED)
            .font("Helvetica")
            .fontSize(7)
            .text(emptyMessage, x, cursorY, { width });
        return;
    }

    for(const item of items){
        const itemHeight = measureCompactListItem(document, item, width);

        if(cursorY + itemHeight > y + availableHeight){
            document
                .fillColor(BRAND_MUTED)
                .font("Helvetica-Oblique")
                .fontSize(6.5)
                .text("Additional detail continues on the next page.", x, cursorY, { width });
            break;
        }

        const labelWidth = 70;
        const textWidth = width - labelWidth - 8;

        document
            .fillColor(BRAND_DARK)
            .font("Helvetica-Bold")
            .fontSize(7.4)
            .text(item.title, x, cursorY, {
                width:textWidth,
                lineGap:0.4
            });

        const titleBottom = document.y;

        document
            .fillColor(BRAND_MUTED)
            .font("Helvetica")
            .fontSize(6.4)
            .text(item.description, x, titleBottom + 1.5, {
                width:textWidth,
                lineGap:0.5
            });

        document
            .fillColor(BRAND_MUTED)
            .font("Helvetica-Bold")
            .fontSize(6.2)
            .text(item.label, x + width - labelWidth, cursorY, {
                width:labelWidth,
                align:"right"
            });

        cursorY += itemHeight;

        document
            .moveTo(x, cursorY - 3)
            .lineTo(x + width, cursorY - 3)
            .strokeColor(BORDER)
            .lineWidth(0.35)
            .stroke();
    }
}

function measureCompactList(
    document:PDFKit.PDFDocument,
    items:ExecutiveReportListItem[],
    width:number
):number {

    if(items.length === 0){
        return 36;
    }

    return 12 + items.reduce(
        (total, item) => total + measureCompactListItem(document, item, width),
        0
    );
}

function measureCompactListItem(
    document:PDFKit.PDFDocument,
    item:ExecutiveReportListItem,
    width:number
):number {

    const labelWidth = 70;
    const textWidth = width - labelWidth - 8;

    document.font("Helvetica-Bold").fontSize(7.4);
    const titleHeight = document.heightOfString(item.title, {
        width:textWidth,
        lineGap:0.4
    });

    document.font("Helvetica").fontSize(6.4);
    const descriptionHeight = document.heightOfString(item.description, {
        width:textWidth,
        lineGap:0.5
    });

    document.font("Helvetica-Bold").fontSize(6.2);
    const labelHeight = document.heightOfString(item.label, {
        width:labelWidth
    });

    return Math.max(
        22,
        Math.ceil(Math.max(titleHeight + 1.5 + descriptionHeight, labelHeight) + 7)
    );
}

function renderCompactOutlook(
    document:PDFKit.PDFDocument,
    report:ExecutiveReportPayload
):void {

    const y = document.y;
    const height = 48;

    if(y + height > CONTENT_BOTTOM - 20){
        return;
    }

    document
        .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, height, 6)
        .fillAndStroke(LIGHT_BACKGROUND, BORDER);

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(6.2)
        .text("OPERATIONAL OUTLOOK", PAGE_MARGIN + 10, y + 7, {
            width:115
        });

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(8.2)
        .text(report.outlook.heading, PAGE_MARGIN + 130, y + 6, {
            width:CONTENT_WIDTH - 140,
            ellipsis:true
        });

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica")
        .fontSize(6.5)
        .text(report.outlook.description, PAGE_MARGIN + 130, y + 19, {
            width:CONTENT_WIDTH - 140,
            height:24,
            lineGap:0.5,
            ellipsis:true
        });

    document.y = y + height + 4;
}

function renderPageOneContinuationNote(
    document:PDFKit.PDFDocument
):void {

    const y = document.y + 8;

    document
        .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 34, 6)
        .fillAndStroke(LIGHT_BACKGROUND, BORDER);

    document
        .fillColor(BRAND_DARK)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("Operational detail continues on page 2", PAGE_MARGIN + 10, y + 8);

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica")
        .fontSize(6.5)
        .text(
            "Primary drivers, recommended actions, and the operational outlook are continued without reducing report readability.",
            PAGE_MARGIN + 10,
            y + 19,
            { width:CONTENT_WIDTH - 20 }
        );

    document.y = y + 38;
}

function renderCompactSectionLabel(
    document:PDFKit.PDFDocument,
    text:string
):void {

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica-Bold")
        .fontSize(6.2)
        .text(text.toUpperCase(), PAGE_MARGIN, document.y, {
            width:CONTENT_WIDTH
        });

    document.y += 10;
}

function renderFooter(
    document:PDFKit.PDFDocument
):void {

    const footerY = PAGE_HEIGHT - PAGE_MARGIN - 14;

    document
        .moveTo(PAGE_MARGIN, footerY - 4)
        .lineTo(PAGE_WIDTH - PAGE_MARGIN, footerY - 4)
        .strokeColor(BORDER)
        .lineWidth(0.4)
        .stroke();

    document
        .fillColor(BRAND_MUTED)
        .font("Helvetica")
        .fontSize(5.8)
        .text(
            "The Hospital Readiness Index is an operational decision-support tool. Results should be interpreted with clinical and administrative judgment and local surge policies.",
            PAGE_MARGIN,
            footerY,
            { width:CONTENT_WIDTH }
        );
}

function formatDateTime(value:string):string {
    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return "Unavailable";
    }

    return date.toLocaleString("en-US", {
        month:"short",
        day:"numeric",
        year:"numeric",
        hour:"numeric",
        minute:"2-digit",
        timeZoneName:"short"
    });
}

function formatPdfTrendTimestamp(value:string):string {
    const date = new Date(value);

    if(Number.isNaN(date.getTime())){
        return value;
    }

    return date.toLocaleString("en-US", {
        month:"short",
        day:"numeric",
        hour:"numeric",
        minute:"2-digit"
    });
}

function formatNumber(value:number):string {
    if(!Number.isFinite(value)){
        return "--";
    }

    if(Number.isInteger(value)){
        return String(value);
    }

    return value
        .toFixed(1)
        .replace(/\.0$/, "");
}

function formatBedAvailability(value:number):string {
    if(!Number.isFinite(value)){
        return "--";
    }

    if(value < 0){
        return `${formatNumber(value)} beds deficit`;
    }

    if(value === 1){
        return "1 bed";
    }

    return `${formatNumber(value)} beds`;
}

