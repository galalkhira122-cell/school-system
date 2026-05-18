const URL =
"https://script.google.com/macros/s/AKfycbxFW9pUMwEHO7MTboROU6ozFHeWfO9NM3pzxFcMs0fLc7AweL3HQg19TsVW54_WLIdv/exec";

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