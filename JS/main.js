import {setupColorsListe, setupImagesListe, setup_listeners, setup_nwa_image_list} from "./setup.js"
import {calculator, calculator_connected, connect_upload, setConnectedTo} from "./numworks_manager.js"

//copy of original console
const originalLog = console.log;

function log_function(...args){
    originalLog.apply(console, args);

    const message = args.map(arg => {
        try {
            return typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg);
        } catch {
            return String(arg);
        }
    }).join(" ");

    const consoleDiv = document.getElementById("console");
    if (consoleDiv) {
        const line = document.createElement("div");
        line.textContent = message;
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }
}

//setup deconection event
navigator.usb.addEventListener("disconnect", function(e) {
console.log("Disconnected");
  calculator.onUnexpectedDisconnect(e, function() {
    setConnectedTo(false);
    document.getElementById("connect_upload_btn").innerHTML = "Connect";
    document.getElementById("delete_btn").style.visibility = "hidden";
  });
});

//reaffectation of console.log
console.log = log_function;

//setup auto-connection event
calculator.autoConnect(calculator_connected);

//setup rest of html
setupColorsListe();
setupImagesListe();

//setup listeners
setup_listeners();