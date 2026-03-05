
import {useEffect,useState} from "react"
import {io} from "socket.io-client"

const socket = io()

export default function Player(){

const [state,setState] = useState(null)

useEffect(()=>{
socket.on("state",(s)=>setState(s))
},[])

if(!state) return <div>Loading…</div>

return(
<div style={{fontFamily:"sans-serif",padding:40}}>

<h1>Bingo Live</h1>

{state.triggered.map((e,i)=>(
<div key={i}>{e}</div>
))}

</div>
)

}
