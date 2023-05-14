import { StaticImageData } from "next/image";
import { DrawingAppLogic } from "../app";
import { clamp, Texture } from "../utils";
import { Program } from "./programs";



 export class EraserProgram extends Program{
    private colors: Array<number>=[1., 0., 0., 1.];
    private size: number = 0.2;
    private blur: number = 0.1;
        
    constructor(gl: WebGL2RenderingContext, vert: string, frag: string, verbose:Boolean=false){
        super(gl, vert, frag, verbose);
        }
        setUSize(size: number){
            
            if(size<0) return this;
            this.useProgram();
            if(this.verbose)console.log("Program -> setUSize ");
            if(!!size==true){
                this.size = parseFloat(size.toFixed(2));
            }
           
            const uSizeLoc = this.gl.getUniformLocation(this.program!, 'uSize');
            this.gl.uniform1f(uSizeLoc, this.size);

            return this;
        }

        getSize(){
            return this.size;
        }

        setUBlur(blur?: number){
            if(this.verbose)console.log("Program -> setUBlur ");
            this.useProgram();
            if(!!blur){
                if(blur<0) {return this;}
                this.blur = parseFloat(blur.toFixed(2));
            }
            
            const uBlurLoc = this.gl.getUniformLocation(this.program!, 'uBlur');
            this.gl.uniform1f(uBlurLoc, this.blur);
            return this;
        }

        getBlur(){
            return this.blur;
        }

        getColors(){
            return this.colors;
        }
        setUColor(...colors: Array<number>){
            if(this.verbose)console.log("Program -> setUColor ");
            this.useProgram();
            if(colors.length==0){
                const uColor = this.gl.getUniformLocation(this.program!, 'uColor');
                colors = this.colors;
                this.gl.uniform4f(uColor, colors[0], colors[1], colors[2], colors[3]);
                return this;
            }
            const uColor = this.gl.getUniformLocation(this.program!, 'uColor');
            colors = clamp(colors, 0, 1);
            this.colors = colors;
            this.gl.uniform4f(uColor, colors[0], colors[1], colors[2], colors[3]);
            return this;
        }

        setUPenPos(x: number, y: number){
            if(this.verbose)console.log("Program -> setUPenPos - arguments : x : "+x+", y :"+y);
            this.useProgram();
            const uPenPosLoc = this.gl.getUniformLocation(this.program!, 'uPenPos');
            this.gl.uniform2f(uPenPosLoc, x, y);
            return this;
        }
        touch(x: number, y: number, pressure: number=0.5){
            if(this.verbose)console.log("Program ->touch - arguments : x : "+x+", y :"+y);
            this.setUPenPos(x, y).setPressure(pressure).draw();
         }

         setPressure(pressure: number){
            if(this.verbose)console.log("Program -> setPressure - arguments : pressure : "+pressure);
            const uPressureLoc = this.gl.getUniformLocation(this.program!, 'uPressure');
            this.gl.uniform1f(uPressureLoc, pressure);
            return this;
         }

        sketch(e: TouchEvent){
            let l = this.parent?.layerStack.find(e=>e.id == this.parent?.getActiveLayer())!;
          
            if(this.verbose)console.log("Program -> erase - arguments : l "+l+" e : ", e);

          
            this.parent?.fillTexture_(l.textures.mains.textures[l.textures.mains.active==0?1:0]!, [0,0,0,0]);
                console.log("fill render target -> ", l.textures.mains.active  == 0 ? 1 : 0);
             
                this.useProgram()
                .bindVAO()
                .setSampler(l.textures.mains.textures[l.textures.mains.active]!, "uSampler")
                .setRenderTarget(l.textures.mains.textures[l.textures.mains.active  == 0 ? 1 : 0]!)
                .setUColor()
                .setUBlur()
                .setUSize(this.size);
                
                //this.tools.brush.setCoordBuffer(400/20, [2 * ((e.touches[0].clientX - this.getDims().x)/this.tools.brush.gl.canvas.width) - 1 ,  2 *( 1 - (e.touches[0].clientY - this.getDims().y)/this.tools.brush.gl.canvas.height) - 1]);
               
                this.touch(2 * ((e.touches[0].clientX - this.parent!.getDims().x)/this.gl.canvas.width) - 1 ,  2 *( 1 - (e.touches[0].clientY - this.parent!.getDims().y)/this.gl.canvas.height) - 1, e.touches[0].force);
    
               //this.parent?.renderLayerStack2();
    
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
                console.log("you draw last on ", l.textures.mains.textures[l.textures.mains.active  == 0 ? 1 : 0]!);
    
                this.parent?.tools.brush.drawFill();
    
    
                console.log("final drawn texture is ", l.textures.mains.textures[l.textures.mains.active == 0 ? 1 : 0]!);
               
                //this.checkLayer(this.layerStack[this.activeLayerIndex],0)
                
                l.textures.mains.active = l.textures.mains.active == 0 ? 1 : 0;
              
        }

        erase(e: TouchEvent){

            this.sketch(e);
        }
 }

 