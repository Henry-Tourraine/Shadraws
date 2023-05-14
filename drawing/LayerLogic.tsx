import React, { RefObject, useState } from "react";
import { Activity, Texture, TextureRole } from "./utils";
import { Program } from "./programs/programs";
import { DrawingAppLogic } from "./app";
import { ToolsDict } from "../components/ToolsDict";

export interface LayerProps{
    id: number,
    getRenderingProgram: Function,
    activity: Activity,
    parent: DrawingAppLogic
}

export interface LayerTextures{
    mains: {
        active: number,
        textures: Array<Texture|null>
    }
    clip: {isClipped: Boolean, texture: Texture|null}
    fusion: {isMasked: Boolean, texture: Texture|null}
    output: Texture|null
}


export interface LayerState{
    id: number,
    visible: Boolean,
    fusion: Boolean,
    clip: Boolean,
    active: Boolean,
    program: Program|null,
    getRenderingProgram: Function,
    textures: LayerTextures,
    parent: DrawingAppLogic,
    activity: Activity
}

export class LayerLogic{
    verbose: Boolean;
    id: number;
    visible: Boolean;
    fusion: Boolean;
    clip: Boolean;
    active: Boolean;
    program: Program|null;
    getRenderingProgram: Function;
    textures: LayerTextures;
    parent: DrawingAppLogic;
    activity: Activity;

    constructor(props: LayerProps){
    
        this.visible= true,
        this.fusion= false,
        this.clip= false,
        this.id= props.id,
        this.active= false,
        this.getRenderingProgram= props.getRenderingProgram,
        this.program= null,
        this.activity = props.activity;
        this.parent= props.parent,
        this.textures= {mains: {active: 0, textures: [props.parent.findFreeTexture(props.id, TextureRole.MAIN_1), props.parent.findFreeTexture(props.id,  TextureRole.MAIN_2)]}, clip: {isClipped: false, texture: props.parent.findFreeTexture(props.id,  TextureRole.CLIP)}, fusion: {isMasked: false, texture: props.parent.findFreeTexture(props.id,  TextureRole.FUSION)}, output: props.parent.findFreeTexture(props.id,  TextureRole.OUTPUT)}
    
        this.verbose = true;
        this.setProgram();
       
    }

    
    setProgram(){
      
        this.program= this.getRenderingProgram();
    }
    setVisible(v: Boolean){
        this.visible= v;
        this.parent.renderLayerStack2();// canvas render
        this.parent.triggerRender(); //for html render
    }
    
    setFusion(f: Boolean){
        this.fusion= f;
        this.parent.renderLayerStack2();// canvas render
        this.parent.triggerRender(); //for html render
    }

    setClip(c: Boolean){
        this.clip = c;
        this.parent.renderLayerStack2();// canvas render
        this.parent.triggerRender(); //for html render
    }

    setActive(a: Boolean){
       
        this.active = a;
    }

    remove(){
        console.log(this.parent.layerStack);
        
        let i = this.parent.layerStack.findIndex(e=>e.id==this.id);
        this.parent.layerStack.splice(i, 1);
        this.parent.triggerRender();
       
    }

    setActiveLayer(){
        if(this.verbose)console.log("Drawing App -> setActiveLayer - arguments : id "+this.id)
       
        this.parent!.layerStack.map(l=>{
           
                l.active = false;
            
        });
        this.active = true;
        console.log("setActiveLayer found", this.id);
        this.parent.setActiveLayer(this.id);
       
    }
   

    render(): React.ReactNode {
        return(

        <div className={"layer "+(this.active==true?" bg-slate-700":"")} id={"layer"+this.id} onClick={()=>{
            this.remove();
            }}>
            <input type="checkbox" className="visible" onChange={()=>this.setVisible(this.visible ?false:true)}  />
            <input type="checkbox" className="fusion" onChange={()=>this.setFusion(this.fusion ?false:true)}/>
            <input type="checkbox" className="clip" onChange={()=>this.setClip(this.clip ?false:true)}/>
            <p>layer {this.id}</p>
        </div>  
        )
    }
}

    



