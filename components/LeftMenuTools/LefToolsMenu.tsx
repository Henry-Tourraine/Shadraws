import { useGlobalContext } from "../../context/GlobalContext";
import { Activity } from "../../drawing/utils";
import { ToolsDict } from "../ToolsDict";


export function LeftToolsMenu(){
    let {app, setApp, setTest, test} = useGlobalContext();
    return (
        <div>
            {
                !!app && ToolsDict.filter(a=>a.type == (ToolsDict[!!app?app.getActivity():0].type))[0].elements.map((e,index)=>{
                    return <li className={"rounded-lg border-slate-800 my-1 border-4 p-2 "+(!!app && app!.getTool()==index?"bg-slate-600":"")} key={index}
                    onClick={()=>{
                          app?.setTool(index);
                          //alert(JSON.stringify(ToolsDict[0].elements[app!.getTool()]));
                    }}
                    ><img src={"./icons/"+e.icon} className="w-10 h-10" style={{mixBlendMode: "multiply"}}/></li>
                })
            }
        </div>
    )
}