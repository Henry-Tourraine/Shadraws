import { useGlobalContext } from "../context/GlobalContext";


export default function MainMenu(){
    let { app, setApp, setTest, test} = useGlobalContext();
    
    function record(){
        console.log("record");
    }
    
    async function save(){
        console.log("save");
        let url = app?.toImage();
        let a = document.createElement("a") as HTMLAnchorElement;
        a.href= url!;
        a.download = "shadraws.png";
        document.body.appendChild(a);
        a.click();
        
    }
    
    function setServeur(){
    
    }
    function displayShortCut(){
    
    }
    
    let menu = {
        mainMenu: [
            {name: "File", items: [
                {name: "Save", function: save},
                {name: "Record", function: record}
            ]},
            {name: "Edit", items:[
                {name: "raccourcis", function: displayShortCut}
            ]},
            {name: "AI", items: [
                {name: "setServeur", function: setServeur}
            ]}
        ]
    };
    return(
        <div className="mainMenuWrapper">
            <ul className="mainMenu">
                {menu.mainMenu.map((e, index)=>(
                    <div className="mainMenuItem" key={index}>
                        <div className="mainMenuItemName">{e.name}</div>
                       <ul className="mainMenuItemContent">{ e.items.map((ee, index2)=>{
                            return <li key={index2} onClick={ee.function}>{ee.name}</li>
                        })}</ul>
                    </div>
                ))}
            </ul>
        </div>
    )
}