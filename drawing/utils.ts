

export interface Texture{
    texture: WebGLTexture,
    index: number,
    isSet: Boolean,
    usedBy: number,
    role: TextureRole
}

export enum TextureRole{
    MAIN_1,
    MAIN_2,
    CLIP,
    FUSION,
    OUTPUT,
    SELECTION,
    FILL,
    BRUSH_HEAD,
    NO_ROLE
}


export enum Activity{
    BASE,
    GLSL,
    THREE
  }
  
export enum Tools_BASE{
    BRUSH,
    ERASER,
    LASSO,
    ZOOM,
    MOVE
}
export enum Tools_GLSL{
    DEFAULT
}

export enum Tools_THREE{
    DEFAULT
}

export function clamp(arr: number[], min: number, max: number){
    for(let i=0; i<arr.length; i++){
        if(arr[i]>max){
            arr[i] = max;
        }
        if(arr[i]<min){
            arr[i] = min;
        }
    }
    return arr;
}



export function RGBToHSL(n=false,...rgb:number[]){
        let r = n?normalize(rgb[0]):rgb[0];
        let g = n?normalize(rgb[1]):rgb[1];
        let b = n?normalize(rgb[2]):rgb[2];
        
        let min = Math.min(r, g, b);
        let max = Math.max(r, g, b);
        
        let delta = max - min;
       
       let H_ = ()=>{
           if(delta == 0) return 0;
        if(r == max){
            return ((g - b)/delta)%6;
        }
        if(g == max){
            return ((b - r)/delta)+2;
        }
        if(b == max){
            return ((r - g)/delta)+4;
        }
        
       }
       
       let H = H_()!*60;
       let L = (max+min) / 2;
       
       let S = (()=>{
           if(delta==0) return 0;
        return delta/(1-Math.abs(2*L - 1));
       })();
       
       return [parseFloat((H).toFixed(2)), parseFloat((S*100).toFixed(2)), parseFloat((L*100).toFixed(2))];
        
      }
      
export function normalize(nu: number){
          return nu/255;
      }
      
export function HSLToRGB(n=false,...hsl: number[]){
          let h = hsl[0];
          let s = hsl[1];
          let l = hsl[2];
      
        s /= 100;
        l /= 100;
        const k = (n:number) => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) =>
          l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [parseFloat((f(0) * (n?255:1)).toFixed(2)), parseFloat((f(8) * (n?255:1)).toFixed(2)),  parseFloat((f(4)*( n?255:1)).toFixed(2))];
      };
      
export function length(A:[number, number], B:[number, number]){
    return Math.sqrt((B[0] - A[0])**2 + (B[1] - A[1])**2 );
}
export function getAngle(center: [number, number], point: [number, number]){
    point = [point[0]-center[0], point[1]-center[1]];
    let hypo = length(point, [0,0]);
    let adj =  length([point[0], 0], [0,0]);
    let cosinus = adj/hypo
    let angle = Math.acos(cosinus);
    let sinus = Math.sin(angle);
    console.log("angle : ",angle/(Math.PI*2)*360);
    return angle;
}