import { Activity, Tools_BASE, Tools_GLSL, Tools_THREE } from "../drawing/utils"
import BrushTools from "./MenuTools/Base/BrushTools";
import EraserTools from "./MenuTools/Base/EraserTools";
import LassoTools from "./MenuTools/Base/LassoTools";

export const ToolsDict = [
    {type: Activity.BASE, elements: [
        {type: Tools_BASE.BRUSH, icon: "pen-tool.png", element: BrushTools},
        {type: Tools_BASE.ERASER, icon: "eraser.png", element: EraserTools},
        {type: Tools_BASE.LASSO, icon: "lasso.png", element: LassoTools}
    ]},
    {
        type: Activity.GLSL, elements: [
            {type: Tools_GLSL.DEFAULT, icon: "pen-tool.png", element: LassoTools}
        ]
    },
    {
        type: Activity.THREE, elements: [
            {type: Tools_THREE.DEFAULT,icon: "pen-tool.png",element: LassoTools}
        ]
    }
]