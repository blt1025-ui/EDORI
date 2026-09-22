/**
 * ExecutiveReportPdfService
 *
 * Creates the PDF attachment for an Executive
 * Assessment Report.
 *
 * This service formats an already-calculated report
 * payload. It does not calculate Hospital Readiness.
 */

import PDFDocument from "pdfkit";

import type {

    ExecutiveReportListItem,
    ExecutiveReportPayload

}

from "../types/ExecutiveReportPayload.js";


const PAGE_MARGIN =
    46;


const BRAND_DARK =
    "#172033";


const BRAND_MUTED =
    "#5F6B7A";


const BORDER =
    "#D8DEE8";


const LIGHT_BACKGROUND =
    "#F4F6F9";


const WHITE =
    "#FFFFFF";


export async function createExecutiveReportPdf(

    report:ExecutiveReportPayload

):Promise<Buffer> {

    return new Promise<Buffer>(

        (
            resolve,
            reject
        ) => {

            const document =

                new PDFDocument({

                    size:
                        "LETTER",

                    margins:{

                        top:
                            PAGE_MARGIN,

                        right:
                            PAGE_MARGIN,

                        bottom:
                            PAGE_MARGIN,

                        left:
                            PAGE_MARGIN

                    },

                    info:{

                        Title:
                            "Hospital Readiness Executive Assessment Report",

                        Subject:
                            "Hospital Readiness Executive Assessment Report",

                        Author:
                            "Hospital Readiness"

                    }

                });


            const chunks:Buffer[] = [];


            document.on(

                "data",

                (
                    chunk:Buffer
                ) => {

                    chunks.push(
                        chunk
                    );

                }

            );


            document.on(

                "end",

                () => {

                    resolve(
                        Buffer.concat(
                            chunks
                        )
                    );

                }

            );


            document.on(
                "error",
                reject
            );


            try {

                renderReport(
                    document,
                    report
                );


                document.end();

            }
            catch(error){

                reject(
                    error
                );

            }

        }

    );

}


function renderReport(

    document:PDFKit.PDFDocument,

    report:ExecutiveReportPayload

):void {

    renderHeader(
        document,
        report
    );


    renderOperationalStatus(
        document,
        report
    );


    renderSectionHeading(

        document,

        "Hospital Readiness Domains",

        "Current Operational Pressure"

    );


    renderMetricGrid(

        document,

        [

            {
                label:
                    "ED Operational Pressure",

                value:
                    `${formatNumber(
                        report.domains.edOperationalPressure
                    )} / 100`,

                detail:
                    "45% of Hospital Readiness score"
            },

            {
                label:
                    "Projected Acute-Care Capacity",

                value:
                    `${formatNumber(
                        report.domains.projectedAcuteCareCapacity
                    )} / 100`,

                detail:
                    "35% of Hospital Readiness score"
            },

            {
                label:
                    "Critical-Care Capacity",

                value:
                    `${formatNumber(
                        report.domains.criticalCareCapacity
                    )} / 100`,

                detail:
                    "20% of Hospital Readiness score"
            }

        ]

    );


    renderSectionHeading(

        document,

        "Current Conditions",

        "ED and Hospital Capacity"

    );


    renderMetricGrid(

        document,

        [

            {
                label:
                    "Total ED Volume",

                value:
                    formatNumber(
                        report.capacity.totalEDVolume
                    ),

                detail:
                    `${formatNumber(
                        report.capacity.edCapacityPercent
                    )}% of ${formatNumber(
                        report.capacity.edTreatmentBeds
                    )}-bed treatment capacity`
            },

            {
                label:
                    "Boarding Patients",

                value:
                    formatNumber(
                        report.capacity.boardedPatients
                    ),

                detail:
                    `${formatNumber(
                        report.capacity.boardingSharePercent
                    )}% of ED census`
            },

            {
                label:
                    "Acute-Care Beds",

                value:
                    `${formatNumber(
                        report.capacity.occupiedAcuteCareBeds
                    )} / ${formatNumber(
                        report.capacity.staffedAcuteCareBeds
                    )}`,

                detail:
                    `${formatNumber(
                        report.capacity.acuteOccupancyPercent
                    )}% occupied`
            },

            {
                label:
                    "Critical-Care Beds",

                value:
                    `${formatNumber(
                        report.capacity.occupiedCriticalCareBeds
                    )} / ${formatNumber(
                        report.capacity.staffedCriticalCareBeds
                    )}`,

                detail:
                    `${formatNumber(
                        report.capacity.criticalOccupancyPercent
                    )}% occupied`
            },

            {
                label:
                    "Known Direct Admissions - Next 4 Hours",

                value:
                    formatNumber(
                        report.capacity.knownDirectAdmissions4h
                    ),

                detail:
                    "Known acute-care demand"
            },

            {
                label:
                    "Known Surgical/Procedural Admissions - Next 4 Hours",

                value:
                    formatNumber(
                        report.capacity.knownSurgicalAdmissions4h
                    ),

                detail:
                    "Known acute-care demand"
            },

            {
                label:
                    "Expected Additional ED Admissions - Next 4 Hours",

                value:
                    formatNumber(
                        report.capacity.expectedAdditionalEDAdmissions4h
                    ),

                detail:
                    "Historical forecast"
            },

            {
                label:
                    "Expected Inpatient Departures - Next 4 Hours",

                value:
                    formatNumber(
                        report.capacity.expectedInpatientDepartures4h
                    ),

                detail:
                    "Historical forecast"
            },

            {
                label:
                    "Projected Available Acute-Care Beds",

                value:
                    formatBedAvailability(
                        report.capacity.projectedAvailableAcuteCareBeds
                    ),

                detail:
                    createProjectedCapacityDescription(
                        report.capacity.projectedAvailableAcuteCareBeds
                    )
            }

        ]

    );


    renderSectionHeading(

        document,

        "Clinical Acuity",

        "Emergency Severity Index Distribution"

    );


    renderMetricGrid(

        document,

        [

            {
                label:
                    "ESI 1",

                value:
                    formatNumber(
                        report.acuity.esi1
                    ),

                detail:
                    "Highest-acuity patients"
            },

            {
                label:
                    "ESI 2",

                value:
                    formatNumber(
                        report.acuity.esi2
                    ),

                detail:
                    "High-acuity patients"
            },

            {
                label:
                    "ESI 3-5",

                value:
                    formatNumber(
                        report.acuity.esi3to5
                    ),

                detail:
                    "Inferred remaining ED census"
            },

            {
                label:
                    "High Acuity",

                value:
                    formatNumber(
                        report.acuity.highAcuityCount
                    ),

                detail:
                    `${formatNumber(
                        report.acuity.highAcuityPercent
                    )}% of ED census`
            }

        ]

    );


    renderListSection(

        document,

        "Contributors",

        "Primary Drivers",

        report.drivers,

        "No dominant Hospital Readiness drivers were identified."

    );


    renderListSection(

        document,

        "Active Conditions",

        "Operational Triggers",

        report.triggers,

        "No operational triggers are currently active."

    );


    renderListSection(

        document,

        "Response",

        "Recommended Actions",

        report.recommendations,

        "No operational intervention is currently recommended."

    );


    renderSectionHeading(

        document,

        "Operational Interpretation",

        "Four-Hour Capacity Outlook"

    );


    ensureVerticalSpace(
        document,
        100
    );


    document
        .roundedRect(
            PAGE_MARGIN,
            document.y,
            document.page.width - PAGE_MARGIN * 2,
            78,
            8
        )
        .fill(
            LIGHT_BACKGROUND
        );


    const outlookY =
        document.y + 14;


    document
        .fillColor(
            BRAND_DARK
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            11
        )
        .text(
            report.outlook.heading,
            PAGE_MARGIN + 14,
            outlookY,
            {
                width:
                    document.page.width
                    -
                    PAGE_MARGIN * 2
                    -
                    28
            }
        );


    document
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica"
        )
        .fontSize(
            8.5
        )
        .text(
            report.outlook.description,
            PAGE_MARGIN + 14,
            document.y + 6,
            {
                width:
                    document.page.width
                    -
                    PAGE_MARGIN * 2
                    -
                    28
            }
        );


    document.y =
        outlookY + 92;


    renderFooter(
        document
    );

}


function renderHeader(

    document:PDFKit.PDFDocument,

    report:ExecutiveReportPayload

):void {

    document
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            8
        )
        .text(
            "HOSPITAL READINESS INDEX"
        );


    document
        .moveDown(
            0.3
        )
        .fillColor(
            BRAND_DARK
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            22
        )
        .text(
            "Executive Assessment Report"
        );


    document
        .moveDown(
            0.25
        )
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica"
        )
        .fontSize(
            8.5
        )
        .text(
            `Assessment completed ${formatDateTime(
                report.assessmentTimestamp
            )}`
        );


    document
        .text(
            `Report generated ${formatDateTime(
                report.generatedTimestamp
            )}`
        );


    document.moveDown(
        1
    );

}


function renderOperationalStatus(

    document:PDFKit.PDFDocument,

    report:ExecutiveReportPayload

):void {

    ensureVerticalSpace(
        document,
        112
    );


    const startY =
        document.y;


    const width =
        document.page.width - PAGE_MARGIN * 2;


    document
        .roundedRect(
            PAGE_MARGIN,
            startY,
            width,
            94,
            8
        )
        .fillAndStroke(
            LIGHT_BACKGROUND,
            BORDER
        );


    document
        .rect(
            PAGE_MARGIN,
            startY,
            6,
            94
        )
        .fill(
            normalizeColor(
                report.operationalColor
            )
        );


    document
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            7
        )
        .text(
            "OPERATIONAL LEVEL",
            PAGE_MARGIN + 20,
            startY + 16
        );


    document
        .fillColor(
            BRAND_DARK
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            16
        )
        .text(
            report.operationalLevel,
            PAGE_MARGIN + 20,
            startY + 29,
            {
                width:
                    230
            }
        );


    document
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            7
        )
        .text(
            "HRI SCORE",
            PAGE_MARGIN + 285,
            startY + 16
        );


    document
        .fillColor(
            BRAND_DARK
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            24
        )
        .text(
            String(
                Math.round(
                    report.hriScore
                )
            ),
            PAGE_MARGIN + 285,
            startY + 29
        );


    document
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica"
        )
        .fontSize(
            8
        )
        .text(
            `Trend: ${report.riskDirection}`,
            PAGE_MARGIN + 365,
            startY + 22
        )
        .text(
            `Confidence: ${report.confidence}`,
            PAGE_MARGIN + 365,
            startY + 38
        )
        .text(
            `Active triggers: ${report.activeTriggerCount}`,
            PAGE_MARGIN + 365,
            startY + 54
        )
        .text(
            `Priority actions: ${report.priorityActionCount}`,
            PAGE_MARGIN + 365,
            startY + 70
        );


    document.y =
        startY + 110;

}


function renderSectionHeading(

    document:PDFKit.PDFDocument,

    eyebrow:string,

    heading:string

):void {

    ensureVerticalSpace(
        document,
        55
    );


    document
        .moveDown(
            0.4
        )
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            7
        )
        .text(
            eyebrow.toUpperCase()
        );


    document
        .moveDown(
            0.2
        )
        .fillColor(
            BRAND_DARK
        )
        .font(
            "Helvetica-Bold"
        )
        .fontSize(
            13
        )
        .text(
            heading
        );


    document.moveDown(
        0.6
    );

}


function renderMetricGrid(

    document:PDFKit.PDFDocument,

    metrics:Array<{

        label:string;

        value:string;

        detail:string;

    }>

):void {

    const availableWidth =
        document.page.width - PAGE_MARGIN * 2;


    const gap =
        8;


    const columnWidth =
        (
            availableWidth - gap * 2
        ) / 3;


    for(
        let index = 0;
        index < metrics.length;
        index += 3
    ){

        const row =
            metrics.slice(
                index,
                index + 3
            );


        ensureVerticalSpace(
            document,
            84
        );


        const rowY =
            document.y;


        row.forEach(

            (
                metric,
                columnIndex
            ) => {

                const x =
                    PAGE_MARGIN
                    +
                    columnIndex
                    *
                    (
                        columnWidth + gap
                    );


                document
                    .roundedRect(
                        x,
                        rowY,
                        columnWidth,
                        68,
                        6
                    )
                    .fillAndStroke(
                        WHITE,
                        BORDER
                    );


                document
                    .fillColor(
                        BRAND_MUTED
                    )
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(
                        6.5
                    )
                    .text(
                        metric.label,
                        x + 10,
                        rowY + 9,
                        {
                            width:
                                columnWidth - 20
                        }
                    );


                document
                    .fillColor(
                        BRAND_DARK
                    )
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(
                        13
                    )
                    .text(
                        metric.value,
                        x + 10,
                        rowY + 25,
                        {
                            width:
                                columnWidth - 20
                        }
                    );


                document
                    .fillColor(
                        BRAND_MUTED
                    )
                    .font(
                        "Helvetica"
                    )
                    .fontSize(
                        6.5
                    )
                    .text(
                        metric.detail,
                        x + 10,
                        rowY + 45,
                        {
                            width:
                                columnWidth - 20,
                            height:
                                17
                        }
                    );

            }

        );


        document.y =
            rowY + 78;

    }

}


function renderListSection(

    document:PDFKit.PDFDocument,

    eyebrow:string,

    heading:string,

    items:ExecutiveReportListItem[],

    emptyMessage:string

):void {

    renderSectionHeading(
        document,
        eyebrow,
        heading
    );


    if(items.length === 0){

        document
            .fillColor(
                BRAND_MUTED
            )
            .font(
                "Helvetica"
            )
            .fontSize(
                8.5
            )
            .text(
                emptyMessage
            );


        document.moveDown(
            0.7
        );


        return;

    }


    for(const item of items){

        ensureVerticalSpace(
            document,
            62
        );


        const startY =
            document.y;


        document
            .fillColor(
                BRAND_DARK
            )
            .font(
                "Helvetica-Bold"
            )
            .fontSize(
                9
            )
            .text(
                item.title,
                PAGE_MARGIN,
                startY,
                {
                    width:
                        365
                }
            );


        document
            .fillColor(
                BRAND_MUTED
            )
            .font(
                "Helvetica"
            )
            .fontSize(
                7.5
            )
            .text(
                item.description,
                PAGE_MARGIN,
                document.y + 3,
                {
                    width:
                        420
                }
            );


        document
            .fillColor(
                BRAND_MUTED
            )
            .font(
                "Helvetica-Bold"
            )
            .fontSize(
                7
            )
            .text(
                item.label,
                document.page.width - PAGE_MARGIN - 100,
                startY,
                {
                    width:
                        100,
                    align:
                        "right"
                }
            );


        document.moveDown(
            0.7
        );


        document
            .moveTo(
                PAGE_MARGIN,
                document.y
            )
            .lineTo(
                document.page.width - PAGE_MARGIN,
                document.y
            )
            .strokeColor(
                BORDER
            )
            .stroke();


        document.moveDown(
            0.7
        );

    }

}


function renderFooter(

    document:PDFKit.PDFDocument

):void {

    ensureVerticalSpace(
        document,
        65
    );


    document
        .moveDown(
            0.5
        )
        .strokeColor(
            BORDER
        )
        .moveTo(
            PAGE_MARGIN,
            document.y
        )
        .lineTo(
            document.page.width - PAGE_MARGIN,
            document.y
        )
        .stroke();


    document
        .moveDown(
            0.7
        )
        .fillColor(
            BRAND_MUTED
        )
        .font(
            "Helvetica"
        )
        .fontSize(
            7
        )
        .text(
            "The Hospital Readiness Index is an operational decision-support tool. Results should be interpreted with clinical and administrative judgment and local surge policies."
        );

}


function ensureVerticalSpace(

    document:PDFKit.PDFDocument,

    requiredHeight:number

):void {

    const availableBottom =

        document.page.height
        -
        PAGE_MARGIN;


    if(
        document.y + requiredHeight
        >
        availableBottom
    ){

        document.addPage();

    }

}


function formatDateTime(

    value:string

):string {

    const date =
        new Date(
            value
        );


    if(Number.isNaN(date.getTime())){

        return "Unavailable";

    }


    return date.toLocaleString(

        "en-US",

        {

            month:
                "short",

            day:
                "numeric",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit",

            timeZoneName:
                "short"

        }

    );

}


function formatNumber(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(Number.isInteger(value)){

        return String(
            value
        );

    }


    return value
        .toFixed(
            1
        )
        .replace(
            /\.0$/,
            ""
        );

}


function formatBedAvailability(

    value:number

):string {

    if(!Number.isFinite(value)){

        return "--";

    }


    if(value < 0){

        return `${formatNumber(
            value
        )} beds (deficit)`;

    }


    if(value === 1){

        return "1 bed";

    }


    return `${formatNumber(
        value
    )} beds`;

}


function createProjectedCapacityDescription(

    value:number

):string {

    if(value < 0){

        return `Demand exceeds staffed capacity by approximately ${formatNumber(
            Math.abs(
                value
            )
        )} beds`;

    }


    if(value === 0){

        return "Projected flow fully utilizes staffed capacity";

    }


    return `${formatNumber(
        value
    )} staffed beds projected to remain available`;

}


function normalizeColor(

    value:string

):string {

    if(
        /^#[0-9a-f]{6}$/i.test(
            value
        )
    ){

        return value;

    }


    return BRAND_DARK;

}