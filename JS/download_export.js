import {background_img, setBackgroundImg, palette, icons_data, nwa_data_images} from "./data.js"
import {toHex} from "./utils.js"
import {add_nwa_input} from "./setup.js"

//download the theme
export function download_theme(){
    const dataToSave = {
        palette: palette,
        settings: {
            isSquareIcon: document.getElementById("squareIcon").checked,
            isBackground: document.getElementById("haveBackground").checked,
            background: document.getElementById("background").value,
            iconProfil: document.getElementById("iconProfil").value,
            dynamic_image: document.getElementById("dynamicImage").checked,
            import_background: document.getElementById("haveImageBackground").checked,
            customImageCheck: document.getElementById("customImageCheck").checked,
            customNWA: document.getElementById("customNWAImageCheck").checked
        },
        background: {
            name: document.getElementById("background_input_text").innerHTML,
            data: background_img
        },
        nwaCustomData: nwa_data_images,
        icons: icons_data
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
export function import_theme(e){
    var fr = new FileReader();
    var json;
    fr.onload = function() {
        try {
            json = JSON.parse(fr.result);
            Object.keys(palette).forEach(function(colorName) {
                palette[colorName] = json["palette"][colorName];
                document.getElementById(colorName).value = toHex(palette[colorName]);
            });
            document.getElementById("squareIcon").checked = json["settings"]["isSquareIcon"];
            document.getElementById("haveBackground").checked = json["settings"]["isBackground"];
            document.getElementById("haveImageBackground").checked = json["settings"]["import_background"];
            document.getElementById("background").value = json["settings"]["background"];
            document.getElementById("iconProfil").value = json["settings"]["iconProfil"];
            document.getElementById("dynamicImage").checked = json["settings"]["dynamic_image"];
            document.getElementById("customImageCheck").checked = json["settings"]["customImageCheck"];
            if(json["settings"]["dynamic_image"]) document.getElementById("iconProfil").style.visibility = "hidden";
            else document.getElementById("iconProfil").style.visibility = "visible";
            if(!json["settings"]["isBackground"]){
                document.getElementById("background").style.visibility = "hidden";
                document.getElementById("background_input_text").style.visibility = "hidden";
                document.getElementById("haveImageBackground").style.visibility = "hidden";
                document.getElementById("haveImageBackgroundLabel").style.visibility = "hidden";
            }
            else{
                if (json["settings"]["import_background"]){
                    document.getElementById("background").style.visibility = "hidden";
                    document.getElementById("background_input_text").style.visibility = "visible";
                }else{
                    document.getElementById("background").style.visibility = "visible";
                    document.getElementById("background_input_text").style.visibility = "hidden";
                }
                document.getElementById("haveImageBackground").style.visibility = "visible";
                document.getElementById("haveImageBackgroundLabel").style.visibility = "visible";
                
            }
            document.getElementById("background_input_text").innerHTML = json["background"]["name"];
            setBackgroundImg(json["background"]["data"]);
            Object.assign(icons_data, json["icons"]);
            Object.keys(icons_data).forEach(function(imageName) {
                if (icons_data[imageName] != null){
                    document.getElementById(imageName+"_btn").style.visibility = "visible"
                }
            });
            if(json["settings"]["customImageCheck"]){
                document.getElementById("customNWAImageCheck").style.visibility = "visible";
                document.getElementById("customNWAImageCheckLabel").style.visibility = "visible";
                document.getElementById("images").style.visibility = "visible";
            } else{
                document.getElementById("images").style.visibility = "hidden";
                document.getElementById("customNWAImageCheck").style.visibility = "hidden";
                document.getElementById("customNWAImageCheckLabel").style.visibility = "hidden";
            }

            if ("customNWA" in json["settings"]){
                document.getElementById("customNWAImageCheck").checked = json["settings"]["customNWA"];
            }

            if ("nwaCustomData" in json){
                Object.assign(nwa_data_images, json["nwaCustomData"]);
                add_nwa_input();
            }
        } catch (error) {
            alert("Invalid profil : " + error)
        }
    }
    fr.readAsText(e.target.files[0]);
}