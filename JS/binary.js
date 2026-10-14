import {background_img} from "./data.js"
import {palette} from "./data.js";
import {hex_to_rgb565} from "./utils.js";
import {icons_data, icons_size} from "./data.js";

//make the binary file for download
export function makeBinary(){
    const keys = Object.keys(palette);
    const buffer = new ArrayBuffer(keys.length * 2 + 14);

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
    var import_background;
    var custom_images;

    if (document.getElementById("squareIcon").checked)square_icon = 1;
    else square_icon = 0;

    if (document.getElementById("dynamicImage").checked)dynamic_image = 0;
    else dynamic_image = 1;

    if (document.getElementById("haveImageBackground").checked)import_background = 0;
    else import_background = 1;

    if (document.getElementById("haveBackground").checked){
        is_background = 0;
        background = parseInt(document.getElementById("background").value)-1;
    }
    else{
        is_background = 1;
    }

    if (document.getElementById("iconProfil").value == "epsilon" || dynamic_image == 0)icon_profil = 1;
    else icon_profil = 0;

    if (document.getElementById("customImageCheck").checked)custom_images = 1;
    else custom_images = 0;

    const startOfMetadata = keys.length * 2;
    view.setUint16(startOfMetadata, square_icon, true);
    view.setUint16(startOfMetadata + 2, is_background, true);
    view.setUint16(startOfMetadata + 4, background, true);
    view.setUint16(startOfMetadata + 6, icon_profil, true);
    view.setUint16(startOfMetadata + 8, dynamic_image, true);
    view.setUint16(startOfMetadata + 10, import_background, true);
    view.setUint16(startOfMetadata + 12, custom_images, true);

    return buffer;
}

//generate the background buffer
export function makeBackgroundBuffer(){
    const buffer = new ArrayBuffer(320*240*2);
    const view = new DataView(buffer);

    background_img.forEach((color, index) => {
        view.setUint16(index * 2, color, true);
    });

    return buffer;
}

//generate an image buffer
export function makeImageBuffer(image){
    const buffer = new ArrayBuffer((icons_size[image][0]*icons_size[image][1]*2)+2);
    const view = new DataView(buffer);

    if (icons_data[image] == null){
        view.setUint16(0, 0xDEAD, true);
        for (let i = 0; i < icons_size[image][0]*icons_size[image][1]; i++) {
            view.setUint16(2+i*2, 0, true);
        }
    }else{
        view.setUint16(0, 1, true);
        icons_data[image].forEach((color, index) => {
            view.setUint16(2+index*2, color, true);
        });
    }

    return buffer;
}

export function makeNWAImageBuffer(image){
    const buffer = new ArrayBuffer((55*56*2)+2);
    const view = new DataView(buffer);

    if (image == null){
        view.setUint16(0, 0xDEAD, true);
        for (let i = 0; i < 55*56; i++) {
            view.setUint16(2+i*2, 0, true);
        }
    }else{
        view.setUint16(0, 1, true);
        image.forEach((color, index) => {
            view.setUint16(2+index*2, color, true);
        });
    }

    return buffer;
}