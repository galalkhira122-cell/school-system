const URL =
"https://script.google.com/macros/s/AKfycbzwiyLbdTaH2WaJzoRB_b7BIU_N1Ynq-_2NjZ_VBiIvw9Ea1itvPtss2TlmFqF0YHPT/exec";

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