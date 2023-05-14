
const frag=`#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
uniform vec2 uResolution;

uniform sampler2D uSampler;
in vec2 vTexCoord;

uniform sampler2D uSamplerPrevOutput;

out vec4 fragColor;
void main()
{

    vec4 prevImage = texture(uSamplerPrevOutput, vTexCoord);
    vec4 image = texture(uSampler, vTexCoord);

    vec4 mask = vec4((1.-image.a)* prevImage.rgb + image.a * image.rgb, clamp(0., 1., prevImage.a + image.a));
   

    fragColor = mix(prevImage, image, image.a);
    
}
`;

export default frag;