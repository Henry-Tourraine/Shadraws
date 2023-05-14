#version 300 es
#pragma vscode_glsllint_stage: vert
layout(location=0) in vec4 aPosition;
layout(location = 1) in vec3 aColor;
out vec3 vColor;
void main()
{
  
    vec4 t = aPosition;
    //t.xy *= 2.;
    gl_Position = t;
    vColor = aColor;
}