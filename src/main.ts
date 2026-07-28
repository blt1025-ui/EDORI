import './styles/style.css';

import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `

${Header()}

<div class="main-layout">

    ${Sidebar()}

    ${Dashboard()}

</div>

`;