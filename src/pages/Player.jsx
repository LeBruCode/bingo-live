
import {useEffect,useState} from "react"
import {io} from "socket.io-client"

let token=localStorage.getItem("bingoToken")
const socket=io({auth:{token}})

export default function Player(){

const [card,setCard]=useState(null)
const [state,setState]=useState(null)
const [stage,setStage]=useState(null)
const [name,setName]=useState("")
const [email,setEmail]=useState("")

useEffect(()=>{

socket.on("token",(t)=>{
 localStorage.setItem("bingoToken",t)
 token=t
})

socket.on("card",setCard)
socket.on("state",(s)=>{
 setState(s)

 if(s.winners.one.includes(token)) setStage("one")
 if(s.winners.two.includes(token)) setStage("two")
 if(s.winners.three.includes(token)) setStage("three")
 if(s.winners.full.includes(token)) setStage("full")
})

},[])

async function participate(){

const r=await fetch("/api/participate",{
 method:"POST",
 headers:{"Content-Type":"application/json"},
 body:JSON.stringify({token,stage,name,email})
})

const d=await r.json()

if(d.error){
 alert("Participation refusée: "+d.error)
}else{
 alert("Participation enregistrée")
}

}

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

{stage && (

<div className="modal">

<h2>🎉 Vous avez une ligne !</h2>

<p>Participez au tirage au sort</p>

<input placeholder="Prénom" value={name} onChange={e=>setName(e.target.value)}/>
<br/>
<input placeholder="Email Ulule" value={email} onChange={e=>setEmail(e.target.value)}/>
<br/>
<button className="button" onClick={participate}>Participer au tirage</button>

</div>

)}

</div>
)
}
