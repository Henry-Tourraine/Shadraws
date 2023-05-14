
const frag=`#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
uniform vec2 uResolution;

in vec2 vTexCoord;
uniform sampler2D uSampler;
out vec4 fragColor;
void main()
{
    
    fragColor =  texture(uSampler, vTexCoord);
    
}
`;

export default frag;


 