
import {useEffect,useState} from "react"
import {io} from "socket.io-client"

let token=localStorage.getItem("bingoToken")
const socket=io({auth:{token}})

export default function Player(){

const [card,setCard]=useState(null)
const [state,setState]=useState(null)

useEffect(()=>{

socket.on("token",(t)=>{
 localStorage.setItem("bingoToken",t)
 token=t
})

socket.on("card",setCard)
socket.on("state",setState)

},[])

if(!card) return <div className="container">Loading…</div>

return(
<div className="container">

<h1>Bingo Live</h1>

<div className="card-grid">

{card.map((c,i)=>{

 const active=state?.triggered.includes(c)

 return(
 <div key={i} className={"cell "+(active?"active":"")}>
 {c}
 </div>
 )

})}

</div>

</div>
)
}
