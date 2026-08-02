import Numworks from "upsilon.js";
import {icons_offsets, icons_data, icons_size} from "./data.js";
import {makeBinary, makeBackgroundBuffer, makeImageBuffer} from "./binary.js";

//create calculator instance for usb
export var calculator = new Numworks();

//variable to know if the calculator is connected
export var is_connected = false;

//upload function
export async function upload_on_calculator(){
    try {
        console.log("Reading storage");
        var storage = await calculator.backupStorage();

        //check if there is already a theme loaded
        for (var i in storage.records) {
            var record = storage.records[i];
            var name = record.name + "." + record.type;
            if (name=="profil.theme"){
                console.log("Removing old theme");
                storage.records.splice(i, 1);
            }
        }
        
        const binary = makeBinary();
        const dataBlob = new Blob([binary], { type: "application/octet-stream" });

        storage.records.push({
            "name": "profil", 
            "type": "theme", 
            "autoImport": false, 
            "data": dataBlob
        });

        await calculator.installStorage(storage, function() {
            console.log("Theme file installed")
        });

        //installing customs images
        const keys = Object.keys(icons_size);
        const lastKey = keys[keys.length - 1];
        const last_image_size = icons_size[lastKey];
        const imgSizeWithHeader = (last_image_size[0] * last_image_size[1] * 2) + 2; 
        const minOffset = Math.min(...Object.values(icons_offsets));
        
        const maxOffset = Math.max(...Object.values(icons_offsets));
        const totalSizeCustom = (maxOffset - minOffset) + imgSizeWithHeader;
        const totalSize = totalSizeCustom + 153600

        const combinedBuffer = new Uint8Array(totalSize);

        if(document.getElementById("haveImageBackground").checked){
            let backgroundData = new Uint8Array(makeBackgroundBuffer());
            combinedBuffer.set(backgroundData, 0);
        }

        if(document.getElementById("customImageCheck").checked){
            Object.keys(icons_data).forEach(function(imageName) {
                let imgData = new Uint8Array(makeImageBuffer(imageName));
                combinedBuffer.set(imgData, icons_offsets[imageName]);
            });
        }

        if (document.getElementById("customImageCheck").checked || document.getElementById("haveImageBackground").checked){
            let pinfo = await calculator.getPlatformInfo();
            const startFlash = pinfo.external.flashStart;
            await calculator.__flashStorage(startFlash, combinedBuffer.buffer, pinfo.version);
            console.log("Customs data installed");
        }

        alert("Theme successfully installed !");
    } catch (error) {
        console.error("Error during upload :", error);
        alert("Error : " + error.message);
    }
}

//deleting function
export async function delete_on_calculator(){
    try {
        console.log("Reading storage");
        var storage = await calculator.backupStorage();

        //check if there is already a theme loaded
        for (var i in storage.records) {
            var record = storage.records[i];
            var name = record.name + "." + record.type;
            if (name=="profil.theme"){
                console.log("Removing theme");
                storage.records.splice(i, 1);
            }
        }

        await calculator.installStorage(storage, function() {
            alert("Theme successfully removed !");
        });
    } catch (error) {
        console.error("Error during upload :", error);
        alert("Error : " + error.message);
    }
}

//event when calculator is connected
export function calculator_connected(){
    console.log("Connected");
    is_connected = true;
    document.getElementById("connect_upload_btn").innerHTML = "Upload";
    document.getElementById("delete_btn").style.visibility = "visible";
    calculator.stopAutoConnect();
}

//event to connect calculator manuely or to upload on the calculator
export function connect_upload() {
    if(is_connected){
        upload_on_calculator()
    }else{
        calculator.detect(function() {
            calculator_connected();
        }, function(error) {
            console.error("Erreur de connexion :", error);
            alert("Erreur : " + error);
        });
    }
}

export function setConnectedTo(boolean){
    is_connected = boolean
}