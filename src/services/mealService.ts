import { requireSupabase } from '../lib/supabase';

export type Meal = {
  id: string;
  name: string;
  description: string | null;
  calories: number | null;
  consumed_at: string;
};

async function currentUserId() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Entre na sua conta para acessar suas refeições.');
  return data.user.id;
}

export async function getMealsForToday(): Promise<Meal[]> {
  const client = requireSupabase();
  const userId = await currentUserId();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data, error } = await client
    .from('meals')
    .select('id, name, description, calories, consumed_at')
    .eq('user_id', userId)
    .gte('consumed_at', start.toISOString())
    .lt('consumed_at', end.toISOString())
    .order('consumed_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addMeal(input: { name: string; description?: string; calories?: number }) {
  const client = requireSupabase();
  const userId = await currentUserId();
  const { data, error } = await client
    .from('meals')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      calories: input.calories ?? null,
    })
    .select('id, name, description, calories, consumed_at')
    .single();
  if (error) throw new Error(error.message);
  return data as Meal;
}
