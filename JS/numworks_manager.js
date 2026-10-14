import Numworks from "upsilon.js";
import {icons_offsets, icons_data, icons_size, nwa_data_images} from "./data.js";
import {makeBinary, makeBackgroundBuffer, makeImageBuffer, makeNWAImageBuffer} from "./binary.js";

//create calculator instance for usb
export var calculator = new Numworks();

//variable to know if the calculator is connected
export var is_connected = false;

// INTERNAL FUNCTIONS
const MAGIC = 0xEE0BDDBA;
const uint32Size = 4;
const nameSize = 16;
const flagSize = 1;

function getPadingForBufferSize(bufferSize){
    return (4 - (bufferSize % 4)) % 4;
}

async function getInternal(){
    if(is_connected){
        //read storage
        let pinfo = await calculator.getPlatformInfo();
        const startFlash = pinfo.external.flashStart + 327680;
        const endFlash = pinfo.external.flashEnd;
        const flashSize = endFlash - startFlash;

        console.log("Reading internal storage");

        let blobStorage = await calculator.__retrieveStorage(startFlash, flashSize, pinfo.version);
        
        console.log("Finding and cleaning files in storage")

        const storageArrayBuffer = await blobStorage.arrayBuffer();
        const dataView = new DataView(storageArrayBuffer);

        let internalStorage = [];

        let adress = startFlash;
        const minHeaderSize = uint32Size * 2 + nameSize + flagSize;

        let internalTotalSize = flashSize;
        let internalTotalDirtySize = 0;

        while (adress + minHeaderSize < endFlash){
            let view_pos = adress - startFlash;

            if (view_pos + minHeaderSize > storageArrayBuffer.byteLength) {
                break;
            }

            let magic = dataView.getUint32(view_pos, true);
            let current_buffer_size = dataView.getUint32(view_pos + uint32Size, true);
            let flag = dataView.getUint8(view_pos + uint32Size * 2 + nameSize);

            if (magic != MAGIC){
                break;
            }

            if (flag != 0xFF){
                let record_size = uint32Size * 2 + nameSize + 4 + current_buffer_size + getPadingForBufferSize(current_buffer_size);
                
                internalTotalDirtySize += record_size;
                adress += record_size;
                continue;
            }

            if (adress + (uint32Size * 2) + nameSize + 4 + current_buffer_size 
                + getPadingForBufferSize(current_buffer_size) > endFlash) {
                break;
            }

            let nameBytes = new Uint8Array(storageArrayBuffer, view_pos + uint32Size * 2, nameSize);
            let fileName = new TextDecoder().decode(nameBytes).replace(/\0/g, '');

            console.log("Finding file : " + fileName);
            
            let contentOffset = view_pos + uint32Size * 2 + nameSize + 4;
            let actualSize = current_buffer_size;

            const firstByte = dataView.getUint8(contentOffset);
            if (firstByte === 0x01) {
                contentOffset += 1;
                actualSize -= 1;
            }

            if (actualSize > 0) {
                const lastByte = dataView.getUint8(contentOffset + actualSize - 1);
                if (lastByte === 0x00 || lastByte === 0xFF) {
                    actualSize -= 1;
                }
            }

            const fileBuffer = storageArrayBuffer.slice(contentOffset, contentOffset + actualSize);

            let record_size = (uint32Size * 2) + nameSize + 4 + current_buffer_size + getPadingForBufferSize(current_buffer_size);

            internalStorage.push([fileName, new Blob([fileBuffer], { type: "text/plain" }), record_size]);

            adress += record_size;
        }

        return internalStorage;

    }else{
        alert("You need to connect your calculator !");

        calculator.detect(function() {
            calculator_connected();
        }, function(error) {
            alert("Error : " + error);
        });
    }
}

async function uploadInternal(internalStorage){
    if(is_connected){
        if (internalStorage.length == 0){
            return;
        }

        // get numworks infos
        let pinfo = await calculator.getPlatformInfo();
        const startFlash = pinfo.external.flashStart + 327680;
        const endFlash = pinfo.external.flashEnd;
        const flashSize = endFlash - startFlash;

        //make buffer
        console.log("Create buffer storage");

        const combinedBuffer = new Uint8Array(flashSize);
        combinedBuffer.fill(0xFF);

        const encoder = new TextEncoder();

        let position = 0;

        for (const data of internalStorage) {
            const name = data[0];
            const blob = data[1];
            const buffer_size = (uint32Size * 2) + nameSize + 4;
            const buffer = new Uint8Array(buffer_size);
            buffer.fill(0xFF);

            const nameOffset = uint32Size * 2;
            buffer.subarray(nameOffset, nameOffset + nameSize).fill(0x00);

            const view = new DataView(buffer.buffer);

            view.setUint32(0, MAGIC, true);

            view.setUint32(uint32Size, blob.size, true);

            const encodedName = encoder.encode(name);
            buffer.set(encodedName.subarray(0, nameSize-1), uint32Size * 2);

            const arrayBuffer = await blob.arrayBuffer();
            const fileContent = new Uint8Array(arrayBuffer);

            combinedBuffer.set(buffer, position);
            combinedBuffer.set(fileContent, position + buffer_size);

            const padding = getPadingForBufferSize(blob.size);
            position += buffer_size + blob.size + padding;

        };

        //upload storage
        console.log("Upload buffer storage");

        try {
            await calculator.__flashStorage(startFlash, combinedBuffer.buffer, pinfo.version);
            console.log("Files installed successfully");
        } catch (err) {
            console.error("Flashing error:", err);
            alert("Error during synchronization: " + err.message);
        }

    }else{
        alert("You need to connect your calculator !");

        calculator.detect(function() {
            calculator_connected();
        }, function(error) {
            alert("Error : " + error);
        });
    }
}

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

        // install custom nwa images
        if (document.getElementById("customImageCheck") && document.getElementById("customNWAImageCheck")){
            let storage_internal = await getInternal();

            // remove file that already exist
            Object.keys(nwa_data_images).forEach(function(imageName) {
                let max = (imageName.length < 12) ? imageName.length : 12;
                let targetName = imageName.slice(0, max) + ".ci";
                
                storage_internal = storage_internal.filter(data => data[0] !== targetName);
            });

            // create all records
            Object.keys(nwa_data_images).forEach(function(imageName) {
                if (nwa_data_images[imageName] !== null){
                    let max = (imageName.length < 12) ? imageName.length : 12;
                    let buff = makeNWAImageBuffer(nwa_data_images[imageName])
                    let record_size = uint32Size * 2 + nameSize + 4 + (55*56*2)+2 + getPadingForBufferSize((55*56*2)+2);
                    storage_internal.push([imageName.slice(0, max) + ".ci", new Blob([buff], { type: "text/plain" }), record_size]);
                }
            });

            // upload new files
            await uploadInternal(storage_internal);
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

export async function getNWABufferOfOtherSlot(){
    let pinfo = await calculator.getPlatformInfo();
    let model_num = calculator.getModel();
    let header_adress;
    if (pinfo.external.startFlash < 0x90400000) {  // slotA detected, so we go to slot b
        console.log("Slot A detected")
        if (model_num == "0120"){
            console.log("model 0120")
            header_adress = 0x90420000;
        }else {
            header_adress = 0x90410000;
        }
    }else {  // slotB
        console.log("Slot B detected")
        if (model_num == "0120"){
            console.log("model 0120")
            header_adress = 0x90020000;
        }else {
            header_adress = 0x90010000;
        }
    }
    let size_to_read;
    if (pinfo.version > "22.0.0"){
        size_to_read = 0x30;
    } else{
        size_to_read = 0x28;
    }

    let blobStorage = await calculator.__retrieveStorage(header_adress, size_to_read, pinfo.version);
    const storageArrayBuffer = await blobStorage.arrayBuffer();
    const dataView = new DataView(storageArrayBuffer);

    let start_addr = dataView.getUint32(0x14, true);
    let end_addr = dataView.getUint32(0x18, true);

    console.log("External apps adresses : 0x" + start_addr.toString(16).toUpperCase() + " and 0x" + end_addr.toString(16).toUpperCase());

    return [start_addr, end_addr]
}

export async function getNWABuffer(start, size){
    let pinfo = await calculator.getPlatformInfo();
    let blobStorage = await calculator.__retrieveStorage(start, size, pinfo.version);
    return blobStorage
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