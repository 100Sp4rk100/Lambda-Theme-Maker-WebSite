//convert hexadecimal to compatible format
export function toHex(num) {
    return "#" + num.toString(16).padStart(6, '0');
}

//convert hexadecimal to 565
export function hex_to_rgb565(hex_val){
    var r = (hex_val >> 16) & 0xFF;
    var g = (hex_val >> 8) & 0xFF;
    var b = hex_val & 0xFF;
    
    var r5 = (r >> 3) & 0x1F;
    var g6 = (g >> 2) & 0x3F;
    var b5 = (b >> 3) & 0x1F;
    
    return (r5 << 11) | (g6 << 5) | b5;
}

export function rgb888_to_rgb565(r, g, b){
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}