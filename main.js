import Numworks from "upsilon.js"

//palette with all colors
const palette = {
    "YellowDark": 0xffb734,
    "YellowLight": 0xffcc7b,
    "PurpleBright": 0x656975,
    "PurpleDark": 0x414147,
    "GrayWhite": 0xf5f5f5,
    "GrayBright": 0xececec,
    "GrayMiddle": 0xd9d9d9,
    "GrayDarkMiddle": 0xb8bbc5,
    "GrayDark": 0xa7a7a7,
    "GrayVeryDark": 0x8c8c8c,
    "GrayDarkest": 0x333333,
    "Select": 0xd4d7e0,
    "SelectDark": 0xb0b8d8,
    "WallScreen": 0xf7f9fa,
    "WallScreenDark": 0xe0e6ed,
    "PopUpTitleBackground": 0x696475,
    "LowBattery": 0xf30211,
    "Red": 0xff000c,
    "RedLight": 0xffcccc,
    "Magenta": 0xff0588,
    "Turquoise": 0x60c1ec,
    "Pink": 0xffabb6,
    "Blue": 0x5075f2,
    "BlueLight": 0xdce3fd,
    "Orange": 0xfe871f,
    "Green": 0x50c102,
    "GreenLight": 0xdcf3cc,
    "Brown": 0x8d7350,
    "Purple": 0x6e2d79,
    "BlueishGray": 0x919ea4,
    "Cyan": 0x00ffff,
    "KDColorBlack": 0x000000,
    "KDColorWhite": 0xFFFFFF,
    "KDColorRed": 0xFF0000,
    "KDColorGreen": 0x00FF00,
    "KDColorBlue": 0x0000FF,
    "KDColorYellow": 0xFFFF00,
    "KDColorOrange": 0xFF9900,
    "KDColorPurple": 0xFF00DD,
    "TextHillightColor": 0xFFFFFF,
    "TextColor": 0x000000,
    "BackgroundColor": 0xFFFFFF,
    "BackgroundColorHilight": 0xffb734
};

//create calculator instance for usb
var calculator = new Numworks();

//variable to know if the calculator is connected
var is_connected = false;

//convert hexadecimal to compatible format
function toHex(num) {
    return "#" + num.toString(16).padStart(6, '0');
}

//convert hexadecimal to 565
function hex_to_rgb565(hex_val){
    var r = (hex_val >> 16) & 0xFF;
    var g = (hex_val >> 8) & 0xFF;
    var b = hex_val & 0xFF;
    
    var r5 = (r >> 3) & 0x1F;
    var g6 = (g >> 2) & 0x3F;
    var b5 = (b >> 3) & 0x1F;
    
    return (r5 << 11) | (g6 << 5) | b5;
}

//add all color picker to the view
function setupColorsListe() {
    const list_colors = document.getElementById("colors");
    
    if (!list_colors) return;

    Object.keys(palette).forEach(function(colorName) {
        const container = document.createElement("div");

        const picker = document.createElement("input");
        picker.type = "color";
        picker.id = colorName;
        picker.value = toHex(palette[colorName]);
        picker.addEventListener("input", (e)=>{
            //modify directly the list
            palette[e.target.id] = parseInt(e.target.value.replace("#", ""), 16);
        })

        const name = document.createElement("span");
        name.textContent = colorName;

        container.appendChild(picker);
        container.appendChild(name);
        list_colors.appendChild(container);
    });
}

//setup background liste
function setupBackgroundList(){
    const list_backgrounds = document.getElementById("background");
    for (let index = 1; index <= 4; index++) {
        let option = document.createElement("option");
        option.innerHTML = index;
        list_backgrounds.append(option);
    }
}

//make the binary file for download
function makeBinary(){
const keys = Object.keys(palette);
    const buffer = new ArrayBuffer(keys.length * 2 + 10);

    const view = new DataView(buffer);

    keys.forEach(function(colorName, index) {
        const hexVal = palette[colorName];
        const rgb565 = hex_to_rgb565(hexVal);
        
        view.setUint16(index * 2, rgb565, true);
    });

    //get meta data
    var square_icon;
    var is_background;
    var icon_profil;
    var background = 0;
    var dynamic_image;

    if (document.getElementById("squareIcon").checked)square_icon = 1;
    else square_icon = 0;

    if (document.getElementById("dynamicImage").checked)dynamic_image = 0;
    else dynamic_image = 1;

    if (document.getElementById("haveBackground").checked){
        is_background = 0;
        background = parseInt(document.getElementById("background").value)-1;
    }
    else{
        is_background = 1;
    }

    if (document.getElementById("iconProfil").value == "epsilon" || dynamic_image == 1)icon_profil = 1;
    else icon_profil = 0;

    const startOfMetadata = keys.length * 2;
    view.setUint16(startOfMetadata, square_icon, true);
    view.setUint16(startOfMetadata + 2, is_background, true);
    view.setUint16(startOfMetadata + 4, background, true);
    view.setUint16(startOfMetadata + 6, icon_profil, true);
    view.setUint16(startOfMetadata + 8, dynamic_image, true);

    return buffer;
}

//download the theme
function download_theme(){
    const dataToSave = {
        palette: palette,
        settings: {
            isSquareIcon: document.getElementById("squareIcon").checked,
            isBackground: document.getElementById("haveBackground").checked,
            background: document.getElementById("background").value,
            iconProfil: document.getElementById("iconProfil").value,
            dynamic_image: document.getElementById("dynamicImage").checked
        }
    };

    const jsonString = JSON.stringify(dataToSave, null, 4);
    
    const fileBlob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profil.json';
    a.click();
    URL.revokeObjectURL(url);
}

//import the theme
function import_theme(){
    var fr = new FileReader();
    var json;
    fr.onload = function() {
        json = JSON.parse(fr.result);
        Object.keys(palette).forEach(function(colorName) {
            palette[colorName] = json["palette"][colorName];
            document.getElementById(colorName).value = toHex(palette[colorName]);
        });
        document.getElementById("squareIcon").checked = json["settings"]["isSquareIcon"];
        document.getElementById("haveBackground").checked = json["settings"]["isBackground"];
        document.getElementById("background").value = json["settings"]["background"];
        document.getElementById("iconProfil").value = json["settings"]["iconProfil"];
        document.getElementById("dynamicImage").checked = json["settings"]["dynamic_image"];
        if(json["settings"]["dynamic_image"]) document.getElementById("iconProfil").style.visibility = "hidden";
        else document.getElementById("iconProfil").style.visibility = "visible";
        if(!json["settings"]["isBackground"]) document.getElementById("background").style.visibility = "hidden";
        else document.getElementById("background").style.visibility = "visible";
    }
    fr.readAsText(this.files[0]);
}

//upload function
async function upload_on_calculator(){
    try {
        console.log("Reading storage");
        var storage = await calculator.backupStorage();

        //check if there is already a theme loaded
        for (var i in storage.records) {
            var record = storage.records[i];
            var name = record.name + "." + record.type;
            console.log(record);
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
            alert("Theme successfully installed !");
        });
    } catch (error) {
        console.error("Eroor during upload :", error);
        alert("Error : " + error.message);
    }
}

//deleting function
async function delete_on_calculator(){
    try {
        console.log("Reading storage");
        var storage = await calculator.backupStorage();

        //check if there is already a theme loaded
        for (var i in storage.records) {
            var record = storage.records[i];
            var name = record.name + "." + record.type;
            console.log(record);
            if (name=="profil.theme"){
                console.log("Removing theme");
                storage.records.splice(i, 1);
            }
        }

        await calculator.installStorage(storage, function() {
            alert("Theme successfully removed !");
        });
    } catch (error) {
        console.error("Eroor during upload :", error);
        alert("Error : " + error.message);
    }
}

//event when calculator is connected
function calculator_connected(){
    console.log("Connected");
    is_connected = true;
    document.getElementById("connect_upload_btn").innerHTML = "Upload";
    document.getElementById("delete_btn").style.visibility = "visible";
    calculator.stopAutoConnect();
}

//event to connect calculator manuely or to upload on the calculator
function connect_upload() {
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

//setup deconection event
navigator.usb.addEventListener("disconnect", function(e) {
console.log("Disconected");
  calculator.onUnexpectedDisconnect(e, function() {
    is_connected = false;
    document.getElementById("connect_upload_btn").innerHTML = "Connect";
    document.getElementById("delete_btn").style.visibility = "hidden";
  });
});

//setup auto-connection event
calculator.autoConnect(calculator_connected);

//setup rest of html
setupColorsListe();
setupBackgroundList()

//setup listeners
document.getElementById("download_btn").addEventListener("click", download_theme);
document.getElementById("import_input").addEventListener("change", import_theme);
document.getElementById("connect_upload_btn").addEventListener("click", connect_upload);
document.getElementById("delete_btn").addEventListener("click", delete_on_calculator);
document.getElementById("haveBackground").addEventListener("change", function (){
    if(document.getElementById("haveBackground").checked) document.getElementById("background").style.visibility = "visible";
    else document.getElementById("background").style.visibility = "hidden";
});
document.getElementById("dynamicImage").addEventListener("change", function (){
    if(document.getElementById("dynamicImage").checked) document.getElementById("iconProfil").style.visibility = "hidden";
    else document.getElementById("iconProfil").style.visibility = "visible";
});