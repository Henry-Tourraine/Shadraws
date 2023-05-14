
const vert=`#version 300 es
#pragma vscode_glsllint_stage: vert
layout(location=0) in vec4 aPosition;

layout(location=2) in vec2 aTexCoord;
out vec2 vTexCoord;



void main()
{

    gl_Position = aPosition;
    vTexCoord = aTexCoord;
   
}
`
export default vert;