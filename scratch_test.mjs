

const url = 'https://shklbnxxpcioavsplbem.supabase.co/rest/v1/messages?select=*&order=created_at.desc&limit=5';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoa2xibnh4cGNpb2F2c3BsYmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTQzODcsImV4cCI6MjEwMTc3MDM4N30.xG1YWOQAX4jiD3M66OFRByK5R85-a2MaAIAxKPca4RM';

async function check() {
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
