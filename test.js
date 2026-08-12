import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shklbnxxpcioavsplbem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoa2xibnh4cGNpb2F2c3BsYmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTQzODcsImV4cCI6MjEwMTc3MDM4N30.xG1YWOQAX4jiD3M66OFRByK5R85-a2MaAIAxKPca4RM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAll() {
  const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
    email: 'test_1786488878952@example.com',
    password: 'password123'
  });

  if (authErr2) {
    console.error('Auth2 err', authErr2.message);
    return;
  }
  
  // Try to insert a message to Josue
  const { data: msgData, error: msgErr } = await supabase.from('messages').insert({
    sender_id: authData2.user.id,
    receiver_id: '44d583c6-5623-44d8-8ad1-794c4738ede5', // Josue's ID
    content: 'Testing schema cache fix!',
    created_at: new Date().toISOString()
  }).select();

  console.log('Insert Message Result:', msgData);
  if (msgErr) console.error('Insert Message Error:', msgErr);

  // Try to insert follower
  const { data: folData, error: folErr } = await supabase.from('followers').insert({
    follower_id: authData2.user.id,
    following_id: '44d583c6-5623-44d8-8ad1-794c4738ede5' // Josue
  }).select();

  console.log('Insert Follower Result:', folData);
  if (folErr) console.error('Insert Follower Error:', folErr);
}

testAll();
