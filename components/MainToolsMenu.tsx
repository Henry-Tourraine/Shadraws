import { useEffect } from "react";
import { useGlobalContext } from "../context/GlobalContext";
import { Tools } from "../drawing/app";
import { Activity, Tools_BASE, Tools_GLSL, Tools_THREE } from "../drawing/utils"
import BrushTools from "./MenuTools/Base/BrushTools";
import EraserTools from "./MenuTools/Base/EraserTools";
import LassoTools from "./MenuTools/Base/LassoTools";
import { ToolsDict } from "./ToolsDict";


export default function MainToolsMenu(){
    let {activity, tools, app} = useGlobalContext();
    let content = <div></div>;
    
    
    /*
    if(activity == Activity.BASE && tools == Tools_BASE.BRUSH){
        content = <BrushTools/>
    }

   
    else if(activity == Activity.BASE && tools == Tools_BASE.ERASER){
        content= <EraserTools/>
    }
    else if(activity == Activity.BASE && tools == Tools_BASE.LASSO){
        content = <LassoTools/>
    }*/
    return (
        <div >
            {
               activity != null && ToolsDict.filter(t=>t.type == activity)[0].elements[!!app?app.getTool():0].element()
                
            }
            
        </div>
    )
}