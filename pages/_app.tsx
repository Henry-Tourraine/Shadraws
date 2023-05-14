import '../styles/globals.css'
import type { AppProps } from 'next/app'
import '../styles/index.css';
import { Context } from "../context/GlobalContext";
import { useState } from 'react';
import { Activity, Tools_BASE, Tools_GLSL, Tools_THREE } from '../drawing/utils';

function MyApp({ Component, pageProps }: AppProps) {
  let [test, setTest] = useState(2);
  let [app, setApp] = useState(null);
  return (
    <Context.Provider value={{app, setApp, test, setTest: setTest, activity: Activity.BASE, setActivity: function(activity: Activity){this.activity=activity},tools: Tools_BASE.BRUSH,  setTools: function(tools: Tools_BASE|Tools_GLSL|Tools_THREE){this.tools=tools}}}>
      <Component {...pageProps} />
  </Context.Provider>
 
  )
}


export default MyApp
