export async function updateStreak(userId: string, supabase: any): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: streak } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!streak) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    return
  }

  if (streak.last_activity_date === today) return

  const lastDate = new Date(streak.last_activity_date)
  const todayDate = new Date(today)
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  const newStreak = daysDiff === 1 ? streak.current_streak + 1 : 1

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak ?? 0),
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}
