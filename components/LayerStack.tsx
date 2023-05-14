import { JSXElementConstructor, use, useEffect, useMemo, useState } from "react";
import { DrawingAppLogic } from "../drawing/app";
import { mayDrawingAppLogic_ } from "./DrawingAppUI";
import LayerUI from "./LayerUI";
import { LayerLogic } from "../drawing/LayerLogic";
import { useGlobalContext } from "../context/GlobalContext";

interface LayerStackUI{
    layers: Array<LayerLogic>
}


export function LayerStack(props: LayerStackUI){
    let {layers} = props;
    let {app, setApp, setTest, test} = useGlobalContext();


    return(
        <div>
          
            <h3>Layers  Stack</h3>
            <div>
                {!!layers?"Nombre de layers :"+ layers.length:"doesn't exist"}
           {
                !!layers && layers.slice(0).reverse().map((e,index)=>{
                    return <LayerUI key={index} layer={e}/>})
            }
            </div>
        </div>
    )
}