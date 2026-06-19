import {palette, icons_data, setBackgroundImg} from "./data.js";
import {toHex, rgb888_to_rgb565} from "./utils.js"
import {download_theme, import_theme} from "./download_export.js"
import {connect_upload, delete_on_calculator} from "./numworks_manager.js"
import {icons_size} from "./data.js";

//add all color picker to the view
export function setupColorsListe() {
    const list_colors = document.getElementById("colors");
    
    if (!list_colors) return;

    Object.keys(palette).forEach(function(colorName) {
        const container = document.createElement("div");

        const picker = document.createElement("input");
        picker.type = "color";
        picker.id = colorName;
        picker.value = toHex(palette[colorName]);
        if (colorName == "BackgroundColor"){
            picker.title = "It's useful only if you don't activate the wallpaper, or when exam mod is active"
        }
        if (colorName == "BackgroundColorHilight"){
            picker.title = "It's useful only if you don't activate the wallpaper or when exam mod is active and it's for when you select an app in the home app"
        }
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

//add all button for image import
export function setupImagesListe() {
    const list_images = document.getElementById("images");
    
    if (!list_images) return;

    Object.keys(icons_data).forEach(function(imageName) {
        const container = document.createElement("div");

        const text = document.createElement("label");
        text.htmlFor = imageName;
        text.innerHTML = imageName;
        text.className = "file_input_label"

        const input_img = document.createElement("input");
        input_img.type = "file";
        input_img.id = imageName;
        input_img.addEventListener("change", function (e){
            let file = e.target.files[0];
            text.title = file.name;

            //read the image and create a table
            let reader = new FileReader();
            reader.onload = function (event) {
                let img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = icons_size[imageName][0];
                    canvas.height = icons_size[imageName][1];
                    const ctx = canvas.getContext('2d');

                    ctx.drawImage(img, 0, 0, icons_size[imageName][0], icons_size[imageName][1]);

                    const imageData = ctx.getImageData(0, 0, icons_size[imageName][0], icons_size[imageName][1]).data;

                    icons_data[e.target.id] = []

                    for (let i = 0; i < imageData.length; i += 4) {
                        let r = imageData[i];
                        let g = imageData[i + 1];
                        let b = imageData[i + 2];

                        icons_data[e.target.id].push(rgb888_to_rgb565(r, g, b))
                    }

                    if (icons_data[e.target.id] !== null){
                        document.getElementById(e.target.id+"_btn").style.visibility = "visible"
                    }
                };

                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        })

        const remove_btn = document.createElement("button")
        remove_btn.id = imageName+"_btn"
        remove_btn.innerHTML = "Remove"
        remove_btn.className = "remove_button"
        remove_btn.style.visibility = "hidden"
        remove_btn.addEventListener("click", function (e){
            icons_data[e.target.id] = null
            e.target.style.visibility = "hidden"
            text.title = "";
        })

        container.appendChild(input_img);
        container.appendChild(text);
        container.appendChild(remove_btn);
        container.appendChild(document.createElement("br"));
        container.appendChild(document.createElement("br"));
        list_images.appendChild(container);
    });
}

export function setup_listeners(){
    document.getElementById("download_btn").addEventListener("click", download_theme);
    document.getElementById("import_input").addEventListener("change", function (e){
        let name = e.target.files[0].name;
        document.getElementById("import_input_text").innerHTML = name;
        import_theme(e)
    });
    document.getElementById("connect_upload_btn").addEventListener("click", connect_upload);
    document.getElementById("delete_btn").addEventListener("click", delete_on_calculator);
    document.getElementById("haveBackground").addEventListener("change", function (){
        if(document.getElementById("haveBackground").checked){
            document.getElementById("haveImageBackground").style.visibility = "visible";
            document.getElementById("haveImageBackgroundLabel").style.visibility = "visible";
            if(document.getElementById("haveImageBackground").checked){
                document.getElementById("background_input_text").style.visibility = "visible";
            }else{
                document.getElementById("background").style.visibility = "visible";
            }
        }
        else{
            document.getElementById("background").style.visibility = "hidden";
            document.getElementById("haveImageBackground").style.visibility = "hidden";
            document.getElementById("haveImageBackgroundLabel").style.visibility = "hidden";
            document.getElementById("background_input_text").style.visibility = "hidden";
        }
    });
    document.getElementById("haveImageBackground").addEventListener("change", function (){
        if(document.getElementById("haveImageBackground").checked){
            document.getElementById("background_input_text").style.visibility = "visible";
            document.getElementById("background").style.visibility = "hidden";
        }
        else{
            document.getElementById("background_input_text").style.visibility = "hidden";
            document.getElementById("background").style.visibility = "visible";
        }
    });
    document.getElementById("dynamicImage").addEventListener("change", function (){
        if(document.getElementById("dynamicImage").checked) document.getElementById("iconProfil").style.visibility = "hidden";
        else document.getElementById("iconProfil").style.visibility = "visible";
    });
    document.getElementById("background_input").addEventListener("change", function (e){
        let file = e.target.files[0];
        let name = file.name;

        document.getElementById("background_input_text").innerHTML = name;

        //read the image and create a table
        let reader = new FileReader();
        reader.onload = function (event) {
            let img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(img, 0, 0, 320, 240);

                const imageData = ctx.getImageData(0, 0, 320, 240).data;

                let local_bg = [];

                for (let i = 0; i < imageData.length; i += 4) {
                    let r = imageData[i];
                    let g = imageData[i + 1];
                    let b = imageData[i + 2];

                    local_bg.push(rgb888_to_rgb565(r, g, b));
                }

                setBackgroundImg(local_bg);
            };

            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    });
    document.getElementById("customImageCheck").addEventListener("change", function (e){
        const isChecked = e.target.checked;
        if(isChecked) document.getElementById("images").style.visibility = "visible";
        else document.getElementById("images").style.visibility = "hidden";

        if (!isChecked) {
            document.querySelectorAll(".remove_button").forEach(btn => {
                btn.style.visibility = "hidden";
            });
        } else {
            Object.keys(icons_data).forEach(function(imageName) {
                    const btn = document.getElementById(imageName + "_btn");
                    if (btn && icons_data[imageName] !== null) {
                        btn.style.visibility = "visible";
                    }
            });
        }
    });
}