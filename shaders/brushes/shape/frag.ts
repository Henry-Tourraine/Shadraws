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
uniform float uScale;
uniform float uAngle;
in vec2 vTexCoord;


out vec4 fragColor;
void main()
{
    float PI = 3.14159265;
    float angle = uAngle / 360. * 2. * PI;
    mat2 rotation = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
    
    float size = uSize*uPressure;
    float blur = uBlur;
    vec2 uv = 2.*gl_FragCoord.xy/uResolution.xy;
    uv -= 1.;
    uv *= rotation;

    

    vec4 color = uColor;
    vec2 penPos = uPenPos;
    
   
    vec4 img = texture(uSampler, vTexCoord);
    
    //blur for alpha
    float m = clamp(smoothstep(length(uv - penPos), length(uv - penPos) + blur, size ), 0., 1.);

    float m2 = smoothstep(length(uv - penPos), length(uv - penPos) + blur, size+0.2 );

  
    float m_ = m > 0. ? 1.: 0.;
    
    vec4 t = texture(uBrushHead, (uv - penPos)/(size * 2.) + 0.5  );

    vec4 col = vec4(0.);

    
    if(img.a < 1. && m_ > 0.) img.rgb = color.rgb;

    vec4 direction = color - img;
    float nudge_blur = color.a * m;
    float nudge_full = color.a * m_;

    col.rgb = img.rgb + direction.rgb * nudge_blur;
    col.a = img.a + nudge_blur;


    fragColor = col;
    
}
`;

export default frag;