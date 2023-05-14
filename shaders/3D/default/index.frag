#version 300 es
#pragma vscode_glsllint_stage: frag
precision mediump float;
in vec3 vColor;
uniform vec2 uResolution;
out vec4 fragColor;
void main()
{
    vec2 uv = 2.*gl_FragCoord.xy/uResolution.xy;
    uv -= 1.;
    // Time varying pixel color
    float col = .0;
    
    col = 1.-step(0.2, length(uv));

    fragColor = vec4(vColor + vec3(col), 1.0);
}


 