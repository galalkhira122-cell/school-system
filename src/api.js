const URL =
"https://script.google.com/macros/s/AKfycbxMrYmJZrzicwZcQ785SU0bEJC9krCIjuPKEoF1p9F3h5RJVxhzMiChLhNgd7dN-x88/exec";

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