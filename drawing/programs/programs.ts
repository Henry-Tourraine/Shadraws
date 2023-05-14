import { StaticImageData } from "next/image";
import { DrawingAppLogic } from "../app";
import { clamp, Texture } from "../utils";



 export class Program{
        private activeTexture: Number=0;
        public gl: WebGL2RenderingContext;
        private fb: WebGLFramebuffer|null;
        private vert: string;
        private frag: string;
        private vao1: WebGLVertexArrayObject|null;
        private depthBuffer: WebGLRenderbuffer|null;
        protected verbose: Boolean=true;
        
        private texCoordBuffer: WebGLBuffer|null=null;
        
        public parent: DrawingAppLogic|null=null;

        protected program: WebGLProgram | null;
    constructor(gl: WebGL2RenderingContext, vert: string, frag: string, verbose:Boolean=false){
        this.verbose = verbose;
        if(verbose)console.log("Program -> constructor")
        if(verbose==true) console.log("new Program ")
         this.gl = gl;
         this.texCoordBuffer = gl.createBuffer();
         this.vert = vert;
         this.frag = frag;
         this.fb=gl.createFramebuffer();
         this.vao1=null;
         this.program = null;
         this.depthBuffer=this.gl.createRenderbuffer();
        }

        setParent(parent: DrawingAppLogic){
            this.parent = parent;
            return this;
        }
 
        createProgram(){
            if(this.verbose)console.log("Program -> createProgram ");
             console.log(this)
             this.program = this.gl.createProgram();
 
             const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;
             this.gl.shaderSource(vertexShader, this.vert);
             this.gl.compileShader(vertexShader);
             this.gl.attachShader(this.program!, vertexShader);
 
             const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
             this.gl.shaderSource(fragmentShader, this.frag);
             this.gl.compileShader(fragmentShader);
             this.gl.attachShader(this.program!, fragmentShader);
 
             this.gl.linkProgram(this.program!);
 
             if (!this.gl.getProgramParameter(this.program!, this.gl.LINK_STATUS)) {
                console.log(" Program not linked !!!!!!!!!!!!!!!!!!!!!!");
                 console.log(this.gl.getShaderInfoLog(vertexShader));
                 console.log(this.gl.getShaderInfoLog(fragmentShader));
             }
             return this;
         }

         getProgram(){
            return this.program;
         }

           setRenderTarget(texture: Texture){
            if(this.verbose)console.log("Program -> setRenderTarget - arguments: texture :"+texture)
           console.log("SETRENDERTARGET ", texture.index);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);

            // attach the texture as the first color attachment
            const attachmentPoint = this.gl.COLOR_ATTACHMENT0;
            const level = 0;
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachmentPoint, this.gl.TEXTURE_2D, texture.texture, level);
            
        
            
        
            // Tell WebGL how to convert from clip space to pixels
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        
           return this;
 
        }

        setUResolution(){
            if(this.verbose)console.log("Program -> setUResolution ");
            this.useProgram();
            const uPositionLoc = this.gl.getUniformLocation(this.program!, 'uResolution');
            this.gl.uniform2f(uPositionLoc, this.gl.canvas.width, this.gl.canvas.height);
            return this;
        }



        setCoordBuffer(size: number, offset:Array<number>){
            const texCoordBufferData = new Float32Array([
                0+offset[0],      1/size+offset[1],
                0+offset[0],      0+offset[1],
                1/size+offset[0], 1/size+offset[1],
                1/size+offset[0], 0+offset[1],
            ]);
            
            this. gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoordBufferData, this.gl.STATIC_DRAW);
            this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, 0,0);
            this.gl.enableVertexAttribArray(2);
            }

            bindVAO(){
               
                this.gl.bindVertexArray(this.vao1);
                return this;
            }
         setAttributes(){
            if(this.verbose)console.log("Program -> setAttributes");
             this.gl.useProgram(this.program);
 
 
             const texCoordBufferData = new Float32Array([
                     0,1,
                     0,0,
                     1,1,
                     1,0,
                 ]);
             const bufferData = new Float32Array([
                 -1., 1.,    0.5, 0.5, 0.5,
                 -1,-1,      0.9, 0.5, 0.5,
                 1, 1,       0.5, 0.9, 0.5,
                 1, -1,      0.5, 0.5, 0.9
             ]);
 
             const elementIndexData = new Uint8Array([
                 0, 1, 2,
                 2, 3, 1
                
             ]);
             
            this.vao1 = this.gl.createVertexArray();
            this.gl.bindVertexArray(this.vao1);

            this.texCoordBuffer = this.gl.createBuffer();
            this. gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoordBufferData, this.gl.STATIC_DRAW);
            this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, 0,0);
            this.gl.enableVertexAttribArray(2);

             const buffer = this.gl.createBuffer();
             this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
             this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);
             this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 5 * 4, 0);
             this.gl.enableVertexAttribArray(0);
 
            
             this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
             this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);
             this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 5 * 4 /*stride*/, 2*4);
             this.gl.enableVertexAttribArray(1);
 
 
 
 
             const elementIndexBuffer = this.gl.createBuffer();
             this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, elementIndexBuffer);
             this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, elementIndexData, this.gl.STATIC_DRAW);
 
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
             
            this.gl.bindVertexArray(null);
             
             return this;
            
         }

         setSampler(texture: Texture, name: string){
            if(this.verbose)console.log("Program -> setSampler name : ", name);
            const textureSlot = texture.index;
            this.gl.activeTexture(this.gl.TEXTURE0 + (textureSlot as number));
            this.gl.uniform1i(this.gl.getUniformLocation(this.program!, name), textureSlot);

            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            this.gl.bindTexture( this.gl.TEXTURE_2D, texture.texture);

            
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D,  this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D,  this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D,  this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);

            return this;
         }

         setUScale(reset:boolean=false){
            if(this.verbose)console.log("Program -> setUScale ");
            this.useProgram();
            const uPositionLoc = this.gl.getUniformLocation(this.program!, 'uScale');
            this.gl.uniform1f(uPositionLoc, reset==true?1.:this.parent!.getScale());
            return this;
         }

         getUScale(){
            return this.gl.getUniform(this.program!, this.gl.getUniformLocation(this.program!, "uScale")!);
         }

         updateUAngle(){
            if(this.verbose)console.log("Program -> setUAngle ");
            this.useProgram();
            const uPositionLoc = this.gl.getUniformLocation(this.program!, 'uAngle');
            this.gl.uniform1f(uPositionLoc, this.parent?.getRotationAngle()!);
            return this;
         }

         getUAngle(){
            return this.gl.getUniform(this.program!, this.gl.getUniformLocation(this.program!, "uAngle")!);
         }
         
 
         draw(){
            if(this.verbose)console.log("Program -> draw ");
             this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.BLEND);
 
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);

             this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_BYTE, 0);

             this.gl.depthMask(false);
             
         }

         useProgram(){
            this.gl.useProgram(this.program);
            return this;
         }

         drawFill(){
            if(this.verbose)console.log("Program -> drawFill ");
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
       
           this.gl.enable(this.gl.DEPTH_TEST);
           this.gl.enable(this.gl.BLEND);

           this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
           this.gl.depthMask(true);

            
            this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_BYTE, 0);

            this.gl.depthMask(false);
            
        }
       
 }
