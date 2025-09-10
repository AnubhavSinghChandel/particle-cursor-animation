uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform float uColorIntensity;
uniform float uParticleSize;
uniform sampler2D uDisplacementTexture;
uniform float uTime;

attribute float aDisplacementIntensity;
attribute float aDisplacementAngle;

// varying float vColor;
varying vec4 vColor;
varying float vDisplacementIntensity;

#include ../includes/luminance.glsl

void main()
{
    // Picture
    vec4 color = texture(uPictureTexture, uv);

    float vR = color.r / 255.0;
    float vG = color.g / 255.0;
    float vB = color.b / 255.0;

    // for colored images, intensity can be calculated using a luminance  formula 
    // from https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color/13558570#13558570
    float luminance  = (0.2126 * sRGBtoLin(vR) + 0.7152 * sRGBtoLin(vG) + 0.0722 * sRGBtoLin(vB));
    float intensity = YtoLstar(luminance);
    
    //Displacement
    vec3 newPosition = position;
    if(intensity>0.17){
        newPosition.x += sin(uTime * 30.0 * aDisplacementIntensity) * 0.005;
        newPosition.y += sin(uTime * 30.0 * aDisplacementIntensity) * 0.006;
        newPosition.z += sin(uTime * 29.5 * aDisplacementIntensity) * 0.01;
    }
    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep(0.1, 0.3, displacementIntensity);
    vec3 displacementDirection = vec3(
        cos(aDisplacementAngle) * 0.2,
        sin(aDisplacementAngle) * 0.2,
        1.0
    );
    displacementDirection = normalize(displacementDirection);
    displacementDirection *= displacementIntensity;
    displacementDirection *= 3.0 * aDisplacementIntensity;

    newPosition += displacementDirection; 
    
    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uParticleSize * intensity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vColor = color;
    vDisplacementIntensity = aDisplacementIntensity;
}