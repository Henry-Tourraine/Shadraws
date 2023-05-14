const frag=`#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
in vec3 vColor;
uniform vec2 uResolution;
uniform vec4 uColor;
uniform vec2 uPenPos;
uniform float uPressure;
uniform sampler2D uSampler;
in vec2 vTexCoord;


out vec4 fragColor;
void main()
{
    float size = 0.3;
    vec2 uv = 2.*gl_FragCoord.xy/uResolution.xy;
    uv -= 1.;
    
    vec4 color = vec4(1.,0.,0.,1.);
    
    float mask = 1. - step(size*uPressure, length(uv - uPenPos));

   
    vec4 img = texture(uSampler, vTexCoord);
    
    img = vec4(img.rgb * (1.-mask) + color.rgb * mask, img.a+mask);
    //img.a = 1.;
    fragColor = img;//vec4(vec3(mask),1.);
    
}
`;

export default frag;