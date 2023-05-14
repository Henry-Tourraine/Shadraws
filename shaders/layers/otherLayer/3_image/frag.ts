

const frag=`#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
uniform vec2 uResolution;

uniform sampler2D uSamplerPrevOutput;

uniform sampler2D uSamplerFusion;

uniform sampler2D uSampler;
in vec2 vTexCoord;


out vec4 fragColor;
void main()
{

    vec4 prevImage = texture(uSamplerPrevOutput, vTexCoord);
    fragColor = prevImage * prevImage.a + texture(uSampler, vTexCoord) * texture(uSamplerFusion, vTexCoord);
    
}
`;

export default frag;