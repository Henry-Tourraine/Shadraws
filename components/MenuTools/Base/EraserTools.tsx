import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useContext, useEffect, useRef } from "react";
import { GlobalContext, useGlobalContext } from "../../../context/GlobalContext";
import { Activity, RGBToHSL, Tools_BASE } from "../../../drawing/utils";
import { ToolsDict } from "../../ToolsDict";

export interface EraserToolsProps{
    shape: number;
    size: number;
    blur: number;
}

export default function EraserTools(){
    let context = useGlobalContext();
    let canvas = useRef<HTMLCanvasElement>(null);
   
 
        if(context.app && canvas.current!){
            let ctx = canvas.current!.getContext("2d");
            ctx!.fillStyle = "rgba("+context.app!.tools.brush.getColors().map(e=>e*255).join(", ")+")";
            ctx!.fillRect(0, 0, canvas.current!.width, canvas.current!.height);
    }
   
   
    return(<div className="upperToolsWrapper">
        <div >
          Shape: 
        </div>
        <div>
            Size : {context.app! && context.app!.tools.brush.getSize()}
        </div>
        <div>
            Blur : {context.app! && context.app!.tools.brush.getBlur()}
        </div>
        <div className="flex flex-row">
            Color : {
                context.app! && context.app!.tools.brush.getColors()[3]
            }
            <canvas ref={canvas} width={50} height={50}/>
        </div>
        
    </div>)
}