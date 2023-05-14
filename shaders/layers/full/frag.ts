const frag=`#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
uniform vec2 uResolution;

uniform sampler2D uSampler;
in vec2 vTexCoord;

uniform sampler2D uSamplerFusion;


uniform sampler2D uSamplerClip;


uniform sampler2D uSamplerPrevOutput;

uniform sampler2D uSamplerSelection;


out vec4 fragColor;
void main()
{

   
    vec4 prevImage = texture(uSamplerPrevOutput, vTexCoord);
    vec4 currentImage = texture(uSampler, vTexCoord);

    vec4 direction = currentImage - prevImage;
    vec4 col = vec4(0.);
    col.rgb = mix(prevImage.rgb, currentImage.rgb, currentImage.a);
    col.a = prevImage.a + currentImage.a;

    fragColor = col; //* texture(uSamplerFusion, vTexCoord).a * texture(uSamplerClip, vTexCoord).a * texture(uSamplerSelection, vTexCoord);
    
}
`;

export default frag;