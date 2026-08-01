/**
 * TrendChart
 *
 * Displays persistent EDORI operational history.
 *
 * Important behavior:
 *
 * - Does not calculate EDORI.
 * - Does not create snapshots.
 * - Reads snapshots already saved after the user
 *   selects Calculate EDORI.
 * - Refreshes only when a completed result is published.
 */


import {

    APP_EVENTS

}

from "../config/appEvents";

import {

    Chart,

    LineController,

    LineElement,

    PointElement,

    LinearScale,

    CategoryScale,

    Tooltip,

    Legend

}

from "chart.js";


import {

    subscribe

}

from "../services/EventService";


import {

    getTrendHistory

}

from "../services/TrendService";


interface TrendPoint {

    timestamp:Date;

    score:number;

}


let chart:Chart | null = null;

let chartRegistered = false;


/**
 * Render the trend panel.
 */
export function TrendChart():string {

    return `

        <section class="trend-container">

            <div class="panel-header">

                <div>

                    <h3>
                        EDORI Trend
                    </h3>

                    <p class="panel-description">
                        Submitted EDORI assessments over time
                    </p>

                </div>

            </div>


            <div class="trend-chart-wrapper">

                <canvas
                    id="edoriTrendChart"
                    aria-label="EDORI score trend chart"
                    role="img"
                >
                </canvas>

            </div>


            <div
                id="trend-summary"
                class="trend-summary"
                aria-live="polite"
            >

                No EDORI assessments recorded.

            </div>

        </section>

    `;

}


/**
 * Initialize Chart.js and subscribe to completed
 * EDORI result updates.
 */
export function initializeTrendChart():void {

    registerChartComponents();

    updateTrend();


    subscribe(

    APP_EVENTS.RESULT_CHANGED,

    updateTrend

);

}


/**
 * Register required Chart.js components once.
 */
function registerChartComponents():void {

    if(chartRegistered){

        return;

    }


    Chart.register(

        LineController,

        LineElement,

        PointElement,

        LinearScale,

        CategoryScale,

        Tooltip,

        Legend

    );


    chartRegistered = true;

}


/**
 * Refresh the chart using saved snapshots.
 *
 * No EDORI calculation occurs here.
 */
function updateTrend():void {

    renderChart();

}


/**
 * Draw or redraw the trend chart.
 */
function renderChart():void {

    const canvas = document.getElementById(

        "edoriTrendChart"

    ) as HTMLCanvasElement | null;


    if(!canvas){

        return;

    }


    const history = getTrendHistory();


    destroyExistingChart();


    if(history.length === 0){

        clearCanvas(

            canvas

        );


        updateTrendSummary(

            history

        );


        return;

    }


    const labels = history.map(

        point => formatTimestamp(

            point.timestamp

        )

    );


    const values = history.map(

        point => Math.round(

            point.score

        )

    );


    chart = new Chart(

        canvas,

        {

            type:"line",

            data:{

                labels,

                datasets:[

                    {

                        label:"EDORI Score",

                        data:values,

                        borderWidth:3,

                        pointRadius:5,

                        pointHoverRadius:7,

                        tension:0.25,

                        fill:false

                    }

                ]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                animation:{

                    duration:250

                },

                interaction:{

                    intersect:false,

                    mode:"index"

                },

                scales:{

                    x:{

                        title:{

                            display:true,

                            text:"Assessment Time"

                        },

                        ticks:{

                            maxRotation:45,

                            minRotation:0

                        }

                    },

                    y:{

                        min:0,

                        max:100,

                        title:{

                            display:true,

                            text:"EDORI Score"

                        },

                        ticks:{

                            stepSize:20

                        }

                    }

                },

                plugins:{

                    legend:{

                        display:true,

                        position:"bottom"

                    },

                    tooltip:{

                        callbacks:{

                            label:(context) => {

                                const value =

                                    context.parsed.y;


                                return `EDORI Score: ${value}`;

                            }

                        }

                    }

                }

            }

        }

    );


    updateTrendSummary(

        history

    );

}


/**
 * Destroy the previous Chart.js instance.
 */
function destroyExistingChart():void {

    if(!chart){

        return;

    }


    chart.destroy();

    chart = null;

}


/**
 * Update the text summary beneath the chart.
 */
function updateTrendSummary(

    history:TrendPoint[]

):void {

    const container = document.getElementById(

        "trend-summary"

    );


    if(!container){

        return;

    }


    if(history.length === 0){

        container.textContent =

            "No EDORI assessments recorded.";

        return;

    }


    const current = history[

        history.length - 1

    ];


    if(history.length === 1){

        container.textContent =

            `Current Score: ${Math.round(current.score)} | One submitted assessment`;

        return;

    }


    const previous = history[

        history.length - 2

    ];


    const difference = Math.round(

        current.score -

        previous.score

    );


    container.textContent =

        `Current Score: ${Math.round(current.score)} | Trend: ${getTrendDirection(difference)} (${formatDifference(difference)})`;

}


/**
 * Determine trend direction.
 */
function getTrendDirection(

    difference:number

):string {

    if(difference > 0){

        return "Increasing";

    }


    if(difference < 0){

        return "Improving";

    }


    return "Stable";

}


/**
 * Format score change.
 */
function formatDifference(

    difference:number

):string {

    if(difference > 0){

        return `+${difference}`;

    }


    return String(

        difference

    );

}


/**
 * Format a timestamp for the chart axis.
 */
function formatTimestamp(

    timestamp:Date

):string {

    const date = timestamp instanceof Date

        ? timestamp

        : new Date(

            timestamp

        );


    if(Number.isNaN(date.getTime())){

        return "Unknown";

    }


    return date.toLocaleTimeString(

        [],

        {

            hour:"2-digit",

            minute:"2-digit"

        }

    );

}


/**
 * Clear chart pixels when there is no history.
 */
function clearCanvas(

    canvas:HTMLCanvasElement

):void {

    const context = canvas.getContext(

        "2d"

    );


    if(!context){

        return;

    }


    context.clearRect(

        0,

        0,

        canvas.width,

        canvas.height

    );

}