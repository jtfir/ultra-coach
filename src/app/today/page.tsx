import React from "react";

/**
 * Today page displays the user's training plan for the current day.
 * In a complete implementation you would fetch the plan from your Supabase
 * database using the current date and the authenticated user ID.  
 * For example:
 * const { data } = await supabase
 *   .from('plan_days')
 *   .select('payload')
 *   .eq('user_id', userId)
 *   .eq('plan_date', todayISO)
 *   .single();
 */
export default function TodayPage() {
  return (
    <section>
      <h1 style={{ marginBottom: "1rem" }}>Today's Plan</h1>
      <p>
        This page will show your scheduled run, strength, mobility work and supplement
        reminders for the current day once you have generated a plan and logged in.
      </p>
      <p>
        To populate your plan, make sure to run the seeding endpoint and then check
        back here.
      </p>
    </section>
  );
}
