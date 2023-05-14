const frag=`#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
in vec3 vColor;
uniform vec2 uResolution;
uniform vec4 uColor;
uniform vec2 uPenPos;
uniform float uPressure;
uniform float uSize;
uniform float uBlur;
uniform sampler2D uBrushHead;
uniform sampler2D uSampler;
in vec2 vTexCoord;


out vec4 fragColor;
void main()
{
    float size = uSize*uPressure;
    float blur = uBlur;
    vec2 uv = 2.*gl_FragCoord.xy/uResolution.xy;
    uv -= 1.;
    
    vec4 color = uColor;
    
   
    vec4 img = texture(uSampler, vTexCoord);
    
    //blur for alpha
    float m = smoothstep(length(uv - uPenPos), length(uv - uPenPos) + blur, size );

    
    float m_ = m > 0. ? 1.: 0.;
    
    vec4 t = texture(uBrushHead, (uv - uPenPos)/(size * 2.) + 0.5  );

   vec4 mask = vec4(.0);
   vec4 col = img;
   col.a = img.a - m;
   

    fragColor = col;
    
}
`;

export default frag;