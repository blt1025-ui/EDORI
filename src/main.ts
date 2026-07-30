import "./style.css";

import { App } from "./components/App";


const appElement = document.getElementById("app");


if(!appElement){

    throw new Error(
        "Application root element (#app) not found."
    );

}


appElement.innerHTML = App();