float sRGBtoLin(float colorChannel) {
    // Send this function a decimal sRGB gamma encoded color value
    // between 0.0 and 1.0, and it returns a linearized value.

    if ( colorChannel <= 0.04045 ) {
            return colorChannel / 12.92;
    } else {
        return pow((( colorChannel + 0.055)/1.055),2.4);
    }
}

float YtoLstar(float Y) {
    // Send this function a luminance value between 0.0 and 1.0,
    // and it returns L* which is "perceptual lightness"

    if ( Y <= (216.0/24389.0)) {       // The CIE standard states 0.008856 but 216/24389 is the intent for 0.008856451679036
        return Y * (24389.0/27.0);  // The CIE standard states 903.3, but 24389/27 is the intent, making 903.296296296296296
    } else {
        return pow(Y,(1.0/3.0)) * 116.0 - 16.0;
    }
}