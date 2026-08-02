/**
 * CollapsiblePanel
 *
 * Reusable wrapper for right-column dashboard
 * components.
 *
 * Uses the native HTML details element for:
 *
 * - Click-to-expand behavior
 * - Keyboard accessibility
 * - Native open and closed states
 */

export interface CollapsiblePanelOptions {

    /**
     * Unique HTML identifier.
     */
    id:string;


    /**
     * User-facing panel title.
     */
    title:string;


    /**
     * Short explanation shown while collapsed.
     */
    description:string;


    /**
     * Fully rendered component markup.
     */
    content:string;


    /**
     * Whether the panel starts expanded.
     */
    initiallyOpen?:boolean;

}


/**
 * Render one collapsible dashboard panel.
 */
export function CollapsiblePanel(

    options:CollapsiblePanelOptions

):string {

    const openAttribute = options.initiallyOpen

        ? "open"

        : "";


    return `

        <details
            id="${escapeAttribute(options.id)}"
            class="dashboard-collapsible-panel"
            ${openAttribute}
        >

            <summary class="dashboard-collapsible-summary">

                <div class="dashboard-collapsible-summary-text">

                    <strong>

                        ${escapeHtml(
                            options.title
                        )}

                    </strong>


                    <span>

                        ${escapeHtml(
                            options.description
                        )}

                    </span>

                </div>


                <span
                    class="dashboard-collapsible-icon"
                    aria-hidden="true"
                >
                </span>

            </summary>


            <div class="dashboard-collapsible-content">

                ${options.content}

            </div>

        </details>

    `;

}


/**
 * Escape text inserted into HTML.
 */
function escapeHtml(

    value:string

):string {

    return value

        .replaceAll(

            "&",

            "&amp;"

        )

        .replaceAll(

            "<",

            "&lt;"

        )

        .replaceAll(

            ">",

            "&gt;"

        )

        .replaceAll(

            "\"",

            "&quot;"

        )

        .replaceAll(

            "'",

            "&#039;"

        );

}


/**
 * Escape text inserted into an HTML attribute.
 */
function escapeAttribute(

    value:string

):string {

    return escapeHtml(

        value

    );

}