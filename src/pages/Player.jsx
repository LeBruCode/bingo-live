
import {useEffect,useState} from "react"
import {io} from "socket.io-client"

const socket = io()

export default function Player(){

const [card,setCard] = useState(null)
const [state,setState] = useState(null)

useEffect(()=>{

socket.on("card",c=>setCard(c))
socket.on("state",s=>setState(s))

},[])

if(!card) return <div>Loading…</div>

return(

<div style={{fontFamily:"sans-serif",padding:40}}>

<h1>Bingo</h1>

<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>

{card.map((c,i)=>(
<div key={i} style={{border:"1px solid #ccc",padding:20}}>

{c}

</div>
))}

</div>

<h2>Events</h2>

{state && state.triggered.map((e,i)=>(
<div key={i}>{e}</div>
))}

</div>

)

}
