uniform sampler2D uPictureTexture;
uniform float uTime;

// varying float vColor;
varying vec4 vColor;
varying float vDisplacementIntensity;

#include ../includes/luminance.glsl

void main()
{
    vec2 uv = gl_PointCoord;
    float distanceToCenter = distance(uv, vec2(0.5));

    if(distanceToCenter > 0.5)
        discard;

    float vR = vColor.r;
    float vG = vColor.g;
    float vB = vColor.b;

    float luminance  = (0.2126 * sRGBtoLin(vR) + 0.7152 * sRGBtoLin(vG) + 0.0722 * sRGBtoLin(vB));
    
    // Man does this make it more performant LOL
    if(luminance < 0.008)
        discard;
    
    gl_FragColor = vColor;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}