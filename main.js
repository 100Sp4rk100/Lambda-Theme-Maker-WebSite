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

//make the binary file for download
function makeBinary(){
const keys = Object.keys(palette);
    const buffer = new ArrayBuffer(keys.length * 2);

    const view = new DataView(buffer);

    keys.forEach(function(colorName, index) {
        const hexVal = palette[colorName];
        const rgb565 = hex_to_rgb565(hexVal);
        
        view.setUint16(index * 2, rgb565, true);
    });

    return buffer;
}

//download the binary
function download_binary(){
    const fileBlob = new Blob([makeBinary()], { type: "application/octet-stream" });
    const url = URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profil.theme';
    a.click();
    URL.revokeObjectURL(url);
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

//event when calculator is connected
function calculator_connected(){
    console.log("Connected");
    is_connected = true;
    document.getElementById("connect_upload_btn").innerHTML = "Upload"
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
    document.getElementById("connect_upload_btn").innerHTML = "Connect"
  });
});

//setup auto-connection event
calculator.autoConnect(calculator_connected);

setupColorsListe();
document.getElementById("download_btn").addEventListener("click", download_binary);
document.getElementById("connect_upload_btn").addEventListener("click", connect_upload);