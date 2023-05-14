import { LayerLogic } from "../drawing/LayerLogic";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as ftw from '@fortawesome/free-solid-svg-icons'
import {useGlobalContext} from '../context/GlobalContext';
import { Layer } from "@fortawesome/fontawesome-svg-core";


interface LayerUIProps{
    layer: LayerLogic
}

export default function LayerUI(props: LayerUIProps){
    let {layer} = props;
    let {app, setApp, setTest, test} = useGlobalContext();
    

  
    return(
        <div>
           
            <div style={{background: layer.active?"blue":"white"}}>
                
                <div onClick={()=>{
                    
                    layer.setActiveLayer();
                    //setTest(test+1);
                    
                    

                }}>
                {layer.id}
                </div>
                <FontAwesomeIcon className="w-6" icon={ftw.faEye} style={{opacity: layer.visible?1:0.5}} onClick={()=>{
                    layer.setVisible(layer.visible?false:true);
                }}/>
                <div className="fusion"><div></div></div>
                <FontAwesomeIcon className="rotate-180 w-6" icon={ftw.faArrowTurnRight} />
            </div>
        </div>
    )
}