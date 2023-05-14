import { clamp, getAngle, HSLToRGB, RGBToHSL, Texture, TextureRole } from "./utils";
import { LayerLogic, LayerProps } from "./LayerLogic";
import { Program } from "./programs/programs";
import { FillProgram } from "./programs/FillProgram";
import { BrushProgram } from "./programs/BrushProgram";
import { EraserProgram } from "./programs/EraserProgram";
import firstNoMaskFrag from "../shaders/layers/firstLayer/1_image/frag";
import firstNoMaskVert from "../shaders/layers/firstLayer/1_image/vert";
import firstOneMaskFrag from "../shaders/layers/firstLayer/2_image/frag";
import firstOneMaskVert from "../shaders/layers/firstLayer/2_image/vert";

import noMaskFrag from "../shaders/layers/otherLayer/2_image/frag";
import noMaskVert from "../shaders/layers/otherLayer/2_image/vert";

import oneMaskFrag from "../shaders/layers/otherLayer/3_image/frag";
import oneMaskVert from "../shaders/layers/otherLayer/3_image/vert";

import twoMaskFrag from "../shaders/layers/otherLayer/4_image/frag";
import twoMaskVert from "../shaders/layers/otherLayer/4_image/vert";

import threeMaskFrag from "../shaders/layers/otherLayer/5_image/frag";
import threeMaskVert from "../shaders/layers/otherLayer/5_image/vert";

import fullFrag from "../shaders/layers/full/frag";
import fullVert from "../shaders/layers/full/vert";

import brushFrag from "../shaders/brushes/shape/frag";
import brushVert from "../shaders/brushes/shape/vert";

import eraserFrag from "../shaders/eraser/shape/frag";
import eraserVert from "../shaders/eraser/shape/vert";

import fillFrag from "../shaders/default/frag";
import fillVert from "../shaders/default/vert";

import { Activity, Tools_BASE, Tools_GLSL, Tools_THREE } from "../drawing/utils"

import { keyboards } from "./Keyboards";

import React, { MutableRefObject } from "react";
import { runInThisContext } from "vm";
import { ToolsDict } from "../components/ToolsDict";


interface ProgramsDict{
    firstLayerNoMask: Program,  //main   1 texture
    firstLayerOneMask: Program, //main + fusion  2 textures
    noMask: Program,   //preOutput + main  2 textures
    oneMask: Program,  //prevoutput + main + clip or fusion  3 textures
    twoMask: Program, //prevoutput + main + clip  + fusion  4 textures
    threeMask: Program  //prevoutput + main + clip  + fusion  + selection mask 5 images
    full: Program
}
export interface Tools{
    fill: FillProgram,
    brush: BrushProgram,
    eraser: EraserProgram
}

export class DrawingAppLogic{
    private MAX_TEXTURES: Number;
    private textures: Array<Texture>;
    private gl: WebGL2RenderingContext;
    public layerStack: Array<LayerLogic>=[];
    private layerId: number;
    private activeLayerIndex: number;
    private programs: ProgramsDict;
    public tools: Tools;
    private dims: DOMRect;
    private originalDims: DOMRect;
    private penDown: Boolean=false;
    private verbose: Boolean=true;
    private fillTexture:Texture|null;
    private selectionTexture:Texture|null;
    static instance: DrawingAppLogic|null=null;
    private pixelBuffer: WebGLBuffer|null;
    private temp: WebGLTexture;
    private selection: boolean;
    private activityIndex: number = 0;
    private toolIndex: number=0;
    private transforms={scale: 1, translate: {x: 0, y:0}, rotate: {center:{x:0, y:0}, rad: 0, temp: 0}};
    private keyboards: any = {
        Alt: false,
        a: false,
        Shift: false,
        w: false,
        x: false,
        c: false,

        s: false,
        q: false,
        d: false,
        f: false
    }
    private lastPos={x:0, y:0}
    
    private brushHead: Texture|null=null;
    wrapper: HTMLDivElement;
   

    private constructor(gl: WebGL2RenderingContext, max_textures: Number, wrapper:HTMLDivElement,  verbose:Boolean=true){
        if(verbose)console.log("Drawing App -> constructor");
        this.MAX_TEXTURES= max_textures;
        this.textures=[];
        this.gl = gl;
        this.layerStack = [];
        this.layerId=1;
        this.selection= false;
        this.activeLayerIndex = NaN;
        this.gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        this.dims = gl.canvas.getBoundingClientRect();
        this.originalDims = this.dims;
        this.wrapper = wrapper;
        
        this.setTranslate(0,0);
        
        this.tools = {
           
            fill: (new FillProgram(this.gl, fillVert, fillFrag)).setParent(this).createProgram().setAttributes().setUResolution(),
            brush: (new BrushProgram(this.gl, brushVert, brushFrag)).setParent(this).createProgram().setAttributes().setUResolution().setUSize(0.2).setUBlur(0.15),
            eraser: (new EraserProgram(this.gl, eraserVert, eraserFrag)).setParent(this).createProgram().setAttributes().setUResolution().setUSize(0.2).setUBlur(0.1)
           
           
            
        }
        //Utilisé pour remplir les textures plus rapidement
        this.pixelBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.PIXEL_UNPACK_BUFFER, this.pixelBuffer);
        let m =this.getImageData(0, 0, 0, 0);
        this.gl.bufferData(this.gl.PIXEL_UNPACK_BUFFER, m, this.gl.STATIC_DRAW);

        this.generateTextures(gl);
        
        
        this.tools.brush.useProgram();
        this.brushHead = this.findFreeTexture(103, TextureRole.BRUSH_HEAD);
        


        this.fillTexture = this.findFreeTexture(100, TextureRole.FILL);
        this.fillTexture_(this.fillTexture!, [255, 255, 255, 1]);
   

        this.selectionTexture = this.findFreeTexture(102, TextureRole.FILL);
        this.fillTexture_(this.selectionTexture!, [0, 0, 0, 0]);

        this.temp = this.gl.createTexture()!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.temp);

        
      
        

        this.programs = {
            firstLayerNoMask: new Program(this.gl, firstNoMaskVert, firstNoMaskFrag), //main   1
            firstLayerOneMask: new Program(this.gl, firstOneMaskVert, firstOneMaskFrag), //main + fusion  2
           
            noMask: new Program(this.gl, noMaskVert, noMaskFrag), //preOutput + main  2
            oneMask: new Program(this.gl, oneMaskVert, oneMaskFrag), //prevoutput + main + clip or fusion  3
            twoMask: new Program(this.gl, twoMaskVert, twoMaskFrag), //prevoutput + main + clip  + fusion  4
            threeMask: new Program(this.gl, threeMaskVert, threeMaskFrag),

            full: new Program(this.gl, fullVert, fullFrag), //main   1
            
            }
         
       

        this.verbose = true;
      
      
       this.triggerRender();
        
    }
    //provoque un nouveau rendu de la part de React
    public triggerRender(){
        if(this.verbose) console.log("DrawingApp - triggerRender");
        let e= new Event("rerender");
        window.dispatchEvent(e);
    }

    public getScale(){
        return this.transforms.scale;
    }
    public setScale(s:number){
        this.transforms.scale = s;
        this.gl.canvas.style.width = this.originalDims.x * s+"px";
        this.gl.canvas.style.height = this.originalDims.y * s+"px";        
        this.triggerRender();
        this.dims = this.gl.canvas.getBoundingClientRect();
        this.setTranslate(...this.getTranslate());
        this.updateRotationCenter();
    }

    public updateRotationCenter(){
        this.transforms.rotate.center.x = this.dims.x+this.dims.width/2;
        this.transforms.rotate.center.y = this.dims.y+this.dims.height/2;
    }
    public getRotationCenter(){
        return [this.transforms.rotate.center.x, this.transforms.rotate.center.y];
    }

    public getRotationAngle(){
     
        return this.transforms.rotate.rad;
    }

    public setRotationAngle(direction:boolean){
        
        if(direction==true){
            this.transforms.rotate.rad += 10;
        }else{
            this.transforms.rotate.rad -= 10;
        }
        this.transforms.rotate.rad = this.transforms.rotate.rad%360;

        console.log("angle : ->"+this.transforms.rotate.rad);
        this.gl.canvas.style.transform = "rotate("+this.transforms.rotate.rad+"deg)";
        //this.gl.canvas.style.transform = "rotate("+angle+"rad)";
    }

    


    public getTranslate():[number, number]{
        return [this.transforms.translate.x, this.transforms.translate.y];
    }

    public setTranslate(x:number, y: number){
        this.transforms.translate.x = x;
        this.transforms.translate.y = y;
        
        this.gl.canvas.style.top = "calc(50% - "+(this.dims.height/2)+"px "+(this.getTranslate()[1]<0?"-":"+")+" "+Math.abs(this.getTranslate()[1])+"px)";//"calc(50% - "+this.dims.height/2+"px + "+100+"px)";
        this.gl.canvas.style.left = "calc(50% - "+(this.dims.width/2)+"px "+(this.getTranslate()[0]<0?"-":"+")+" "+Math.abs(this.getTranslate()[0])+"px)";//"calc(50% - "+this.dims.width/2+"px - "+this.getTranslate()[1]*100+")";   
        this.triggerRender();
        this.dims = this.gl.canvas.getBoundingClientRect();
        this.updateRotationCenter();
    }

    public getDims(){
        return this.dims;
    }

    public setActivity(index: number){
        this.activityIndex=index;
        this.triggerRender();
    }
    public getActivity(){
        return this.activityIndex
    }

    public setTool(index: number){
        this.toolIndex=index;
        this.triggerRender();
    }
    public getTool(){
        return this.toolIndex;
    }


    public setActiveLayer(layer: number){
        this.activeLayerIndex = layer;
        this.triggerRender();
        console.log(this.layerStack);
    }

    public getActiveLayer(){
        return this.activeLayerIndex;
    }


    static async getInstance(gl: WebGL2RenderingContext|null=null, max_textures: Number|null=null, wrapper: HTMLDivElement, verbose:Boolean=false):Promise<DrawingAppLogic|null>{
        if(gl==null || max_textures==null){
            return DrawingAppLogic.instance;
        }
        if(DrawingAppLogic.instance!= null){
        return DrawingAppLogic.instance!;
      }else{
        DrawingAppLogic.instance = new DrawingAppLogic(gl!, max_textures!, wrapper, verbose);
        await DrawingAppLogic.instance.fillBrushHead(null);
        return DrawingAppLogic.instance!;
      }
        

    }

    

    private getImageData(...args:Array<number>){
       console.log("App -> getImageData")
        // Step 1: get the image width and height
        
        let virtualCanvas = {height: this.gl.canvas.height, width: this.gl.canvas.width};
        // Step 2: create a canvas of the same size
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = virtualCanvas.width;
        tmpCanvas.height = virtualCanvas.height;
    
        // Step 3: get a 2D Rendering Context object (aka Context API context)
        const context = tmpCanvas.getContext('2d')!;
    
        
        context.fillStyle = "rgba("+args[0]+", "+args[1]+", "+args[2]+","+args[3]+")";
        context.fillRect(0, 0, virtualCanvas.width, virtualCanvas.height);
  
    
        return context.getImageData(0,0, virtualCanvas.width, virtualCanvas.height).data;
    }

    public fillTexture_(texture: Texture, colors: Array<number>){
        this.gl.bindBuffer(this.gl.PIXEL_UNPACK_BUFFER, this.pixelBuffer);
        let m =this.getImageData(...colors);
        this.gl.bufferData(this.gl.PIXEL_UNPACK_BUFFER, m, this.gl.STATIC_DRAW);
        this.tools.fill.useProgram();
        this.tools.fill.bindVAO();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture?.texture!);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, 0);


    }

    public fillLayer(layer: LayerLogic, colors: Array<number>){
        this.gl.bindBuffer(this.gl.PIXEL_UNPACK_BUFFER, this.pixelBuffer);
        let m =this.getImageData(...colors);
        this.gl.bufferData(this.gl.PIXEL_UNPACK_BUFFER, m, this.gl.STATIC_DRAW);
        this.tools.fill.useProgram();
        this.tools.fill.bindVAO();

        for(let texture of [...layer.textures.mains.textures, layer.textures.output]){
          
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture?.texture!);

            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, 0);

            
        }
    }
    
    private generateTextures(gl: WebGL2RenderingContext){
        if(this.verbose)console.log("Drawing App -> pickTextures - arguments : gl ")
        for(let i=5; i<= (this.MAX_TEXTURES as number+5); i++){
        
    
            this.tools.fill.useProgram();
            this.tools.fill.bindVAO();

            
            let texture = gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

            //this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.MIRRORED_REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.MIRRORED_REPEAT);


            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, 0);

            
            let t: Texture = {texture: texture!, index: i, isSet: true, usedBy: NaN, role: TextureRole.NO_ROLE};

            this.tools.fill.drawFill();
        
            this.textures.push(t);
        }
        
    }

    public findFreeTexture(index:number, role: TextureRole){
        
        this.constructor.name
        if(this.verbose)console.log("Drawing App -> findFreeTexture - arguments : index "+index+" role :"+role)
        for(let i=0; i< this.textures.length; i++){
            let currentTexture = this.textures[i];
            console.log(isNaN(currentTexture.usedBy))
            if(isNaN(currentTexture.usedBy)){
                
                console.log("texture found")
                currentTexture.usedBy = index;
                currentTexture.role = role;

                return currentTexture;
            }
        }
        
        return null;
    };



    public createLayer(activity: Activity, colors?:Array<number>){
        
        if(this.verbose)console.log("Drawing App -> createLayer")
        if(this.verbose == true) console.log("createLayer() - layer "+this.layerId)
        let l = new LayerLogic({id:this.layerId, activity, getRenderingProgram: DrawingAppLogic.getRenderingProgram, parent: this});
        
        this.layerStack = [...this.layerStack, l];
        this.fillLayer(l, colors!=null && colors.length==4?colors:[255,255,255,0]);
       
        this.layerId+=1;
        return l;
       
    }
    public createLayerWithImage( img: HTMLImageElement){
        
        if(this.verbose)console.log("Drawing App -> createImage")
        let l = new LayerLogic({id:this.layerId, activity: Activity.BASE, getRenderingProgram: DrawingAppLogic.getRenderingProgram, parent: this});
        
        this.layerStack = [...this.layerStack, l];
        this.fillLayer(l, [255,255,255,0]);
        this.fillLayerWithImage(l, img);
       
        this.layerId+=1;
        return l;
       
    }
    private fillLayerWithImage(layer: LayerLogic, img: HTMLImageElement){
       
       this.gl.bindBuffer(this.gl.PIXEL_UNPACK_BUFFER, null);
        this.tools.fill.useProgram();
        this.tools.fill.bindVAO();
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        for(let texture of [...layer.textures.mains.textures, layer.textures.output]){
          
            
            this.gl.activeTexture(this.gl.TEXTURE0 + texture?.index!);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture?.texture!);

            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);

            
        }
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.gl.bindBuffer(this.gl.PIXEL_UNPACK_BUFFER, this.pixelBuffer);
    }

    

    static getRenderingProgram(id: number){
        if(DrawingAppLogic.instance!.verbose)console.log("Drawing App -> getRenderingProgram - arguments : id "+id)
        let p;
        let l = DrawingAppLogic.instance!.layerStack.find(e=>e.id==id);
        if(l == undefined){
            console.log("getRenderingProgram() - layer not found");
            return null;
        }
        if(l == DrawingAppLogic.instance!.layerStack[0]){
                if(l.fusion==true){
                    console.log("firstOneMask");
                    p = DrawingAppLogic.instance!.programs["firstLayerOneMask"];
                }else{
                    console.log("firstNoMask");
                    p = DrawingAppLogic.instance!.programs["firstLayerNoMask"];
                }
        }
        else if(l.clip == true && l.fusion==true){
            console.log("twoMask");
            p = DrawingAppLogic.instance!.programs["twoMask"];
        }
        else if(l.clip == true){
            console.log("oneMask");
            p = DrawingAppLogic.instance!.programs["oneMask"];
        }else if(l.fusion==true){
            console.log("oneMask");
            p = DrawingAppLogic.instance!.programs["oneMask"];
        }else{
            console.log("noMask");
            p = DrawingAppLogic.instance!.programs["noMask"];
        }

        return p;
    }

    public fill(l: LayerLogic){
            if(this.verbose)console.log("Drawing App -> draw - arguments : l "+l)
           
            //console.log("draw ", fill);
                //PAINT BRUSH
                console.log(JSON.stringify(this.tools.fill.getProgram()));
                this.tools.fill.useProgram();
                this.tools.fill.bindVAO();

                console.log("<<<<< ", this.fill);
    
                this.tools.fill.setSampler(l.textures.mains.textures[l.textures.mains.active  == 0 ? 0 : 1]!, "uSampler");
                console.log("fill render target -> ", l.textures.mains.active  == 0 ? 1 : 0);
                console.log(l.textures.mains.textures);


                this.gl.bindBuffer(this.gl.TEXTURE_2D, l.textures.mains.textures[l.textures.mains.active  == 0 ? 1 : 0]!);
                
    
               
                console.log("you draw last on ", l.textures.mains.textures[l.textures.mains.active  == 0 ? 1 : 0]!);
    
               
    }

    public setBrushHead(texture: Texture){
        if(this.verbose)console.log("Drawing App -> setBrushHead");
        this.brushHead = texture;
   }

   async loadImageFromPath(texture:Texture, path:string){
    if(this.verbose)console.log("Drawing App -> loadImageFromPath");
       
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);

        let im = new Image();
        await new Promise((res, rej)=>{
            im.onload = e=>{
                res(im)
             };
             im.src = path;
        });

        
     
        this.gl.bindBuffer(this.gl.PIXEL_UNPACK_BUFFER, null);
       
        let img = this.resizeImage(im);
  
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, img!.width, img!.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img!);

          
        //this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0,0, im.width, im.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.resizeImage(im), 0);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        
   }

   async fillBrushHead(path: string|null){
        if(this.verbose)console.log("Drawing App -> fillBrush");
        if(path!=null){
            this.brushHead && await this.loadImageFromPath(this.brushHead, path);
        }else{
            this.brushHead && await this.loadImageFromPath(this.brushHead, "./brushesHead/basic.png");
        }
        this.tools.brush.setSampler(this.brushHead!, "uBrushHead"); 

    }

    resizeImage(img: HTMLImageElement){
        let c = document.createElement("canvas");
        let ct = c.getContext("2d");
        c.width = this.gl.canvas.width;
        c.height = this.gl.canvas.height;
        ct?.drawImage(img, 0, 0, this.gl.canvas.width, this.gl.canvas.height);
       
        /*let url = c.toDataURL("image/png").replace("image/png", "image/octet-stream");
        let a = document.createElement("a");
        a.download="image.png";
        a.href=url;
        document.body.appendChild(a);
        a.click();*/
        let t =  ct?.getImageData(0,0,this.gl.canvas.width, this.gl.canvas.height);
        console.log(t);
        return t;
       
    
    }
    public normalizeCoords(x:number, y:number):[number, number]{
        return [ (2 * ((x - this.dims.x ) /this.dims.width) - 1 ),  (2 *( 1 - (y - this.dims.y ) /this.dims.height) - 1)];
    }

    public draw(l: LayerLogic, e: TouchEvent){
        if(this.verbose)console.log("Drawing App -> draw - arguments : l "+l+" e : ", e)
        
        //console.log("draw ", fill);
            //PAINT BRUSH
            console.log("fill render target -> ", l.textures.mains.active  == 0 ? 1 : 0);
        
         
            this.tools.brush.useProgram()
            .bindVAO()
            .setSampler(l.textures.mains.textures[l.textures.mains.active]!, "uSampler")
       
            .setRenderTarget(l.textures.mains.textures[l.textures.mains.active  == 0 ? 1 : 0]!)
            
            .updateUAngle()
            .setUColor()
            .setUBlur()
            .setUScale()
            .setUSize(this.tools.brush.getSize());
            //this.tools.brush.setCoordBuffer(400/20, [2 * ((e.touches[0].clientX - this.dims.x)/this.tools.brush.gl.canvas.width) - 1 ,  2 *( 1 - (e.touches[0].clientY - this.dims.y)/this.tools.brush.gl.canvas.height) - 1]);
           
            let [x, y ]= this.normalizeCoords(e.touches[0].clientX, e.touches[0].clientY);
            this.tools.brush.touch(x, y, e.touches[0].force);

           

            this.tools.brush.gl.bindFramebuffer(this.tools.brush.gl.FRAMEBUFFER, null);
            console.log("you draw last on ", l.textures.mains.textures[l.textures.mains.active  == 0 ? 1 : 0]!);

            //this.tools.brush.drawFill();


            console.log("final drawn texture is ", l.textures.mains.textures[l.textures.mains.active == 0 ? 1 : 0]!);
           
            //this.checkLayer(this.layerStack[this.activeLayerIndex],0)

            l.textures.mains.active = l.textures.mains.active == 0 ? 1 : 0;
          
    }

  

  

   public async initPrograms(){
    if(this.verbose)console.log("Drawing App -> initPrograms ")
        await Promise.all(Object.values(this.programs).map(async(pp) => {
            return new Promise<void>(async(resolve, reject)=>{
                await pp.createProgram();
                pp.setAttributes().setUResolution();
                resolve();
            })
        }));
   }
   public renderLayerStack2(){
  
    let prevOutput: LayerLogic = null!;
    for(let i = 0; i< this.layerStack.length; i++){
        let layer = this.layerStack[i];
        
        if(layer.visible == true){
           

            let m = this.programs.full;
            m.useProgram();
            m.bindVAO();
            m.setSampler(layer.textures.mains.textures[layer.textures.mains.active == 0 ? 0 : 1]!, "uSampler");
            m.setSampler(layer.fusion?layer.textures.fusion.texture!:this.fillTexture!, "uSamplerFusion");
            m.setSampler(layer.clip?layer.textures.clip.texture!:this.fillTexture!, "uSamplerClip");
            m.setSampler(this.selection?this.selectionTexture!:this.fillTexture!, "uSamplerSelection");

         
            m.setSampler(prevOutput != null?prevOutput.textures.mains.textures[prevOutput.textures.mains.active == 0 ? 0 : 1]!:this.fillTexture!, "uSamplerPrevOutput");
            
           
            m.setRenderTarget(layer.textures.output!);
            m.drawFill();
            m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);


            prevOutput = layer;
        }

    }
    if(prevOutput != undefined && prevOutput != null){
     
        this.tools.fill.setSampler(prevOutput.textures.output!, "uSamplerPrevOutput");
        this.tools.fill.drawFill();
        
    }else{
        console.log("prevOutput is null");
        
    }

   }

   

   public toImage():string{
   
        this.renderLayerStack2();
    
        let im = this.gl.canvas.toDataURL("image/png");
        
        return im;
    
   }
   public renderLayerStack(){
    console.log("layer render -------------------------------------------->");
        let firstLayerToRenderFound = false;
        let prevOutput = null;
        for(let i = 0; i< this.layerStack.length; i++){
            let layer = this.layerStack[i];
            if(layer.visible == true){
                console.log("                visible");
                if(firstLayerToRenderFound == false){  //first layer to render
                    console.log("                    first layer");
                    firstLayerToRenderFound = true;

                    if(layer.fusion == true){ // render main texture + fusion mask
                        console.log("                       fusion");
                        let m = this.programs.firstLayerOneMask;
                        m.useProgram();
                        m.bindVAO();
                        m.setSampler(layer.textures.mains.textures[layer.textures.mains.active == 0 ? 0 : 1]!, "uSampler");
                        m.setSampler(layer.textures.fusion.texture!, "uSamplerFusion");
                        
                        console.log("fill 4 ->");
                        m.setRenderTarget(layer.textures.output!);
                        m.drawFill();
                        m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);

                    }else{ //just render main texture
                        console.log("   first layer no mask");
                        let m = this.programs.firstLayerNoMask;
                            m.useProgram();
                            m.bindVAO();
                            console.log("render main texture no mask", layer.textures.mains.textures)
                            m.setSampler(layer.textures.mains.textures[layer.textures.mains.active == 0 ? 0 : 1]!, "uSampler");
                           
                           
                            console.log("fill ->");
                            m.setRenderTarget(layer.textures.output!);
                            m.drawFill();
                            m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);
                            
                            }
                        }else{
                    console.log("                    late layers");
                    if(layer.fusion == true && layer.clip == true){
                        console.log("                       fusion && clip");
                        let m = this.programs.twoMask;
                            m.useProgram();
                            m.bindVAO();
                            m.setSampler(layer.textures.mains.textures[layer.textures.mains.active == 0 ? 0 : 1]!, "uSampler");
                            m.setSampler(layer.textures.fusion.texture!, "uSamplerFusion");
                            m.setSampler(layer.textures.clip.texture!, "uSamplerClip");
                            if(prevOutput != null){
                                m.setSampler(prevOutput.textures.mains.textures[prevOutput.textures.mains.active == 0 ? 0 : 1]!, "uSamplerPrevOutput");
                            }
                            console.log("fill 7 ->");
                            m.setRenderTarget(layer.textures.output!);
                            m.drawFill();
                            m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);

                    }else{
                        if(layer.fusion == true){
                            console.log("                       fusion");
                            let m = this.programs.oneMask;
                            m.useProgram();
                            m.bindVAO();
                            m.setSampler(layer.textures.mains.textures[layer.textures.mains.active == 0 ? 0 : 1]!, "uSampler");
                            m.setSampler(layer.textures.fusion.texture!, "uSamplerFusion");
                            if(prevOutput != null){
                                m.setSampler(prevOutput.textures.mains.textures[prevOutput.textures.mains.active == 0 ? 0 : 1]!, "uSamplerPrevOutput");
                            }
                            console.log("fill 8 ->");
                            m.setRenderTarget(layer.textures.output!);
                            m.drawFill();
                            m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);

                        }else if(layer.clip == true){
                            console.log("                       clip");
                            let m = this.programs.oneMask;
                            m.useProgram();
                            m.bindVAO();
                            m.setSampler(layer.textures.mains.textures[layer.textures.mains.active]!, "uSampler");
                            m.setSampler(layer.textures.clip.texture!, "uSamplerFusion");
                            if(prevOutput != null){
                                m.setSampler(prevOutput.textures.mains.textures[prevOutput.textures.mains.active == 0 ? 0 : 1]!, "uSamplerPrevOutput");
                            }
                            console.log("fill 9 ->");
                            m.setRenderTarget(layer.textures.output!);
                            m.drawFill();
                            m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);
                        }else{
                            console.log("                       no mask");
                            let m = this.programs.noMask;

                            m.useProgram();
                            m.bindVAO();
                            m.setSampler(layer.textures.mains.textures[layer.textures.mains.active]!, "uSampler");
                            if(prevOutput != null){
                                m.setSampler(prevOutput.textures.mains.textures[prevOutput.textures.mains.active]!, "uSamplerPrevOutput");
                            }
                            console.log("fill 10 ->");
                            m.setRenderTarget(layer.textures.output!);
                            m.drawFill();
                            m.gl.bindFramebuffer(m.gl.FRAMEBUFFER, null);
                           
                        }
                    }
                }


               
                prevOutput = layer;
            }//if invisible do nothing
        }

        if(prevOutput != undefined && prevOutput != null){
            this.tools.fill.setSampler(prevOutput.textures.output!, "uSamplerPrevOutput");
            this.tools.fill.drawFill();
            
        }else{
            console.log("prevOutput is null");
            
        }
        
   }

 

   public listenToActions(){
    
    document.body.addEventListener("SHORTCUT", ((e:CustomEvent)=>{
        let amp = 1000;
        let amp2=3;
        let ampBlur = 0.5;
        let c;
        let z;
        console.log(e);
        switch(e.detail.type){
            case "SHIFT_W":
                console.log("SHIFT_W ",(e.detail.clientX - this.lastPos.x)/this.gl.canvas.width);
                this.tools.brush.setUSize(this.tools.brush.getSize() + (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * amp2)
                this.triggerRender();
                break;

            case "ALT_W":
                console.log("ALT_W");
                this.tools.brush.setUBlur(this.tools.brush.getBlur() + (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * amp2)
                this.triggerRender();
                break;

            case "SHIFT_Q":
                //HUE
                console.log(this.tools.brush.getColors());
                c = RGBToHSL(false, ...this.tools.brush.getColors().slice(0,3));
                console.log(c)
                c[0] += (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * amp;
                console.log(c);
                z = HSLToRGB(false, ...c);
                console.log(z)
                this.tools.brush.setUColor(...z, this.tools.brush.getColors()[3]);
                this.triggerRender();
                console.log(this.tools.brush.getColors());
                break;
       


            case "SHIFT_S":
                c = RGBToHSL(false, ...this.tools.brush.getColors().slice(0,3));
                c[1] += (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * amp;
                c[1] = clamp([c[1]], 0, 100)[0];


                c[2] -= (e.detail.clientY - this.lastPos.y)/this.gl.canvas.height * amp;
                c[2] = clamp([c[2]], 0, 100)[0];

                z = HSLToRGB(false, ...c);
                this.tools.brush.setUColor(...z, this.tools.brush.getColors()[3]);
                this.triggerRender();
                break;


            case "SHIFT_D":
                c = this.tools.brush.getColors();
                c[3] += (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * 2;
                this.tools.brush.setUColor(...c);
                this.triggerRender();
                break;

            case "ALT_SHIFT_A":
                let direction = [(e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * 2, (e.detail.clientY - this.lastPos.y)/this.gl.canvas.height * 2];
               
                this.setRotationAngle(direction[0]<0 || direction[1]<0?false:true);
                this.tools.brush.updateUAngle();
                console.log("/n ICI  /n"+ this.tools.brush.getUAngle());
                this.triggerRender();
                break;

            case "SHIFT_A":
                c = this.getScale();
                c += (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * 2;
                this.setScale(c);
                this.triggerRender();
                break;

            case "ALT_A":
                c = this.getTranslate();
               
                c[0] += (e.detail.clientX - this.lastPos.x)/this.gl.canvas.width * 100;
                c[1] += (e.detail.clientY - this.lastPos.y)/this.gl.canvas.height * 100;
                this.setTranslate(c[0], c[1]);
                this.triggerRender();
                break;
            
        }
        this.lastPos.x = e.detail.clientX;
        this.lastPos.y = e.detail.clientY;
    }) as EventListener)



    window.addEventListener("keydown", e=>{
        console.log(e)
        if(e.shiftKey == true){
            this.keyboards.Shift = true;
        }
        if(e.altKey == true){
            this.keyboards.Alt = true;
        }
       
        Object.keys(this.keyboards).forEach((k, index)=>{
            if(!["Shift", "Alt"].includes(k)){
                if(e.key.toLowerCase()==k){
                    this.keyboards[k] = true;
                    return;
                }

            }
        })
        if(this.keyboards["q"] && this.keyboards["Alt"]){
            let el = document.querySelector(".promptAi") as HTMLDivElement;
            el!.style.display = el.style.display =="none"?"block":"none";
            this.triggerRender();
        }
    });

    window.addEventListener("keyup", e=>{
        if(e.shiftKey == false){
            this.keyboards.Shift = false;
        }
        if(e.altKey == false){
            this.keyboards.Alt = false;
        }
       
        Object.keys(this.keyboards).forEach((k, index)=>{
            if(!["Shift", "Alt"].includes(k)){
                if(e.key.toLowerCase()==k){
                    this.keyboards[k] = false;
                    return;
                }

            }
        })
    });

    console.log("DrawingApp -> listenToAction");

        this.gl.canvas.addEventListener("touchstart", e=>{
            e.preventDefault();
            this.lastPos.x = e.touches[0].clientX;
            this.lastPos.y = e.touches[0].clientY;
            console.log("pen down");
            this.penDown = true;




            let m = Object.keys(this.keyboards).map((k, index)=>{
                if(!["Shift", "Alt"].includes(k)){
                    if(this.keyboards.Shift==true && this.keyboards.Alt==true && this.keyboards[k]==true){
                        document.body.dispatchEvent(new CustomEvent("SHORTCUT", {detail: {type: "ALT_SHIFT_"+k.toUpperCase(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}
                                 }));
                                 return true;
                    }

                    if(this.keyboards.Shift==true && this.keyboards[k]==true){
                        document.body.dispatchEvent(new CustomEvent("SHORTCUT", {detail: {type: "SHIFT_"+k.toUpperCase(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}
                                 }));
                                 return true;
                    }
                    if(this.keyboards.Alt==true && this.keyboards[k]==true){
                        document.body.dispatchEvent(new CustomEvent("SHORTCUT", {detail: {type: "ALT_"+k.toUpperCase(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}
                                 }));
                        return true;
                    }

                    return false;
                }
            })
            if(m.includes(true)) return;
            
            // TO DO document.body.dispatchEvent(new CustomEvent("DRAW", {detail: { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}}));
            let l;
            //alert(JSON.stringify(ToolsDict[this.getActivity()].elements[this.getTool()]));
            
            switch(ToolsDict[this.getActivity()].elements[this.getTool()].type){
                case Tools_BASE.BRUSH:
                 
                    l = this.layerStack.find(e=>e.id == this.activeLayerIndex);
                    if(l != null && l != undefined){
                        console.log(l)
                        //this.tools.brush.sketch(e);
                        this.draw(l, e);
                        this.renderLayerStack2();
                    }else{
                        alert("no layer selected !")
                    }
                    break;
                case Tools_BASE.ERASER:
                    console.log("ERASER ", );
                    l = this.layerStack.find(e=>e.id == this.activeLayerIndex);
                    if(l != null && l != undefined){
                        console.log(l)
                        this.tools.eraser.erase(e);
                        
                        this.renderLayerStack2();
                    }else{
                        alert("no layer selected !")
                    }
                    break;
                case Tools_BASE.LASSO:
                    break;
            }
            
           
            
        
          

        });
        window.addEventListener("touchmove", e=>{
            if(this.penDown){
                e.preventDefault();
                let m = Object.keys(this.keyboards).map((k, index)=>{
                    if(!["Shift", "Alt"].includes(k)){
                        if(this.keyboards.Shift==true && this.keyboards.Alt==true && this.keyboards[k]==true){
                            document.body.dispatchEvent(new CustomEvent("SHORTCUT", {detail: {type: "ALT_SHIFT_"+k.toUpperCase(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}
                                     }));
                                     return true;
                        }

                        if(this.keyboards.Shift==true && this.keyboards[k]==true){
                            document.body.dispatchEvent(new CustomEvent("SHORTCUT", {detail: {type: "SHIFT_"+k.toUpperCase(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}
                                     }));
                                     return true;
                        }
                        if(this.keyboards.Alt==true && this.keyboards[k]==true){
                            document.body.dispatchEvent(new CustomEvent("SHORTCUT", {detail: {type: "ALT_"+k.toUpperCase(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}
                                     }));
                            return true;
                        }

                        return false;
                    }
                })
                if(m.includes(true)) return;
                
                // TO DO document.body.dispatchEvent(new CustomEvent("DRAW", {detail: { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}}));
                let l;
                //alert(JSON.stringify(ToolsDict[this.getActivity()].elements[this.getTool()]));
                
                switch(ToolsDict[this.getActivity()].elements[this.getTool()].type){
                    case Tools_BASE.BRUSH:
                     
                        l = this.layerStack.find(e=>e.id == this.activeLayerIndex);
                        if(l != null && l != undefined){
                            console.log(l)
                            //this.tools.brush.sketch(e);
                            this.draw(l, e);
                            this.renderLayerStack2();
                        }else{
                            alert("no layer selected !")
                        }
                        break;
                    case Tools_BASE.ERASER:
                        console.log("ERASER ", );
                        l = this.layerStack.find(e=>e.id == this.activeLayerIndex);
                        if(l != null && l != undefined){
                            console.log(l)
                            this.tools.eraser.erase(e);
                            
                            this.renderLayerStack2();
                        }else{
                            alert("no layer selected !")
                        }
                        break;
                    case Tools_BASE.LASSO:
                        break;
                }
                
               
                
            }
        });
        window.addEventListener("touchend", e=>{
            if(this.penDown){
               e.preventDefault();
                
                this.penDown = false;
                let m = Object.keys(this.keyboards).map((e:string, index)=>{
                    if(!["Shift", "Alt"].includes(e)){

                        if(this.keyboards.Shift==true && this.keyboards[e]==true){
                            //
                            return true;
                        }
                        if(this.keyboards.Alt==true && this.keyboards[e]==true){
                            //
                            return true;
                        }
                        return false;

                    }
                })

                if(m.includes(true)) return;

                switch(ToolsDict[this.activityIndex].elements[this.activityIndex].type){
                    case Tools_BASE.BRUSH:
                        this.renderLayerStack2();
                        break;
                    case Tools_BASE.ERASER:
                        this.renderLayerStack2();
                        break;
                    case Tools_BASE.LASSO:
                        break;
                }

                
             
                
            }
        });
   }
  

    
}
