const API_BASE = (window.GALLERY_API_URL || 'http://localhost:3000') + '/api';
async function apiRequest(path,options={}){
 const token=sessionStorage.getItem('gc_token');
 const response=await fetch(API_BASE+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Erro na API');return data;
}
