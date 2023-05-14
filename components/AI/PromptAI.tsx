import { allowedNodeEnvironmentFlags } from "process";
import { useEffect, useRef, useState } from "react";
import { resourceLimits } from "worker_threads";
import { useGlobalContext } from "../../context/GlobalContext";
import { Activity } from "../../drawing/utils";


export enum AI{
    SCRIBBLE,
    INPAINT
}

export function PromptAI(){
    let SERVER = "promptAI";
    let [server, updateServer] = useState("");
    let results = useRef<HTMLDivElement>(null);
    let [service, setService] = useState(AI.SCRIBBLE)


    async function fetchImages(route: string, body="{}"){
        console.log(body)
        return await fetch(getServer()+route, {method: "POST", body, headers: {"Accept": "application/json", "Content-Type": "application/json"}})
        .then(e=>e.json())
        .then(e=>{
            
            console.log("result : ", e.prompt);
            return e.result;
            
        })
    }

    function setServer(name: string){
        return localStorage.setItem(SERVER, name);
    }

    function getServer(){
        return localStorage.getItem(SERVER);
    }

    useEffect(()=>{

        updateServer(getServer()!);
    })
    

    return (<div className="promptAi absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg z-50" style={{width: "600px", height: "550px", padding: "1em", justifyContent: "space-between", display: "none", flexFlow: "wrap row", zIndex: "9999999"}}>
        <div className="bg-white rounded-lg z-50 top-0 left-0 absolute" style={{width: "600px", height: "550px", padding: "1em", justifyContent: "space-between", display: "flex", flexFlow: "wrap row", zIndex: "9999999"}}>
        <div>
            <div className="flex flex-row" style={{paddingBottom: "2em"}}>
                <div className="w-fit cursor-pointer mx-3" style={service==AI.SCRIBBLE?{borderBottom: "solid black 1px"}:{}} onClick={()=>{
                    setService(AI.SCRIBBLE)
                }}>Scribble</div>
                <div className="w-fit cursor-pointer mx-3" style={service==AI.INPAINT?{borderBottom: "solid black 1px"}:{}}
                onClick={()=>{
                    setService(AI.INPAINT)
                }}
                >Inpaint</div>
            </div>
            <div className="input">
            <input type="text" onInput={(e)=>{
                setServer(e.target.value);
                updateServer(e.target.value);
            }} value={ server!}/>
            <label>Serveur</label>
            </div>
            {service == AI.SCRIBBLE && <Scribble submit={fetchImages} results={results.current!}/>}
           {service == AI.INPAINT &&  <Inpaint submit={fetchImages} results={results.current!}/>}
        </div>
        <div style={{borderLeft: "solid black 1px", paddingLeft: "1em"}}>
            <label >Résultats :</label>
            <div style={{width: "300px", height: "300px", background: "black", display: "grid", gridTemplateColumns: "auto/auto", gridTemplateRows: "auto/auto"}} ref={results}></div>
        </div>
        </div>
    </div>)
}

interface ScribbleProps{
    submit: (name:string, body: string)=>Promise<[string, string, string, string]>
    results: HTMLDivElement
}
export function Scribble(props: ScribbleProps){
    let { app, setApp, setTest, test} = useGlobalContext();
    let [prompt, setPrompt] = useState("bruno mars smiling");
    let canvas = useRef<HTMLCanvasElement>(null);
    let loader = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        let c = canvas.current;
        let ctx = c?.getContext("2d");
        if(app){
            app?.renderLayerStack2();
            //data:image/png;base64,
            let url = app?.toImage();
            let im = new Image();
            im.addEventListener("load", e=>{
                c!.width = im.width;
                c!.height = im.width;
                ctx?.drawImage(im, 0, 0);
            })
            im.src = url;
        }
        
    })

    return (<div className="bg-inherit">
        <div className="input">
            <input type="text" placeholder="votre prompt" value={prompt} onInput={(e:InputEvent)=>setPrompt(e!.target!.value)}/>
            <label>prompt</label>
        </div>
        <div className="input">
            <p>votre image</p>
            <canvas style={{width: "200px", height: "200px"}} ref={canvas}></canvas>
        </div>
        <div className="flex flex-row items-center" style={{marginTop: "1em"}}>
            <button onClick={async()=>{
                //app?.createLayer(Activity.BASE);
                //app?.triggerRender();
                
                loader.current!.style.display = "block";
               /* let a = document.createElement("a") as HTMLAnchorElement;
                a.href = app?.toImage()!;
                a.download= "image.png";
                document.body.appendChild(a);
                a.click();*/
                let res = await props.submit("scribble", JSON.stringify({
                    prompt,
                    image: app?.toImage()!.split(",")[1]
                }));
                props.results.innerHTML = "";
                res.map(async(e, index)=>{
                    let img = document.createElement("img");
                    let row = Math.floor(index/2) ;
                    let col = index/2+1;
                    img.src = "data:image/png;base64,"+e;
                    img.style.gridArea = row+"/"+col+"/"+(row+1)+"/"+(col+1);
                    img.addEventListener("click", async(e)=>{
                        app?.createLayerWithImage(e.target as HTMLImageElement);
                        await new Promise(res=>setTimeout(res, 2000))
                        app?.renderLayerStack2();
                        app?.triggerRender();
                    
                    })
                    props.results.appendChild(img);
                })
                loader.current!.style.display = "none";
            }}>Envoyer</button>
            <div className="loader" ref={loader}></div>
        </div>
    </div>)
}



export function Inpaint(props: ScribbleProps){
    let { app, setApp, setTest, test} = useGlobalContext();
    let mask = useRef<HTMLCanvasElement>(null);
    let canvas = useRef<HTMLCanvasElement>(null);
    let [radius, setStatus ]= useState(5);
    let [blank, setBlank] = useState(false);

    //for base image
    useEffect(()=>{
        let c = canvas.current;
        let ctx = c?.getContext("2d");
        if(app){
            app?.renderLayerStack2();
            //data:image/png;base64,
            let url = app?.toImage();
            let im = new Image();
            im.addEventListener("load", e=>{
                c!.width = im.width;
                c!.height = im.width;
                ctx?.drawImage(im, 0, 0);
            })
            im.src = url;
        }
        
    })

    //for mask
    useEffect(()=>{
        let ctx = mask.current?.getContext("2d");
        if(blank==false){
            ctx!.fillStyle = "white";
            ctx!.fillRect(0,0, mask.current?.width!, mask.current?.height!);
            setBlank(true);
        }
        
        ctx!.fillStyle = "black";
        let touch = false;
        let dims = mask.current?.getBoundingClientRect();
        let start = ((e:Event)=>{
            touch=true;
        }) as EventListener;
        let move = ((e:TouchEvent)=>{
            if(touch){
                
                let centerX =  (e.touches[0].clientX - dims!.x) * mask.current!.width/parseInt(mask.current!.style.width);
                let centerY =  (e.touches[0].clientY - dims!.y) * mask.current!.height/parseInt(mask.current!.style.height);
                ctx!.beginPath();
                ctx!.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                ctx!.fillStyle = 'black';
                ctx!.fill();
                //ctx!.lineWidth = 50;
                ctx!.strokeStyle = '#000000';
                ctx!.stroke();

            }
        }) as EventListener;

        let end = ((e:TouchEvent)=>{
            if(touch){
               /* 
                let centerX =  e.touches[0].clientX - dims!.x;
                let centerY =  e.touches[0].clientY - dims!.y;
                ctx!.beginPath();
                ctx!.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                ctx!.fillStyle = 'black';
                ctx!.fill();
                ctx!.lineWidth = 50;
                ctx!.strokeStyle = '#000000';
                ctx!.stroke();*/
                touch=false;
            }
        }) as EventListener;

        mask.current?.addEventListener("touchstart", start)

        mask.current?.addEventListener("touchmove", move)

        mask.current?.addEventListener("touchend", end)

        return ()=>{
            mask.current?.removeEventListener("touchstart", start);

            mask.current?.removeEventListener("touchstart", move);

            mask.current?.removeEventListener("touchend", end);
        }

    })
    return (<div>
        <div className="input">
            <input type="text" placeholder="votre prompt"/>
            <label>prompt</label>
        </div>
        <p className="py-5">votre image</p>
        <div className="relative">
            
            <canvas ref={mask} style={{width: "200px", height: "200px"}} className="absolute z-10 top-0 left-0  opacity-50"></canvas>
            <canvas style={{width: "200px", height: "200px"}} ref={canvas}></canvas>
        </div>
       
       
        <div>
        <button onClick={async()=>{
                let res = await props.submit("scribble", JSON.stringify({
                    prompt,
                    image: app?.toImage().split(",")[1],
                    mask: mask.current?.toDataURL("image/png").split(",")[1]//.replace("image/png", "image/octet-stream")
                }));
                res.map(async(e, index)=>{
                    let img = document.createElement("img");
                    let row = Math.floor(index/2) ;
                    let col = index/2+1;
                    img.src = "data:image/png;base64,"+e;
                    img.style.gridArea = row+"/"+col+"/"+(row+1)+"/"+(col+1);
                    props.results.appendChild(img);
                })
            }}>Envoyer</button>
        </div>
    </div>)
}