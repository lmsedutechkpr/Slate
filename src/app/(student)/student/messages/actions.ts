'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');
  if (!body?.trim()) throw new Error('Empty message');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.trim(),
    })
    .select('id, body, created_at, is_read, sender_id, read_at')
    .single();

  if (error) throw new Error(error.message);

  // Update conversation last_message_at (preview is handled via client-side state)
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  revalidatePath('/student/messages');
  return data;
}
