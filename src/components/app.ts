import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";

export function App() {

    return `

        ${Header()}

        <div class="main-layout">

            ${Sidebar()}

            ${Dashboard()}

        </div>

    `;

}