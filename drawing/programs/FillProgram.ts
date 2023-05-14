import { StaticImageData } from "next/image";
import { DrawingAppLogic } from "../app";
import { clamp, Texture } from "../utils";
import { Program } from "./programs";



 export class FillProgram extends Program{
        
    constructor(gl: WebGL2RenderingContext, vert: string, frag: string, verbose:Boolean=false){
        super(gl, vert, frag, verbose);
        }

 }
