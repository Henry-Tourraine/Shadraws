
const vert=`#version 300 es
#pragma vscode_glsllint_stage: vert
layout(location=0) in vec4 aPosition;
layout(location = 1) in vec3 aColor;

layout(location=2) in vec2 aTexCoord;
out vec2 vTexCoord;
out vec3 vColor;
void main()
{
  
    vec4 t = aPosition;
  
    gl_Position = t;
    vColor = aColor;
    vTexCoord = aTexCoord;
}

`
export default vert;