import { createContext, useContext, useState } from "react"
import internal from "stream"
import { mayDrawingAppLogic } from "../components/DrawingAppUI"
import { DrawingAppLogic } from "../drawing/app"
import { Activity, Tools_BASE, Tools_GLSL, Tools_THREE } from "../drawing/utils"



export type GlobalContext = {
  app: mayDrawingAppLogic
  setApp: (app: mayDrawingAppLogic)=>void
  test: number,
  setTest: (n:number)=>void,
  activity: Activity,
  setActivity: (activity:Activity)=>void,
  tools: Tools_BASE|Tools_GLSL|Tools_THREE,
  setTools: (tools: Tools_BASE|Tools_GLSL|Tools_THREE)=>void
  
}


export const Context = createContext<GlobalContext>({
  app: null,
  setApp: function(app:mayDrawingAppLogic){this.app=app;},
  test: 9,
  setTest: function(n:number){this.test=n},
  activity: Activity.BASE,
  setActivity: function(activity: Activity){},
  tools: Tools_BASE.BRUSH,
  setTools: function(tools: Tools_BASE|Tools_GLSL|Tools_THREE){}

})


export const useGlobalContext = () => useContext(Context)
