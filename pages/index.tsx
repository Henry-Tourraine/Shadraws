import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'


import {useRef, useState, useEffect } from "react";


import vertexShaderSource from "../shaders/test/vert" ;
import fragmentShaderSource from "../shaders/test/frag" ;


import { LayerStack } from '../components/LayerStack';
import { DrawingAppUI } from '../components/DrawingAppUI';


//const inter = Inter({ subsets: ['latin'] })


function Home() {
  let canvas = useRef<HTMLCanvasElement>(null);
  let [p, setP] = useState("");
  let [gl, setGL] = useState(canvas.current?.getContext("webgl2"));
  let MAX_TEXTURES = 4 * 5;
  
   

    
 
  
 
  return (
    
   <DrawingAppUI/>
  )
}


export default Home
