import { Activity } from "../../drawing/utils";
import { ToolsDict } from "../ToolsDict";


export function Base(){
    return (
        <div>
            {
                ToolsDict.filter(a=>a.type==Activity.BASE)[0].elements.map((e,index)=>{
                    return <li key={index}><img src={"./icons/"+e.icon}/></li>
                })
            }
        </div>
    )
}