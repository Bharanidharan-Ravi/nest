import { useState,useEffect } from "react";
const AvatarCell=({PreviewUrl})=>{
    const[compressedsrc,setcompressedsrc]=useState(null);    

    useEffect(()=>{
        if(!PreviewUrl) return;
        const img= new Image();
        img.crossOrigin="anonymous";
        img.onload=()=>{
            try{
            const canvas =document.createElement("canvas");
            canvas.width=48;
            canvas.height=48;
            const ctx =canvas.getContext("2d");
            ctx.drawImage(img,0,0,48,48);
            setcompressedsrc(canvas.toDataURL("image/webp",0.8));
            }catch(e){
                console.warn("Canvas CORS error",e)
                setcompressedsrc(PreviewUrl)
            }
        }
        img.onerror=()=>setcompressedsrc(null)
        img.src=PreviewUrl;       
    },[PreviewUrl]);

    return(
        <div className="flex items-center justify-center h-12 w-12">
            <img
            className="h-12 w-12 rounded-ful object-cover border"
            src={compressedsrc||"default-avatar-path.jpg"}
            alt="Avatar"
            />
        </div>
    )
}

export default AvatarCell