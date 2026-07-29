import "./styles/style.css";

import { App } from "./components/App";

import { registerEventHandlers } from "./services/EventService";

import { updateDemand } from "./services/UpdateDemand";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = App();

registerEventHandlers();

updateHistoricalValues();

updateDemand();