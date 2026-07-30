import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Dashboard, initializeDashboard } from "./Dashboard";


export function App() {


    setTimeout(()=>{


        initializeDashboard();


    },0);



    return `


        ${Header()}


        <div class="main-layout">


            ${Sidebar()}


            ${Dashboard()}


        </div>


    `;


}