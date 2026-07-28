import './styles/style.css';

import { Header } from "./components/Header";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `

${Header()}

`;