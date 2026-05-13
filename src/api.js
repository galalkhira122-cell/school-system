const URL =
"https://script.google.com/macros/s/AKfycbxB_GR5H4H9OSUVOt0jAkGNZ81mdF__7KLtD9xx5oy-gRAl8jcmhwGYr50vr-M4FXm8/exec";

export async function callAPI(
  action,
  data={}
){

  const res =
    await fetch(URL,{

      method:"POST",

      body:JSON.stringify({

        action:action,

        data:data

      })

    });

  return await res.json();

}